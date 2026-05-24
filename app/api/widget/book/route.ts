/**
 * Public test-drive booking submission.
 * POST /api/widget/book
 * Body: { slug, customer_name, email, phone?, vehicle_id?, requested_at, notes? }
 * Creates a lead (source=test_drive) + an appointment (status=requested) via service role.
 */
import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { getWidgetDealership } from "@/lib/widgets/dealership";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { slug, customer_name, email, phone, vehicle_id, requested_at, notes } = body;

    if (!slug || !customer_name || !email || !requested_at) {
      return NextResponse.json(
        { error: "Missing required fields: slug, customer_name, email, requested_at" },
        { status: 400 }
      );
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: "Invalid email address" }, { status: 400 });
    }

    const when = new Date(requested_at);
    if (Number.isNaN(when.getTime())) {
      return NextResponse.json({ error: "Invalid requested_at" }, { status: 400 });
    }

    const dealership = await getWidgetDealership(slug);
    if (!dealership) {
      return NextResponse.json({ error: "Dealership not found" }, { status: 404 });
    }

    if ((dealership.widget_settings as { booking_enabled?: boolean })?.booking_enabled === false) {
      return NextResponse.json({ error: "Booking is not available" }, { status: 403 });
    }

    const supabase = await createServiceClient();

    // Look up the vehicle (best-effort) for a readable lead label.
    let vehicleLabel = "";
    if (vehicle_id) {
      const { data: v } = await supabase
        .from("vehicles")
        .select("year, make, model, trim")
        .eq("id", vehicle_id)
        .eq("dealership_id", dealership.id)
        .maybeSingle();
      if (v) vehicleLabel = [v.year, v.make, v.model, v.trim].filter(Boolean).join(" ");
    }

    // 1) Create the lead.
    const { data: lead, error: leadErr } = await supabase
      .from("leads")
      .insert({
        dealership_id: dealership.id,
        name: customer_name.trim(),
        email: email.trim().toLowerCase(),
        phone: phone?.trim() || null,
        source: "test_drive",
        vehicle_interest: vehicleLabel || null,
        message: `Test-drive request for ${when.toLocaleString()}${notes ? ` — ${notes}` : ""}`,
        metadata: { vehicle_id: vehicle_id || null, requested_at: when.toISOString() },
      })
      .select("id")
      .single();

    if (leadErr) {
      console.error("Booking lead insert error:", leadErr);
      return NextResponse.json({ error: "Failed to submit booking" }, { status: 500 });
    }

    // 2) Create the appointment.
    const { data: appt, error: apptErr } = await supabase
      .from("appointments")
      .insert({
        dealership_id: dealership.id,
        lead_id: lead.id,
        vehicle_id: vehicle_id || null,
        customer_name: customer_name.trim(),
        email: email.trim().toLowerCase(),
        phone: phone?.trim() || null,
        requested_at: when.toISOString(),
        status: "requested",
        notes: notes?.trim() || null,
      })
      .select("id")
      .single();

    if (apptErr) {
      console.error("Appointment insert error:", apptErr);
      return NextResponse.json({ error: "Failed to create appointment" }, { status: 500 });
    }

    return NextResponse.json({ success: true, appointment_id: appt.id }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
