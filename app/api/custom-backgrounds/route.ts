import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/client";
import {
  listCustomBackgrounds,
  createCustomBackground,
} from "@/lib/db/custom-backgrounds";

/**
 * GET /api/custom-backgrounds
 * List all custom backgrounds for the authenticated user's dealership
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get dealership from X-Dealership-Id header (for admin client mode) or profile
    const headerDealershipId = request.headers.get("X-Dealership-Id");
    let dealershipId: string | null = headerDealershipId;

    if (!dealershipId) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("dealership_id")
        .eq("id", user.id)
        .single();
      dealershipId = profile?.dealership_id || null;
    }

    if (!dealershipId) {
      return NextResponse.json(
        { error: "No dealership associated with this user" },
        { status: 400 }
      );
    }

    const backgrounds = await listCustomBackgrounds(dealershipId);
    return NextResponse.json(backgrounds);
  } catch (error) {
    console.error("Error listing custom backgrounds:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/custom-backgrounds
 * Create a new custom background
 * Body: { name, image_url, thumbnail_url?, description? }
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Resolve dealership
    const headerDealershipId = request.headers.get("X-Dealership-Id");
    let dealershipId: string | null = headerDealershipId;
    if (!dealershipId) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("dealership_id")
        .eq("id", user.id)
        .single();
      dealershipId = profile?.dealership_id || null;
    }

    if (!dealershipId) {
      return NextResponse.json(
        { error: "No dealership associated with this user" },
        { status: 400 }
      );
    }

    const body = await request.json();

    if (!body.name || typeof body.name !== "string") {
      return NextResponse.json(
        { error: "Name is required" },
        { status: 400 }
      );
    }
    if (!body.image_url || typeof body.image_url !== "string") {
      return NextResponse.json(
        { error: "Image URL is required" },
        { status: 400 }
      );
    }

    const result = await createCustomBackground({
      dealership_id: dealershipId,
      created_by: user.id,
      name: body.name,
      image_url: body.image_url,
      thumbnail_url: body.thumbnail_url,
      description: body.description,
    });

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || "Failed to create background" },
        { status: 400 }
      );
    }

    return NextResponse.json(result.background, { status: 201 });
  } catch (error) {
    console.error("Error creating custom background:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
