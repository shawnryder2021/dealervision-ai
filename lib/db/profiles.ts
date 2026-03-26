import { createClient } from "@/lib/supabase/client";
import { isDemoMode } from "@/lib/demo-data";
import { useAppStore } from "@/lib/store";
import type { Profile } from "@/lib/types";

export async function getProfile(userId: string): Promise<Profile | null> {
  if (isDemoMode()) {
    return useAppStore.getState().profile;
  }
  const supabase = createClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .single();
  if (error) throw error;
  return data as Profile;
}

export async function updateProfile(
  userId: string,
  updates: { full_name?: string }
): Promise<Profile> {
  if (isDemoMode()) {
    const current = useAppStore.getState().profile;
    const updated = { ...current, ...updates } as Profile;
    useAppStore.getState().setProfile(updated);
    return updated;
  }
  const supabase = createClient();
  const { data, error } = await supabase
    .from("profiles")
    .update(updates)
    .eq("id", userId)
    .select()
    .single();
  if (error) throw error;
  return data as Profile;
}
