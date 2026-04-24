import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { applyCoupon } from "@/lib/db/coupons";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      user_id,
      full_name,
      dealership_name,
      primary_color = "#003366",
      secondary_color = "#FFFFFF",
      brand_voice = "professional",
      inventory_type = "both",
      coupon_id = null,
    } = body;

    if (!user_id || !dealership_name) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Verify service role key is configured
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      console.error("[onboard] SUPABASE_SERVICE_ROLE_KEY is not set");
      return NextResponse.json(
        { error: "Server configuration error" },
        { status: 500 }
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
          primary: primary_color,
          secondary: secondary_color,
          accent: primary_color,
        },
        local_context: {
          inventory_type,
          personality: brand_voice,
        },
      })
      .select()
      .single();

    if (dealerError || !dealership) {
      console.error("[onboard] Dealership insert failed:", dealerError);
      return NextResponse.json(
        { error: dealerError?.message || "Failed to create dealership" },
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
      console.error("[onboard] Profile insert failed:", profileError);
      // Cleanup dealership if profile creation fails
      await supabase.from("dealerships").delete().eq("id", dealership.id);
      return NextResponse.json(
        { error: profileError.message || "Failed to create profile" },
        { status: 500 }
      );
    }

    // Apply coupon if provided
    if (coupon_id) {
      try {
        // Get coupon details to calculate discount
        const { data: coupon } = await supabase
          .from("coupon_codes")
          .select("discount_type, discount_value")
          .eq("id", coupon_id)
          .single();

        if (coupon) {
          const discountAmount =
            coupon.discount_type === "fixed"
              ? coupon.discount_value
              : coupon.discount_type === "percentage"
                ? 0 // Percentage discounts applied during checkout
                : 0;

          // Record coupon usage
          await applyCoupon(
            coupon_id,
            dealership.id,
            null, // subscription_id is null at signup
            discountAmount
          );
        }
      } catch (error) {
        console.error("[onboard] Failed to apply coupon:", error);
        // Don't fail signup if coupon application fails
      }
    }

    return NextResponse.json({ dealership_id: dealership.id });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
