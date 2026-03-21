import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createImageTask, getResolutionCost } from "@/lib/kie";
import { buildPrompt, getAspectRatioForChannel, getResolutionForChannel } from "@/lib/prompt-templates";
import type { GenerateRequest } from "@/lib/types";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body: GenerateRequest = await request.json();

    // Fetch profile and dealership
    const { data: profile } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    if (!profile?.dealership_id) {
      return NextResponse.json(
        { error: "No dealership found. Please complete onboarding." },
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

    // Fetch vehicle if specified
    let vehicle = null;
    if (body.vehicle_id) {
      const { data: v } = await supabase
        .from("vehicles")
        .select("*")
        .eq("id", body.vehicle_id)
        .single();
      vehicle = v;
    }

    // Build the prompt
    const aspectRatio = getAspectRatioForChannel(body.channel);
    const resolution = getResolutionForChannel(body.channel);

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

    // Create asset record
    const { data: asset, error: assetError } = await supabase
      .from("generated_assets")
      .insert({
        dealership_id: profile.dealership_id,
        created_by: user.id,
        vehicle_id: body.vehicle_id || null,
        content_type: body.content_type,
        channel: body.channel,
        prompt,
        aspect_ratio: aspectRatio,
        resolution,
        status: "pending",
        campaign: body.campaign || null,
        metadata: {
          style: body.style,
          headline: body.headline,
          subheadline: body.subheadline,
        },
      })
      .select()
      .single();

    if (assetError || !asset) {
      return NextResponse.json(
        { error: "Failed to create asset record" },
        { status: 500 }
      );
    }

    // Submit to Kie.ai
    try {
      const kieResult = await createImageTask({
        prompt,
        aspect_ratio: aspectRatio,
        resolution,
        output_format: "png",
      });

      // Update asset with task ID
      await supabase
        .from("generated_assets")
        .update({
          kie_task_id: kieResult.taskId,
          status: "processing",
        })
        .eq("id", asset.id);

      // Log usage
      const cost = getResolutionCost(resolution);
      await supabase.from("usage_logs").insert({
        dealership_id: profile.dealership_id,
        asset_id: asset.id,
        action: "generate",
        credits_used: cost,
        metadata: { resolution, content_type: body.content_type },
      });

      return NextResponse.json({
        ...asset,
        kie_task_id: kieResult.taskId,
        status: "processing",
      });
    } catch (kieError) {
      // Update asset as failed
      await supabase
        .from("generated_assets")
        .update({ status: "failed" })
        .eq("id", asset.id);

      const message =
        kieError instanceof Error ? kieError.message : "Kie.ai API error";
      return NextResponse.json({ error: message }, { status: 500 });
    }
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
