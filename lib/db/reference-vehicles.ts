/**
 * Admin-curated reference vehicles — used to improve AI generation accuracy.
 *
 * At generation time we look up matching reference photos by year/make/model/trim
 * (best-match: exact-trim → null-trim → looser fallback) and pass the URLs as
 * `image_input` to the image provider.
 */

import { createClient } from "@/lib/supabase/server";

export interface ReferenceVehicle {
  id: string;
  year: number;
  make: string;
  model: string;
  trim: string | null;
  color: string | null;
  image_url: string;
  thumbnail_url: string | null;
  notes: string | null;
  is_active: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateReferenceVehicleInput {
  year: number;
  make: string;
  model: string;
  trim?: string | null;
  color?: string | null;
  image_url: string;
  thumbnail_url?: string | null;
  notes?: string | null;
}

export interface MatchCriteria {
  year?: number | null;
  make?: string | null;
  model?: string | null;
  trim?: string | null;
  /** Maximum number of references to return. Defaults to 3. */
  limit?: number;
}

/**
 * Returns reference image URLs that best match the given vehicle criteria.
 *
 * Match priority (each tier tried in order, first one with results wins):
 *   1. exact year + make + model + trim
 *   2. exact year + make + model (any trim)
 *   3. make + model + trim (any year)
 *   4. make + model (any year, any trim)
 *
 * `make` and `model` are case-insensitive. Returns at most `limit` URLs.
 */
export async function findMatchingReferenceImages(
  criteria: MatchCriteria
): Promise<string[]> {
  const { year, make, model, trim, limit = 3 } = criteria;

  // Make + model are required for any meaningful match.
  if (!make || !model) return [];

  const supabase = await createClient();

  // Case-insensitive matching. Postgres `ilike` works without wildcards as `=` ignoring case.
  const baseQuery = supabase
    .from("reference_vehicles")
    .select("image_url")
    .eq("is_active", true)
    .ilike("make", make.trim())
    .ilike("model", model.trim());

  // Tier 1: exact year + trim
  if (year && trim) {
    const { data } = await baseQuery.eq("year", year).ilike("trim", trim.trim()).limit(limit);
    if (data && data.length > 0) return data.map((r) => r.image_url);
  }

  // Tier 2: exact year (any trim)
  if (year) {
    const { data } = await supabase
      .from("reference_vehicles")
      .select("image_url")
      .eq("is_active", true)
      .ilike("make", make.trim())
      .ilike("model", model.trim())
      .eq("year", year)
      .limit(limit);
    if (data && data.length > 0) return data.map((r) => r.image_url);
  }

  // Tier 3: trim only (any year)
  if (trim) {
    const { data } = await supabase
      .from("reference_vehicles")
      .select("image_url")
      .eq("is_active", true)
      .ilike("make", make.trim())
      .ilike("model", model.trim())
      .ilike("trim", trim.trim())
      .limit(limit);
    if (data && data.length > 0) return data.map((r) => r.image_url);
  }

  // Tier 4: make + model (any year, any trim) — broadest fallback
  const { data } = await supabase
    .from("reference_vehicles")
    .select("image_url")
    .eq("is_active", true)
    .ilike("make", make.trim())
    .ilike("model", model.trim())
    .limit(limit);
  return data ? data.map((r) => r.image_url) : [];
}

/** List all reference vehicles, optionally filtered. Admin-side. */
export async function listReferenceVehicles(filters?: {
  make?: string;
  model?: string;
  year?: number;
}): Promise<ReferenceVehicle[]> {
  const supabase = await createClient();
  let query = supabase
    .from("reference_vehicles")
    .select("*")
    .order("make", { ascending: true })
    .order("model", { ascending: true })
    .order("year", { ascending: false });

  if (filters?.make) query = query.ilike("make", filters.make);
  if (filters?.model) query = query.ilike("model", filters.model);
  if (filters?.year) query = query.eq("year", filters.year);

  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return (data ?? []) as ReferenceVehicle[];
}

export async function createReferenceVehicle(
  input: CreateReferenceVehicleInput,
  createdBy: string | null
): Promise<ReferenceVehicle> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("reference_vehicles")
    .insert({
      year: input.year,
      make: input.make.trim(),
      model: input.model.trim(),
      trim: input.trim?.trim() || null,
      color: input.color?.trim() || null,
      image_url: input.image_url,
      thumbnail_url: input.thumbnail_url || null,
      notes: input.notes?.trim() || null,
      created_by: createdBy,
    })
    .select()
    .single();
  if (error || !data) throw new Error(error?.message || "Failed to create reference vehicle");
  return data as ReferenceVehicle;
}

export async function deleteReferenceVehicle(id: string): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.from("reference_vehicles").delete().eq("id", id);
  if (error) throw new Error(error.message);
}

export async function setReferenceVehicleActive(
  id: string,
  isActive: boolean
): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("reference_vehicles")
    .update({ is_active: isActive, updated_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw new Error(error.message);
}
