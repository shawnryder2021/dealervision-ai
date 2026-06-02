/**
 * Brand Memory API (authenticated, dealership-scoped).
 *
 * GET   /api/brand-memory   — return the dealership's current brand_memory
 * PATCH /api/brand-memory   — save manual notes and/or approve a learned summary
 *                             body: { manual_notes?, learned_summary?, preferences? }
 *
 * Honors the admin "work as client" X-Dealership-Id header for super admins.
 */
import { NextRequest, NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { isSuperAdmin } from "@/lib/db/admin";
import type { BrandMemory } from "@/lib/types";

async function resolveDealership(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { dealershipId: null as string | null, isAdmin: false };

  const isAdmin = user.email ? await isSuperAdmin(user.email) : false;
  const headerDealershipId = request.headers.get("X-Dealership-Id");

  if (isAdmin && headerDealershipId) {
    return { dealershipId: headerDealershipId, isAdmin };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("dealership_id")
    .eq("id", user.id)
    .single();

  return { dealershipId: profile?.dealership_id ?? null, isAdmin };
}

export async function GET(request: NextRequest) {
  try {
    const { dealershipId } = await resolveDealership(request);
    if (!dealershipId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const service = await createServiceClient();
    const { data, error } = await service
      .from("dealerships")
      .select("brand_memory")
      .eq("id", dealershipId)
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ brand_memory: (data?.brand_memory ?? {}) as BrandMemory });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const { dealershipId } = await resolveDealership(request);
    if (!dealershipId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const service = await createServiceClient();

    // Load existing so we merge rather than clobber.
    const { data: existing } = await service
      .from("dealerships")
      .select("brand_memory")
      .eq("id", dealershipId)
      .single();

    const current: BrandMemory = (existing?.brand_memory ?? {}) as BrandMemory;
    const next: BrandMemory = { ...current };

    if (typeof body.manual_notes === "string") {
      next.manual_notes = body.manual_notes.slice(0, 4000);
    }
    if (typeof body.learned_summary === "string") {
      next.learned_summary = body.learned_summary.slice(0, 4000);
      next.updated_at = new Date().toISOString();
    }
    if (body.preferences && typeof body.preferences === "object") {
      const p = body.preferences as Record<string, unknown>;
      const clean = (v: unknown): string[] =>
        Array.isArray(v) ? v.filter((x) => typeof x === "string").slice(0, 5) : [];
      next.preferences = {
        tones: clean(p.tones),
        styles: clean(p.styles),
        channels: clean(p.channels),
        featured_models: clean(p.featured_models),
        recurring_offers: clean(p.recurring_offers),
      };
      next.updated_at = new Date().toISOString();
    }

    const { error } = await service
      .from("dealerships")
      .update({ brand_memory: next })
      .eq("id", dealershipId);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ brand_memory: next });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
