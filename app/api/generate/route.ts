import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getImageProvider } from "@/lib/image-providers";
import type { ImageModelOption } from "@/lib/db/image-generation";
import { buildPrompt, buildBaseImageEditPrompt, getAspectRatioForChannel, getResolutionForChannel } from "@/lib/prompt-templates";
import { checkQuota, incrementUsage } from "@/lib/db/subscriptions";
import { isSuperAdmin } from "@/lib/db/admin";
import { findMatchingReferenceImages } from "@/lib/db/reference-vehicles";
import type { GenerateRequest } from "@/lib/types";

async function getGlobalImageModel(supabase: Awaited<ReturnType<typeof createClient>>): Promise<ImageModelOption> {
  const { data } = await supabase
    .from("platform_settings")
    .select("default_image_model")
    .eq("id", 1)
    .maybeSingle();

  return (data?.default_image_model as ImageModelOption) || "openai-gpt-image-2";
}

export async function POST(request: NextRequest) {
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

    // ── Super admin: allow dealership override via header ─────────────────────
    const adminOverrideId = request.headers.get("X-Dealership-Id");
    const isAdmin = user.email ? await isSuperAdmin(user.email) : false;
    const effectiveDealershipId =
      isAdmin && adminOverrideId ? adminOverrideId : profile.dealership_id;

    const { data: dealership } = await supabase
      .from("dealerships")
      .select("*")
      .eq("id", effectiveDealershipId)
      .single();

    if (!dealership) {
      return NextResponse.json(
        { error: "Dealership not found" },
        { status: 404 }
      );
    }

    // ── Quota check (skipped for super admins) ───────────────────────────────
    let useCredits = false;
    if (!isAdmin) {
      const quota = await checkQuota(effectiveDealershipId, "assets_generated");
      if (!quota.allowed) {
        return NextResponse.json({ error: quota.reason }, { status: 402 });
      }
      useCredits = !!quota.useCredits;
    }

    // Fetch vehicle if specified, or build a synthetic one from inline_vehicle
    // (used when the user picked a "common" preset that isn't in their DB).
    let vehicle = null;
    if (body.vehicle_id) {
      const { data: v } = await supabase
        .from("vehicles")
        .select("*")
        .eq("id", body.vehicle_id)
        .single();
      vehicle = v;
    } else if (body.inline_vehicle) {
      const iv = body.inline_vehicle;
      vehicle = {
        id: null,
        dealership_id: effectiveDealershipId,
        year: iv.year ?? null,
        make: iv.make ?? null,
        model: iv.model ?? null,
        trim: iv.trim ?? null,
        price: null, mileage: null, vin: null, stock_number: null,
        status: "available", photos: [], tags: [], details: {},
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
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
      previous_price: body.previous_price,
      current_price: body.current_price,
      vehicle_vin: body.vehicle_vin,
      vehicle_color: body.vehicle_color,
      service_offer: body.service_offer,
      service_details: body.service_details,
      testimonial_text: body.testimonial_text,
      testimonial_author: body.testimonial_author,
      rating: body.rating,
      custom_prompt: body.custom_prompt,
      include_vehicle_year: body.include_vehicle_year,
      include_vehicle_model: body.include_vehicle_model,
      scene_location: body.scene_location,
      include_price: body.include_price,
      display_price: body.display_price,
    });

    // A user-uploaded base photo means we EDIT that photo instead of generating
    // from scratch. Image editing is KIE.ai-only (nano-banana-edit), so when a
    // base image is supplied we force the KIE model regardless of the dealership
    // default — this also keeps the status poller's provider selection correct,
    // since it reads metadata.model.
    const sourceImageUrl: string | undefined =
      typeof body.source_image_url === "string" && body.source_image_url.trim()
        ? body.source_image_url.trim()
        : undefined;
    const useBaseImageEdit = !!sourceImageUrl;

    // Read image model directly from the already-fetched dealership object.
    // Logo is composited server-side after generation (see image-compositor.ts),
    // so any model works regardless of image_input support.
    const globalDefaultModel = await getGlobalImageModel(supabase);
    const imageModel: ImageModelOption = useBaseImageEdit
      ? "kie-nano-banana"
      : (dealership.image_model as ImageModelOption) || globalDefaultModel;

    // Create asset record
    const { data: asset, error: assetError } = await supabase
      .from("generated_assets")
      .insert({
        dealership_id: effectiveDealershipId,
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
          model: imageModel,
          ...(useBaseImageEdit
            ? { mode: "edit", source_image_url: sourceImageUrl }
            : {}),
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

    // Submit to image generation provider
    try {
      const provider = getImageProvider(imageModel);

      // Build image_input: user-provided reference photos + admin-curated
      // reference photos that match the vehicle (year/make/model/trim).
      // The dealership logo is composited server-side after generation
      // (see image-compositor.ts) — we no longer rely on the AI to render it.
      const userRefs = Array.isArray(body.image_input) ? body.image_input.filter(Boolean) : [];

      // Look up admin-curated reference photos matching this vehicle. Best-match
      // logic: exact trim → exact year → trim only → make+model fallback.
      let adminRefs: string[] = [];
      try {
        adminRefs = await findMatchingReferenceImages({
          year: vehicle?.year ?? undefined,
          make: vehicle?.make ?? undefined,
          model: vehicle?.model ?? undefined,
          trim: vehicle?.trim ?? undefined,
          limit: 2, // keep payload small — 2 angles is enough to constrain the model
        });
      } catch (refErr) {
        // Non-fatal: generation should still proceed without references.
        console.error("Reference vehicle lookup failed:", refErr);
      }

      // User refs first (highest priority), then admin refs. Dedupe by URL.
      const imageInput = Array.from(new Set([...userRefs, ...adminRefs]));

      // When the user uploaded a base photo, EDIT it (preserve the real photo,
      // overlay the marketing treatment) instead of generating from scratch.
      const providerResult = useBaseImageEdit
        ? await provider.createEditTask({
            prompt: buildBaseImageEditPrompt(prompt),
            image_urls: [sourceImageUrl as string],
            image_size: aspectRatio,
            output_format: "png",
          })
        : await provider.createImageTask({
            prompt,
            aspect_ratio: aspectRatio,
            resolution,
            output_format: "png",
            image_input: imageInput.length > 0 ? imageInput : undefined,
          });

      // Update asset with task ID
      await supabase
        .from("generated_assets")
        .update({
          kie_task_id: providerResult.taskId,
          status: "processing",
        })
        .eq("id", asset.id);

      // Increment usage counter (subscription or credit-based)
      if (!isAdmin) {
        if (useCredits) {
          // Deduct one credit atomically
          const { deductOneCredit } = await import("@/lib/db/credits");
          const newBalance = await deductOneCredit(effectiveDealershipId);
          if (newBalance === -1) {
            console.warn("Credit deduction failed — balance may have reached 0 concurrently");
          }
        } else {
          await incrementUsage(effectiveDealershipId, { assets_generated: 1 });
        }
      }

      // Log usage
      const cost = provider.getResolutionCost(resolution);
      await supabase.from("usage_logs").insert({
        dealership_id: effectiveDealershipId,
        asset_id: asset.id,
        action: "generate",
        credits_used: cost,
        metadata: {
          resolution,
          content_type: body.content_type,
          model: imageModel,
        },
      });

      return NextResponse.json({
        ...asset,
        kie_task_id: providerResult.taskId,
        status: "processing",
      });
    } catch (providerError) {
      // Update asset as failed
      await supabase
        .from("generated_assets")
        .update({ status: "failed" })
        .eq("id", asset.id);

      const message =
        providerError instanceof Error ? providerError.message : "Image generation API error";
      return NextResponse.json({ error: message }, { status: 500 });
    }
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
