import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { createClient } from "@/lib/supabase/server";
import { isSuperAdmin } from "@/lib/db/admin";

interface SaveGalleryBody {
  vehicle_id?: string | null;
  showroom_preset_id?: string | null;
  source_image_url: string;
  jobs: Array<{
    angle_id: string;
    angle_label: string;
    image_url: string;
    prompt: string;
  }>;
}

/**
 * POST: bulk-inserts a complete multi-angle gallery into generated_assets.
 * The client orchestrates the actual /api/edit-image calls; this endpoint
 * just persists the resulting 8 images grouped under one gallery_id.
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = (await request.json()) as SaveGalleryBody;

    if (!body.jobs || body.jobs.length === 0) {
      return NextResponse.json({ error: "No angle jobs provided" }, { status: 400 });
    }

    // Resolve dealership ID — honour super-admin override header (same pattern as /api/generate)
    const { data: profile } = await supabase
      .from("profiles")
      .select("dealership_id")
      .eq("id", user.id)
      .single();
    if (!profile?.dealership_id) {
      return NextResponse.json(
        { error: "No dealership found. Please complete onboarding." },
        { status: 400 }
      );
    }
    const adminOverrideId = request.headers.get("X-Dealership-Id");
    const isAdmin = user.email ? await isSuperAdmin(user.email) : false;
    const dealershipId = isAdmin && adminOverrideId ? adminOverrideId : profile.dealership_id;

    const galleryId = randomUUID();
    const now = new Date().toISOString();

    const rows = body.jobs.map((job) => ({
      dealership_id: dealershipId,
      created_by: user.id,
      vehicle_id: body.vehicle_id ?? null,
      content_type: "multi-angle-gallery",
      channel: "website-card",
      prompt: job.prompt,
      image_url: job.image_url,
      storage_path: null,
      aspect_ratio: "1:1",
      resolution: "1K",
      kie_task_id: null,
      status: "completed",
      metadata: {
        source_image_url: body.source_image_url,
        showroom_preset_id: body.showroom_preset_id || null,
      },
      is_favorite: false,
      campaign: "Multi-Angle Gallery",
      gallery_id: galleryId,
      gallery_angle: job.angle_id,
      created_at: now,
    }));

    const { data, error } = await supabase
      .from("generated_assets")
      .insert(rows)
      .select();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      gallery_id: galleryId,
      assets: data,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Save failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
