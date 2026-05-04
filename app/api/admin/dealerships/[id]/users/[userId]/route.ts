/**
 * Admin: Update or remove a specific user from a dealership
 * PATCH  /api/admin/dealerships/[id]/users/[userId]
 * DELETE /api/admin/dealerships/[id]/users/[userId]
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { isSuperAdmin } from "@/lib/db/admin";

async function guardAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user?.email || !(await isSuperAdmin(user.email))) return null;
  return user;
}

// ── PATCH: update role or full_name ──────────────────────────────────────────
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; userId: string }> }
) {
  if (!(await guardAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const { id: dealershipId, userId } = await params;
  const body = await request.json();
  const { role, full_name } = body;

  if (role && !["owner", "admin", "member"].includes(role)) {
    return NextResponse.json({ error: "Invalid role" }, { status: 400 });
  }

  const adminSupabase = await createServiceClient();

  const patch: Record<string, string> = {};
  if (role) patch.role = role;
  if (full_name !== undefined) patch.full_name = full_name;

  const { error } = await adminSupabase
    .from("profiles")
    .update(patch)
    .eq("id", userId)
    .eq("dealership_id", dealershipId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ message: "User updated" });
}

// ── DELETE: remove user from dealership (deletes auth account entirely) ──────
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; userId: string }> }
) {
  if (!(await guardAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const { id: dealershipId, userId } = await params;
  const adminSupabase = await createServiceClient();

  // Confirm the profile belongs to this dealership
  const { data: profile } = await adminSupabase
    .from("profiles")
    .select("id, role")
    .eq("id", userId)
    .eq("dealership_id", dealershipId)
    .single();

  if (!profile) {
    return NextResponse.json(
      { error: "User not found in this dealership" },
      { status: 404 }
    );
  }

  // Delete profile (auth user deletion cascades via FK)
  await adminSupabase.from("profiles").delete().eq("id", userId);

  // Delete auth user
  const { error: authError } = await adminSupabase.auth.admin.deleteUser(userId);
  if (authError) {
    console.error("Auth user deletion error:", authError);
    // Profile already removed — log but don't fail the response
  }

  return NextResponse.json({ message: "User removed" });
}
