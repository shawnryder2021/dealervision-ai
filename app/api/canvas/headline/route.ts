import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { buildBrandMemoryBlock } from "@/lib/brand-memory";

const KIE_CHAT_URL = "https://api.kie.ai/gpt-5-2/v1/chat/completions";

type CopyKind = "headline" | "subheadline" | "cta";

const SYSTEM_PROMPTS: Record<CopyKind, string> = {
  headline: `You write punchy automotive marketing headlines.
Output: a JSON array of EXACTLY 5 headline strings. No prose. No markdown.
Each headline ≤ 7 words. Use only facts provided. Mix tones: excited, value, urgency, premium, family-friendly.
Never invent prices, mileage, or specs.`,
  subheadline: `You write supporting subheadlines for automotive marketing graphics.
Output: a JSON array of EXACTLY 5 subheadline strings. No prose. No markdown.
Each ≤ 12 words, complements a headline with a concrete benefit or detail. Use only facts provided.
Never invent prices, mileage, or specs.`,
  cta: `You write short calls-to-action for car dealership marketing.
Output: a JSON array of EXACTLY 5 CTA strings. No prose. No markdown.
Each ≤ 4 words, starts with an action verb (e.g. "Visit Today", "Call Now", "Book a Test Drive"). Use only facts provided.
Never invent prices, mileage, or specs.`,
};

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const goal: string = body.goal || "Promote this vehicle";
    const dealership = body.dealership;
    const vehicle = body.vehicle;
    const tone: string = body.tone || "any";
    const kind: CopyKind = SYSTEM_PROMPTS[body.kind as CopyKind] ? body.kind : "headline";

    const apiKey = process.env.KIE_API_KEY;
    if (!apiKey) return NextResponse.json({ error: "API key not configured" }, { status: 500 });

    const lines: string[] = [];
    if (vehicle) {
      lines.push(`Vehicle: ${[vehicle.year, vehicle.make, vehicle.model, vehicle.trim].filter(Boolean).join(" ")}`);
      if (vehicle.price) lines.push(`Price: $${Number(vehicle.price).toLocaleString()}`);
      if (vehicle.mileage) lines.push(`Mileage: ${Number(vehicle.mileage).toLocaleString()} mi`);
    }
    if (dealership?.name) lines.push(`Dealership: ${dealership.name}`);
    if (dealership?.local_context?.personality) lines.push(`Brand voice: ${dealership.local_context.personality}`);
    const memBlock = buildBrandMemoryBlock(dealership, "copy").trim();
    if (memBlock) lines.push(memBlock);

    const userPrompt = `GOAL: ${goal}\nTONE: ${tone}\n\nCONTEXT:\n${lines.join("\n") || "(none)"}\n\nReturn 5 ${kind} options as a JSON array.`;

    const res = await fetch(KIE_CHAT_URL, {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        messages: [
          { role: "system", content: SYSTEM_PROMPTS[kind] },
          { role: "user", content: userPrompt },
        ],
        reasoning_effort: "low",
      }),
    });
    if (!res.ok) {
      const errText = await res.text();
      return NextResponse.json({ error: `Headline generation failed: ${errText}` }, { status: 502 });
    }
    const data = await res.json();
    const raw: string = data.choices?.[0]?.message?.content ?? "[]";
    let headlines: string[] = [];
    try {
      const parsed = JSON.parse(raw);
      headlines = Array.isArray(parsed) ? parsed : [];
    } catch {
      const match = raw.match(/\[[\s\S]*\]/);
      if (match) {
        try {
          headlines = JSON.parse(match[0]);
        } catch {}
      }
      if (headlines.length === 0) {
        headlines = raw
          .split(/\n+/)
          .map((s) => s.replace(/^[\s\d.\-*"']+/, "").replace(/["',]+$/, "").trim())
          .filter((s) => s.length > 2 && s.length < 80)
          .slice(0, 5);
      }
    }
    return NextResponse.json({ headlines: headlines.slice(0, 5) });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
