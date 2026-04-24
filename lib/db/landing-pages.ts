import { createClient } from "@/lib/supabase/client";
import { isDemoMode } from "@/lib/demo-data";
import {
  getLandingPages as localGetPages,
  getLandingPage as localGetPage,
  saveLandingPage as localSavePage,
  deleteLandingPage as localDeletePage,
} from "@/lib/landing-pages";
import type { LandingPage } from "@/lib/landing-pages";

export type { LandingPage };

function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value
  );
}

export async function getLandingPages(dealershipId: string): Promise<LandingPage[]> {
  if (isDemoMode()) {
    return localGetPages();
  }
  const supabase = createClient();
  const { data, error } = await supabase
    .from("landing_pages")
    .select("*")
    .eq("dealership_id", dealershipId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as LandingPage[];
}

export async function getLandingPage(
  dealershipId: string,
  idOrSlug: string
): Promise<LandingPage | null> {
  if (isDemoMode()) {
    return localGetPage(idOrSlug);
  }
  const supabase = createClient();
  const { data, error } = await supabase
    .from("landing_pages")
    .select("*")
    .eq("dealership_id", dealershipId)
    .or(`id.eq.${idOrSlug},slug.eq.${idOrSlug}`)
    .single();
  if (error) return null;
  return data as LandingPage;
}

export async function saveLandingPage(
  dealershipId: string,
  page: LandingPage
): Promise<LandingPage> {
  if (isDemoMode()) {
    return localSavePage(page);
  }
  const supabase = createClient();
  const now = new Date().toISOString();
  const payload = { ...page, dealership_id: dealershipId, updated_at: now };
  const hasValidUuid = isUuid(page.id);

  // Try update first, then insert.
  // Older client-generated IDs like "lp-123456" are not UUIDs and will fail
  // against the UUID id column, so we update by slug in that case.
  const existingQuery = supabase
    .from("landing_pages")
    .select("id")
    .eq("dealership_id", dealershipId);

  const { data: existing } = await (hasValidUuid
    ? existingQuery.eq("id", page.id)
    : existingQuery.eq("slug", page.slug))
    .maybeSingle();

  let result;
  if (existing) {
    const { data, error } = await supabase
      .from("landing_pages")
      .update(payload)
      .eq("id", existing.id)
      .select()
      .single();
    if (error) throw error;
    result = data;
  } else {
    const insertPayload = hasValidUuid ? { ...payload, id: page.id } : payload;
    if (!hasValidUuid) {
      delete (insertPayload as { id?: string }).id;
    }
    const { data, error } = await supabase
      .from("landing_pages")
      .insert({ ...insertPayload, created_at: now })
      .select()
      .single();
    if (error) throw error;
    result = data;
  }
  return result as LandingPage;
}

export async function deleteLandingPage(
  dealershipId: string,
  id: string
): Promise<void> {
  if (isDemoMode()) {
    localDeletePage(id);
    return;
  }
  const supabase = createClient();
  const { error } = await supabase
    .from("landing_pages")
    .delete()
    .eq("id", id)
    .eq("dealership_id", dealershipId);
  if (error) throw error;
}

/**
 * Get a published landing page by dealership slug and page slug (public access, no auth required)
 * Returns null if not found or not published
 */
export async function getPublicLandingPage(
  dealershipSlug: string,
  pageSlug: string
): Promise<LandingPage | null> {
  if (isDemoMode()) {
    // In demo mode, just return null for public pages
    return null;
  }
  const supabase = createClient();

  // First, find the dealership by slug
  const { data: dealership, error: dealershipError } = await supabase
    .from("dealerships")
    .select("id")
    .eq("slug", dealershipSlug)
    .single();

  if (dealershipError || !dealership) {
    return null;
  }

  // Then, find the published landing page by dealership_id and slug
  const { data, error } = await supabase
    .from("landing_pages")
    .select("*")
    .eq("dealership_id", dealership.id)
    .eq("slug", pageSlug)
    .eq("status", "published")
    .single();

  if (error || !data) {
    return null;
  }

  return data as LandingPage;
}
