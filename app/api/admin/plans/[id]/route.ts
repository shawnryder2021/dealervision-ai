/**
 * Admin Plan Detail API - Update and delete individual plans
 * Only accessible by super admins
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isSuperAdmin } from "@/lib/db/admin";

// PUT - Update a pricing plan
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user?.email || !(await isSuperAdmin(user.email))) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const body = await request.json();
    const {
      name,
      description,
      price_monthly_cents,
      stripe_price_id,
      monthly_assets_limit,
      monthly_pages_limit,
      monthly_posts_limit,
      max_team_members,
      features,
      is_active,
    } = body;

    const { data: plan, error } = await supabase
      .from("subscription_plans")
      .update({
        ...(name && { name }),
        ...(description && { description }),
        ...(price_monthly_cents && { price_monthly_cents }),
        ...(stripe_price_id && { stripe_price_id }),
        ...(monthly_assets_limit !== undefined && {
          monthly_assets_limit,
        }),
        ...(monthly_pages_limit !== undefined && {
          monthly_pages_limit,
        }),
        ...(monthly_posts_limit !== undefined && {
          monthly_posts_limit,
        }),
        ...(max_team_members !== undefined && {
          max_team_members,
        }),
        ...(features && { features }),
        ...(is_active !== undefined && { is_active }),
      })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ plan });
  } catch (error) {
    console.error("Error updating plan:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE - Archive a pricing plan (soft delete)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user?.email || !(await isSuperAdmin(user.email))) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Soft delete by setting is_active to false
    const { error } = await supabase
      .from("subscription_plans")
      .update({ is_active: false })
      .eq("id", id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting plan:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
