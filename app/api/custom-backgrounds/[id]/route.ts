import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/client";
import {
  updateCustomBackground,
  deleteCustomBackground,
} from "@/lib/db/custom-backgrounds";

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
    const supabase = createClient();
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
    } = {};

    if (typeof body.name === "string") updates.name = body.name.trim();
    if (body.description !== undefined) updates.description = body.description;
    if (typeof body.is_favorite === "boolean")
      updates.is_favorite = body.is_favorite;

    const result = await updateCustomBackground(id, updates);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || "Failed to update" },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error updating custom background:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
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
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const result = await deleteCustomBackground(id);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || "Failed to delete" },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting custom background:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
