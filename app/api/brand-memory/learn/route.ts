/**
 * Brand Memory — Learn (summarizer).
 *
 * POST /api/brand-memory/learn
 * Reads the dealership's recent generation activity from generated_assets,
 * asks gpt-5-2 to distill a learned profile, and RETURNS the proposal.
 * It does NOT save — the dealer reviews and approves via PATCH /api/brand-memory.
 *
 * Honors the admin "work as client" X-Dealership-Id header for super admins.
 */
import { NextRequest, NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { isSuperAdmin } from "@/lib/db/admin";
import {
  BRAND_MEMORY_SYSTEM_PROMPT,
  buildSummarizerUserPrompt,
  type ActivitySignal,
} from "@/lib/brand-memory";
import type { BrandMemory } from "@/lib/types";

const KIE_CHAT_URL = "https://api.kie.ai/gpt-5-2/v1/chat/completions";
const MAX_ASSETS = 60;

async function resolveDealership(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { dealershipId: null as string | null };

  const isAdmin = user.email ? await isSuperAdmin(user.email) : false;
  const headerDealershipId = request.headers.get("X-Dealership-Id");
  if (isAdmin && headerDealershipId) return { dealershipId: headerDealershipId };

  const { data: profile } = await supabase
    .from("profiles")
    .select("dealership_id")
    .eq("id", user.id)
    .single();
  return { dealershipId: profile?.dealership_id ?? null };
}

export async function POST(request: NextRequest) {
  try {
    const { dealershipId } = await resolveDealership(request);
    if (!dealershipId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const apiKey = process.env.KIE_API_KEY;
    if (!apiKey) return NextResponse.json({ error: "API key not configured" }, { status: 500 });

    const service = await createServiceClient();

    // Dealership name + existing memory for context
    const { data: dealer } = await service
      .from("dealerships")
      .select("name, brand_memory")
      .eq("id", dealershipId)
      .single();

    // Recent completed assets + their vehicle (for make/model signal)
    const { data: assets } = await service
      .from("generated_assets")
      .select("content_type, channel, metadata, campaign, vehicle:vehicles(make, model)")
      .eq("dealership_id", dealershipId)
      .eq("status", "completed")
      .order("created_at", { ascending: false })
      .limit(MAX_ASSETS);

    const rows = assets ?? [];
    if (rows.length < 3) {
      return NextResponse.json(
        {
          error:
            "Not enough activity yet. Generate a few more marketing pieces, then refresh — the AI needs some history to learn from.",
          insufficient: true,
        },
        { status: 422 }
      );
    }

    const signals: ActivitySignal[] = rows.map((r) => {
      const meta = (r.metadata ?? {}) as Record<string, unknown>;
      const v = (r as { vehicle?: { make?: string; model?: string } | null }).vehicle;
      const vehicle = v ? [v.make, v.model].filter(Boolean).join(" ") : null;
      const headline = typeof meta.headline === "string" ? meta.headline : null;
      const style = typeof meta.style === "string" ? meta.style : null;
      return {
        content_type: r.content_type,
        channel: r.channel,
        style,
        headline,
        vehicle: vehicle || null,
        campaign: r.campaign ?? null,
      };
    });

    const userPrompt = buildSummarizerUserPrompt({
      dealershipName: dealer?.name,
      existing: (dealer?.brand_memory ?? {}) as BrandMemory,
      signals,
    });

    const res = await fetch(KIE_CHAT_URL, {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        messages: [
          { role: "system", content: BRAND_MEMORY_SYSTEM_PROMPT },
          { role: "user", content: userPrompt },
        ],
        reasoning_effort: "low",
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      return NextResponse.json({ error: `Learning failed: ${errText}` }, { status: 502 });
    }

    const data = await res.json();
    const raw: string = data.choices?.[0]?.message?.content ?? "{}";

    let parsed: { learned_summary?: string; preferences?: BrandMemory["preferences"] } = {};
    try {
      parsed = JSON.parse(raw);
    } catch {
      const match = raw.match(/\{[\s\S]*\}/);
      if (match) {
        try {
          parsed = JSON.parse(match[0]);
        } catch {
          /* fall through */
        }
      }
    }

    const clean = (v: unknown): string[] =>
      Array.isArray(v) ? v.filter((x) => typeof x === "string").slice(0, 5) : [];

    const proposal: BrandMemory = {
      learned_summary: typeof parsed.learned_summary === "string" ? parsed.learned_summary.trim() : "",
      preferences: {
        tones: clean(parsed.preferences?.tones),
        styles: clean(parsed.preferences?.styles),
        channels: clean(parsed.preferences?.channels),
        featured_models: clean(parsed.preferences?.featured_models),
        recurring_offers: clean(parsed.preferences?.recurring_offers),
      },
    };

    if (!proposal.learned_summary) {
      return NextResponse.json({ error: "The AI couldn't produce a summary — try again." }, { status: 502 });
    }

    return NextResponse.json({ proposal, analyzed: rows.length });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
