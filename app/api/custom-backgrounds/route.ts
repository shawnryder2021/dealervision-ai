import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * GET /api/custom-backgrounds
 * List all custom backgrounds for the authenticated user's dealership
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get dealership from X-Dealership-Id header (admin client mode) or profile
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

    const { data, error } = await supabase
      .from("custom_backgrounds")
      .select("*")
      .eq("dealership_id", dealershipId)
      .order("is_favorite", { ascending: false })
      .order("created_at", { ascending: false });

    if (error) throw error;
    return NextResponse.json(data || []);
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
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

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
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }
    if (!body.image_url || typeof body.image_url !== "string") {
      return NextResponse.json(
        { error: "Image URL is required" },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from("custom_backgrounds")
      .insert({
        dealership_id: dealershipId,
        created_by: user.id,
        name: body.name.trim(),
        image_url: body.image_url,
        thumbnail_url: body.thumbnail_url ?? null,
        description: body.description ?? null,
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    console.error("Error creating custom background:", error);
    const message =
      error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
