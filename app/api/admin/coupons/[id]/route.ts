import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/client";
import { updateCoupon, deleteCoupon } from "@/lib/db/coupons";

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

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user?.email || !(await isSuperAdmin(user.email))) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const result = await updateCoupon(id, body);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || "Failed to update coupon" },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error updating coupon:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user?.email || !(await isSuperAdmin(user.email))) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const result = await deleteCoupon(id);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || "Failed to delete coupon" },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting coupon:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
