import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/client";
import { listCoupons, createCoupon, updateCoupon, deleteCoupon } from "@/lib/db/coupons";

async function isSuperAdmin(email: string): Promise<boolean> {
  try {
    const supabase = createClient();
    const { data } = await supabase
      .from("super_admins")
      .select("id")
      .eq("email", email)
      .maybeSingle();
    return !!data;
  } catch {
    return false;
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user?.email || !(await isSuperAdmin(user.email))) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const coupons = await listCoupons();
    return NextResponse.json(coupons);
  } catch (error) {
    console.error("Error listing coupons:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user?.email || !(await isSuperAdmin(user.email))) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const result = await createCoupon(body);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || "Failed to create coupon" },
        { status: 400 }
      );
    }

    return NextResponse.json(result.coupon, { status: 201 });
  } catch (error) {
    console.error("Error creating coupon:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
