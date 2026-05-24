import { createServiceClient } from "@/lib/supabase/server";

/** Public-safe dealership fields surfaced to the embeddable widgets. */
export interface WidgetDealership {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  tagline: string | null;
  brand_colors: { primary?: string; secondary?: string; accent?: string } | null;
  contact: Record<string, unknown> | null;
  local_context: Record<string, unknown> | null;
  widget_settings: Record<string, unknown> | null;
}

/** Public-safe vehicle fields for widget pickers + chat inventory context. */
export interface WidgetVehicle {
  id: string;
  year: number | null;
  make: string | null;
  model: string | null;
  trim: string | null;
  price: number | null;
  mileage: number | null;
  photos: string[] | null;
  stock_number: string | null;
}

/**
 * Resolve a dealership by its public `slug` using the service role.
 * Returns only fields safe to expose on a public, unauthenticated widget.
 */
export async function getWidgetDealership(slug: string): Promise<WidgetDealership | null> {
  if (!slug) return null;
  const supabase = await createServiceClient();
  const { data } = await supabase
    .from("dealerships")
    .select("id, name, slug, logo_url, tagline, brand_colors, contact, local_context, widget_settings")
    .eq("slug", slug)
    .maybeSingle();
  return (data as WidgetDealership) ?? null;
}

/**
 * Fetch available vehicles for a dealership (newest first), optionally filtered by a free-text query.
 * Service-role read — only public-safe columns are returned.
 */
export async function getWidgetVehicles(
  dealershipId: string,
  opts: { q?: string; limit?: number } = {}
): Promise<WidgetVehicle[]> {
  const supabase = await createServiceClient();
  let query = supabase
    .from("vehicles")
    .select("id, year, make, model, trim, price, mileage, photos, stock_number")
    .eq("dealership_id", dealershipId)
    .eq("status", "available")
    .order("created_at", { ascending: false })
    .limit(opts.limit ?? 50);

  const q = opts.q?.trim();
  if (q) {
    // Match across make/model/trim. ilike on individual columns via OR.
    query = query.or(
      `make.ilike.%${q}%,model.ilike.%${q}%,trim.ilike.%${q}%`
    );
  }

  const { data } = await query;
  return (data as WidgetVehicle[]) ?? [];
}
