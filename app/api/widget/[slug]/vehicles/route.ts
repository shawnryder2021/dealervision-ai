/**
 * Public widget vehicle list.
 * GET /api/widget/[slug]/vehicles?q=...&limit=...
 * Unauthenticated — used by the trade-in / booking pickers and chat inventory context.
 */
import { NextRequest, NextResponse } from "next/server";
import { getWidgetDealership, getWidgetVehicles } from "@/lib/widgets/dealership";

export async function GET(
  request: NextRequest,
  ctx: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await ctx.params;
    const dealership = await getWidgetDealership(slug);
    if (!dealership) {
      return NextResponse.json({ error: "Dealership not found" }, { status: 404 });
    }

    const { searchParams } = new URL(request.url);
    const q = searchParams.get("q") ?? undefined;
    const limitRaw = parseInt(searchParams.get("limit") ?? "", 10);
    const limit = Number.isFinite(limitRaw) ? Math.min(Math.max(limitRaw, 1), 100) : 50;

    const vehicles = await getWidgetVehicles(dealership.id, { q, limit });
    return NextResponse.json({ vehicles });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load vehicles";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
