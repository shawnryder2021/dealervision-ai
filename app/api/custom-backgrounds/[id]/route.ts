import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * PATCH /api/custom-backgrounds/[id]
 * Update a custom background (name, description, is_favorite)
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const updates: {
      name?: string;
      description?: string | null;
      is_favorite?: boolean;
      updated_at?: string;
    } = {};

    if (typeof body.name === "string") updates.name = body.name.trim();
    if (body.description !== undefined) updates.description = body.description;
    if (typeof body.is_favorite === "boolean")
      updates.is_favorite = body.is_favorite;

    updates.updated_at = new Date().toISOString();

    const { error } = await supabase
      .from("custom_backgrounds")
      .update(updates)
      .eq("id", id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error updating custom background:", error);
    const message =
      error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/**
 * DELETE /api/custom-backgrounds/[id]
 * Delete a custom background
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { error } = await supabase
      .from("custom_backgrounds")
      .delete()
      .eq("id", id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting custom background:", error);
    const message =
      error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
