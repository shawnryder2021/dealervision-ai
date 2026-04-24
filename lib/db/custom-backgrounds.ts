import { createClient } from "@/lib/supabase/client";

export interface CustomBackground {
  id: string;
  dealership_id: string;
  created_by: string | null;
  name: string;
  image_url: string;
  thumbnail_url: string | null;
  description: string | null;
  is_favorite: boolean;
  created_at: string;
  updated_at: string;
}

/**
 * List all custom backgrounds for a dealership
 */
export async function listCustomBackgrounds(
  dealershipId: string
): Promise<CustomBackground[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("custom_backgrounds")
    .select("*")
    .eq("dealership_id", dealershipId)
    .order("is_favorite", { ascending: false })
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error listing custom backgrounds:", error);
    return [];
  }
  return data || [];
}

/**
 * Create a new custom background for a dealership
 */
export async function createCustomBackground(params: {
  dealership_id: string;
  created_by?: string | null;
  name: string;
  image_url: string;
  thumbnail_url?: string | null;
  description?: string | null;
}): Promise<{ success: boolean; background?: CustomBackground; error?: string }> {
  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("custom_backgrounds")
      .insert({
        dealership_id: params.dealership_id,
        created_by: params.created_by ?? null,
        name: params.name.trim(),
        image_url: params.image_url,
        thumbnail_url: params.thumbnail_url ?? null,
        description: params.description ?? null,
      })
      .select()
      .single();

    if (error) throw error;
    return { success: true, background: data };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to create background";
    console.error("Error creating custom background:", error);
    return { success: false, error: message };
  }
}

/**
 * Update a custom background (name, description, favorite state)
 */
export async function updateCustomBackground(
  id: string,
  updates: Partial<{
    name: string;
    description: string | null;
    is_favorite: boolean;
  }>
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = createClient();
    const { error } = await supabase
      .from("custom_backgrounds")
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq("id", id);

    if (error) throw error;
    return { success: true };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to update";
    console.error("Error updating custom background:", error);
    return { success: false, error: message };
  }
}

/**
 * Delete a custom background
 */
export async function deleteCustomBackground(
  id: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = createClient();
    const { error } = await supabase
      .from("custom_backgrounds")
      .delete()
      .eq("id", id);

    if (error) throw error;
    return { success: true };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to delete";
    console.error("Error deleting custom background:", error);
    return { success: false, error: message };
  }
}
