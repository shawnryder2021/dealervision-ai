import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { buildPrompt, getAspectRatioForChannel, getResolutionForChannel } from "@/lib/prompt-templates";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();

    const { data: profile } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    if (!profile?.dealership_id) {
      return NextResponse.json(
        { error: "No dealership found" },
        { status: 400 }
      );
    }

    const { data: dealership } = await supabase
      .from("dealerships")
      .select("*")
      .eq("id", profile.dealership_id)
      .single();

    if (!dealership) {
      return NextResponse.json(
        { error: "Dealership not found" },
        { status: 404 }
      );
    }

    let vehicle = null;
    if (body.vehicle_id) {
      const { data: v } = await supabase
        .from("vehicles")
        .select("*")
        .eq("id", body.vehicle_id)
        .single();
      vehicle = v;
    }

    const prompt = buildPrompt({
      content_type: body.content_type,
      channel: body.channel,
      dealership,
      vehicle,
      headline: body.headline,
      subheadline: body.subheadline,
      cta: body.cta,
      style: body.style,
      event_name: body.event_name,
      event_dates: body.event_dates,
      offer_details: body.offer_details,
      service_offer: body.service_offer,
      service_details: body.service_details,
      testimonial_text: body.testimonial_text,
      testimonial_author: body.testimonial_author,
      rating: body.rating,
      custom_prompt: body.custom_prompt,
    });

    const aspectRatio = getAspectRatioForChannel(body.channel);
    const resolution = getResolutionForChannel(body.channel);

    return NextResponse.json({ prompt, aspectRatio, resolution });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
