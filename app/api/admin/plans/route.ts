/**
 * Admin Plans API - CRUD operations for subscription plans
 * Only accessible by super admins
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isSuperAdmin } from "@/lib/db/admin";

// GET - List all pricing plans
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user?.email || !(await isSuperAdmin(user.email))) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { data: plans, error } = await supabase
      .from("subscription_plans")
      .select("*")
      .order("price_monthly_cents", { ascending: true });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ plans });
  } catch (error) {
    console.error("Error fetching plans:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST - Create a new pricing plan
export async function POST(request: NextRequest) {
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
      slug,
      description,
      price_monthly_cents,
      stripe_price_id,
      monthly_assets_limit,
      monthly_pages_limit,
      monthly_posts_limit,
      max_team_members,
      features,
    } = body;

    // Validate required fields
    if (!name || !slug || !price_monthly_cents || !stripe_price_id) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const { data: plan, error } = await supabase
      .from("subscription_plans")
      .insert({
        name,
        slug,
        description: description || "",
        price_monthly_cents,
        stripe_price_id,
        monthly_assets_limit: monthly_assets_limit || null,
        monthly_pages_limit: monthly_pages_limit || null,
        monthly_posts_limit: monthly_posts_limit || null,
        max_team_members: max_team_members || null,
        features: features || {},
        is_active: true,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ plan }, { status: 201 });
  } catch (error) {
    console.error("Error creating plan:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
