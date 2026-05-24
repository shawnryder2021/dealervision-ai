/**
 * Appointments API (authenticated, dealership-scoped).
 * GET   /api/appointments         — list test-drive requests for the dealership
 * PATCH /api/appointments         — update an appointment's status  { id, status }
 */
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const VALID_STATUSES = ["requested", "confirmed", "completed", "cancelled"];

async function resolveDealership() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { supabase, dealershipId: null as string | null };

  const { data: profile } = await supabase
    .from("profiles")
    .select("dealership_id")
    .eq("id", user.id)
    .single();

  return { supabase, dealershipId: profile?.dealership_id ?? null };
}

export async function GET(request: NextRequest) {
  try {
    const { supabase, dealershipId } = await resolveDealership();
    if (!dealershipId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");

    let query = supabase
      .from("appointments")
      .select("*, vehicle:vehicles(year, make, model, trim)")
      .eq("dealership_id", dealershipId)
      .order("requested_at", { ascending: false });

    if (status && VALID_STATUSES.includes(status)) {
      query = query.eq("status", status);
    }

    const { data, error } = await query;
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    const appointments = data ?? [];
    const pendingCount = appointments.filter((a) => a.status === "requested").length;
    return NextResponse.json({ appointments, pending_count: pendingCount });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const { supabase, dealershipId } = await resolveDealership();
    if (!dealershipId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id, status } = await request.json();
    if (!id || !VALID_STATUSES.includes(status)) {
      return NextResponse.json({ error: "id and a valid status are required" }, { status: 400 });
    }

    const { error } = await supabase
      .from("appointments")
      .update({ status })
      .eq("id", id)
      .eq("dealership_id", dealershipId);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
