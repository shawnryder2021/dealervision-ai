import { createClient } from "@/lib/supabase/client";
import { isDemoMode } from "@/lib/demo-data";
import {
  getPlannedContent as localGetAll,
  addPlannedContent as localAdd,
  updatePlannedContent as localUpdate,
  deletePlannedContent as localDelete,
} from "@/lib/planned-content";
import type { PlannedContent } from "@/lib/planned-content";

export type { PlannedContent };

export async function getPlannedContent(
  dealershipId: string,
  month?: { year: number; month: number }
): Promise<PlannedContent[]> {
  if (isDemoMode()) {
    const all = localGetAll();
    if (!month) return all;
    const prefix = `${month.year}-${String(month.month).padStart(2, "0")}`;
    return all.filter((item) => item.date.startsWith(prefix));
  }
  const supabase = createClient();
  let query = supabase
    .from("planned_content")
    .select("*")
    .eq("dealership_id", dealershipId)
    .order("date", { ascending: true });

  if (month) {
    const start = `${month.year}-${String(month.month).padStart(2, "0")}-01`;
    const end = `${month.year}-${String(month.month).padStart(2, "0")}-31`;
    query = query.gte("date", start).lte("date", end);
  }

  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as PlannedContent[];
}

export async function addPlannedContent(
  dealershipId: string,
  item: Omit<PlannedContent, "id" | "created_at">
): Promise<PlannedContent> {
  if (isDemoMode()) {
    return localAdd(item);
  }
  const supabase = createClient();
  const { data, error } = await supabase
    .from("planned_content")
    .insert({ ...item, dealership_id: dealershipId })
    .select()
    .single();
  if (error) throw error;
  return data as PlannedContent;
}

export async function updatePlannedContent(
  dealershipId: string,
  id: string,
  updates: Partial<PlannedContent>
): Promise<PlannedContent | null> {
  if (isDemoMode()) {
    return localUpdate(id, updates);
  }
  const supabase = createClient();
  const { data, error } = await supabase
    .from("planned_content")
    .update(updates)
    .eq("id", id)
    .eq("dealership_id", dealershipId)
    .select()
    .single();
  if (error) throw error;
  return data as PlannedContent;
}

export async function deletePlannedContent(
  dealershipId: string,
  id: string
): Promise<void> {
  if (isDemoMode()) {
    localDelete(id);
    return;
  }
  const supabase = createClient();
  const { error } = await supabase
    .from("planned_content")
    .delete()
    .eq("id", id)
    .eq("dealership_id", dealershipId);
  if (error) throw error;
}
