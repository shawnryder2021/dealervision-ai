import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { user_id, full_name, dealership_name } = body;

    if (!user_id || !dealership_name) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const supabase = await createServiceClient();

    // Create dealership
    const slug = dealership_name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");

    const { data: dealership, error: dealerError } = await supabase
      .from("dealerships")
      .insert({
        name: dealership_name,
        slug: `${slug}-${Date.now().toString(36)}`,
        brand_colors: {
          primary: "#003366",
          secondary: "#FFFFFF",
          accent: "#FF8C00",
        },
      })
      .select()
      .single();

    if (dealerError || !dealership) {
      return NextResponse.json(
        { error: "Failed to create dealership" },
        { status: 500 }
      );
    }

    // Create profile
    const { error: profileError } = await supabase.from("profiles").insert({
      id: user_id,
      dealership_id: dealership.id,
      full_name: full_name || null,
      role: "owner",
    });

    if (profileError) {
      // Cleanup dealership if profile creation fails
      await supabase.from("dealerships").delete().eq("id", dealership.id);
      return NextResponse.json(
        { error: "Failed to create profile" },
        { status: 500 }
      );
    }

    return NextResponse.json({ dealership_id: dealership.id });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
