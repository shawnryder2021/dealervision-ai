import { createClient } from "@/lib/supabase/client";
import { isDemoMode } from "@/lib/demo-data";
import { useAppStore } from "@/lib/store";
import type { GeneratedAsset } from "@/lib/types";

export interface AssetFilters {
  contentType?: string;
  channel?: string;
  campaign?: string;
  isFavorite?: boolean;
  search?: string;
}

export async function getAssets(
  dealershipId: string,
  filters?: AssetFilters
): Promise<GeneratedAsset[]> {
  if (isDemoMode()) {
    let assets = useAppStore.getState().recentAssets;
    if (filters?.contentType) assets = assets.filter((a) => a.content_type === filters.contentType);
    if (filters?.channel) assets = assets.filter((a) => a.channel === filters.channel);
    if (filters?.campaign) assets = assets.filter((a) => a.campaign === filters.campaign);
    if (filters?.isFavorite) assets = assets.filter((a) => a.is_favorite);
    if (filters?.search) {
      const q = filters.search.toLowerCase();
      assets = assets.filter(
        (a) =>
          a.content_type.includes(q) ||
          a.channel.includes(q) ||
          (a.campaign ?? "").toLowerCase().includes(q)
      );
    }
    return assets;
  }
  const supabase = createClient();
  let query = supabase
    .from("generated_assets")
    .select("*")
    .eq("dealership_id", dealershipId)
    .eq("status", "completed")
    .order("created_at", { ascending: false });

  if (filters?.contentType) query = query.eq("content_type", filters.contentType);
  if (filters?.channel) query = query.eq("channel", filters.channel);
  if (filters?.campaign) query = query.eq("campaign", filters.campaign);
  if (filters?.isFavorite) query = query.eq("is_favorite", true);

  const { data, error } = await query;
  if (error) throw error;
  let assets = (data ?? []) as GeneratedAsset[];
  if (filters?.search) {
    const q = filters.search.toLowerCase();
    assets = assets.filter(
      (a) =>
        a.content_type.includes(q) ||
        a.channel.includes(q) ||
        (a.campaign ?? "").toLowerCase().includes(q) ||
        (a.metadata as Record<string, string>)?.headline?.toLowerCase().includes(q)
    );
  }
  return assets;
}

export async function getAsset(id: string): Promise<GeneratedAsset | null> {
  if (isDemoMode()) {
    return useAppStore.getState().recentAssets.find((a) => a.id === id) ?? null;
  }
  const supabase = createClient();
  const { data, error } = await supabase
    .from("generated_assets")
    .select("*")
    .eq("id", id)
    .single();
  if (error) throw error;
  return data as GeneratedAsset;
}

export async function updateAsset(
  id: string,
  updates: Partial<GeneratedAsset>
): Promise<GeneratedAsset> {
  if (isDemoMode()) {
    useAppStore.getState().updateAsset(id, updates);
    return useAppStore.getState().recentAssets.find((a) => a.id === id)!;
  }
  const supabase = createClient();
  const { data, error } = await supabase
    .from("generated_assets")
    .update(updates)
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data as GeneratedAsset;
}

export async function toggleFavorite(
  id: string,
  currentValue: boolean
): Promise<void> {
  if (isDemoMode()) {
    useAppStore.getState().updateAsset(id, { is_favorite: !currentValue });
    return;
  }
  const supabase = createClient();
  const { error } = await supabase
    .from("generated_assets")
    .update({ is_favorite: !currentValue })
    .eq("id", id);
  if (error) throw error;
}

export async function deleteAsset(id: string): Promise<void> {
  if (isDemoMode()) {
    const { recentAssets, setRecentAssets } = useAppStore.getState();
    setRecentAssets(recentAssets.filter((a) => a.id !== id));
    return;
  }
  const supabase = createClient();
  const { error } = await supabase.from("generated_assets").delete().eq("id", id);
  if (error) throw error;
}
