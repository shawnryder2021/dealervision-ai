/**
 * Leads API
 * POST /api/leads  — Public endpoint to submit a lead from a landing page
 * GET  /api/leads  — Authenticated endpoint to list leads for the dealership
 * PATCH /api/leads/[id] — Mark lead as read (handled inline via query param)
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";

// POST — public lead submission (used by landing pages)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { dealership_id, landing_page_id, landing_page_title, name, email, phone, message, vehicle_interest } = body;

    if (!dealership_id || !name || !email) {
      return NextResponse.json({ error: "Missing required fields: dealership_id, name, email" }, { status: 400 });
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: "Invalid email address" }, { status: 400 });
    }

    // Use service role to bypass RLS for public submission
    const adminSupabase = await createServiceClient();
    const { data, error } = await adminSupabase
      .from("leads")
      .insert({
        dealership_id,
        landing_page_id: landing_page_id || null,
        landing_page_title: landing_page_title || null,
        name: name.trim(),
        email: email.trim().toLowerCase(),
        phone: phone?.trim() || null,
        message: message?.trim() || null,
        vehicle_interest: vehicle_interest?.trim() || null,
        source: "landing_page",
      })
      .select("id")
      .single();

    if (error) {
      console.error("Lead insert error:", error);
      return NextResponse.json({ error: "Failed to submit lead" }, { status: 500 });
    }

    return NextResponse.json({ success: true, id: data.id }, { status: 201 });
  } catch (error) {
    console.error("Lead submission error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// GET — authenticated, returns leads for the current dealership
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { data: profile } = await supabase
      .from("profiles")
      .select("dealership_id")
      .eq("id", user.id)
      .single();

    if (!profile?.dealership_id) {
      return NextResponse.json({ error: "No dealership found" }, { status: 400 });
    }

    const { searchParams } = new URL(request.url);
    const unreadOnly = searchParams.get("unread") === "true";
    const markId = searchParams.get("mark_read");

    // Mark a single lead as read
    if (markId) {
      await supabase
        .from("leads")
        .update({ read_at: new Date().toISOString() })
        .eq("id", markId)
        .eq("dealership_id", profile.dealership_id);
    }

    let query = supabase
      .from("leads")
      .select("*")
      .eq("dealership_id", profile.dealership_id)
      .order("created_at", { ascending: false });

    if (unreadOnly) query = query.is("read_at", null);

    const { data: leads, error } = await query;
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    const unreadCount = leads?.filter((l) => !l.read_at).length ?? 0;
    return NextResponse.json({ leads: leads ?? [], unread_count: unreadCount });
  } catch (error) {
    console.error("Leads fetch error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
