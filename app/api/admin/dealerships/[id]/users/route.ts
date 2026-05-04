/**
 * Admin: List and add users for a specific dealership
 * GET  /api/admin/dealerships/[id]/users
 * POST /api/admin/dealerships/[id]/users
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

// ── GET: list all users in a dealership ──────────────────────────────────────
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await guardAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const { id: dealershipId } = await params;
  const adminSupabase = await createServiceClient();

  // All profiles for this dealership
  const { data: profiles, error } = await adminSupabase
    .from("profiles")
    .select("id, full_name, role, created_at")
    .eq("dealership_id", dealershipId)
    .order("created_at", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Fetch emails from auth
  const { data: authData } = await adminSupabase.auth.admin.listUsers();
  const authById: Record<string, string> = {};
  (authData?.users || []).forEach((u) => {
    authById[u.id] = u.email || "";
  });

  const users = (profiles || []).map((p) => ({
    id: p.id,
    email: authById[p.id] || "",
    full_name: p.full_name,
    role: p.role,
    created_at: p.created_at,
  }));

  return NextResponse.json({ users });
}

// ── POST: create a new user and link to dealership ───────────────────────────
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await guardAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const { id: dealershipId } = await params;
  const body = await request.json();
  const { email, password, full_name, role = "member" } = body;

  if (!email || !password) {
    return NextResponse.json(
      { error: "email and password are required" },
      { status: 400 }
    );
  }
  if (!["owner", "admin", "member"].includes(role)) {
    return NextResponse.json({ error: "Invalid role" }, { status: 400 });
  }

  const adminSupabase = await createServiceClient();

  // Verify dealership exists
  const { data: dealership, error: dealershipError } = await adminSupabase
    .from("dealerships")
    .select("id, name")
    .eq("id", dealershipId)
    .single();

  if (dealershipError || !dealership) {
    return NextResponse.json({ error: "Dealership not found" }, { status: 404 });
  }

  // Create auth user
  const { data: authData, error: authError } = await adminSupabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });

  if (authError) {
    return NextResponse.json({ error: authError.message }, { status: 400 });
  }

  const newUserId = authData.user.id;

  // Create profile
  const { error: profileError } = await adminSupabase.from("profiles").insert({
    id: newUserId,
    dealership_id: dealershipId,
    full_name: full_name || email.split("@")[0],
    role,
  });

  if (profileError) {
    await adminSupabase.auth.admin.deleteUser(newUserId);
    return NextResponse.json({ error: profileError.message }, { status: 500 });
  }

  return NextResponse.json({
    user: {
      id: newUserId,
      email,
      full_name: full_name || email.split("@")[0],
      role,
    },
    message: "User created and added to dealership",
  });
}
