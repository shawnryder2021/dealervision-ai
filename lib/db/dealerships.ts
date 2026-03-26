import { createClient } from "@/lib/supabase/client";
import { isDemoMode } from "@/lib/demo-data";
import { useAppStore } from "@/lib/store";
import type { Dealership } from "@/lib/types";

export async function getDealership(id: string): Promise<Dealership | null> {
  if (isDemoMode()) {
    return useAppStore.getState().dealership;
  }
  const supabase = createClient();
  const { data, error } = await supabase
    .from("dealerships")
    .select("*")
    .eq("id", id)
    .single();
  if (error) throw error;
  return data as Dealership;
}

export async function updateDealership(
  id: string,
  updates: Partial<Dealership>
): Promise<Dealership> {
  if (isDemoMode()) {
    const current = useAppStore.getState().dealership;
    const updated = { ...current, ...updates, updated_at: new Date().toISOString() } as Dealership;
    useAppStore.getState().setDealership(updated);
    return updated;
  }
  const supabase = createClient();
  const { data, error } = await supabase
    .from("dealerships")
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data as Dealership;
}
