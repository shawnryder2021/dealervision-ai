/**
 * Admin Dealerships API - View all dealerships, create new ones
 * Only accessible by super admins
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { isSuperAdmin } from "@/lib/db/admin";

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user?.email || !(await isSuperAdmin(user.email))) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Use service role client to bypass RLS for admin queries
    const adminSupabase = await createServiceClient();

    // Get all dealerships (select * to include all fields needed for client-mode switching)
    const { data: dealerships, error } = await adminSupabase
      .from("dealerships")
      .select(`
        *,
        subscriptions(
          status,
          stripe_price_id,
          current_period_end,
          stripe_customer_id,
          subscription_plans(name)
        ),
        usage_metrics(
          assets_generated,
          landing_pages_created,
          social_posts_published
        )
      `)
      .order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Get owner profiles (id only, no email column in profiles)
    const dealershipIds = dealerships.map((d: any) => d.id);
    const { data: profiles } = await adminSupabase
      .from("profiles")
      .select("id, dealership_id, full_name, role")
      .in("dealership_id", dealershipIds)
      .eq("role", "owner");

    // Get emails from auth.users for each owner profile
    const ownerIds = (profiles || []).map((p: any) => p.id);
    const { data: authData } = await adminSupabase.auth.admin.listUsers();
    const authUsers = (authData?.users || []).filter((u) =>
      ownerIds.includes(u.id)
    );

    // Build lookup maps
    const profileByDealership: Record<string, any> = {};
    (profiles || []).forEach((p: any) => {
      profileByDealership[p.dealership_id] = p;
    });
    const emailById: Record<string, string> = {};
    authUsers.forEach((u) => {
      emailById[u.id] = u.email || "";
    });

    // Transform the data
    const formattedDealerships = dealerships.map((d: any) => {
      const subscription = Array.isArray(d.subscriptions)
        ? d.subscriptions[0]
        : d.subscriptions;
      const usageMetrics = Array.isArray(d.usage_metrics)
        ? d.usage_metrics[0]
        : d.usage_metrics;
      const ownerProfile = profileByDealership[d.id];
      const ownerEmail = ownerProfile ? emailById[ownerProfile.id] : null;

      // Build full dealership object (all DB fields, excluding relation keys)
      const { subscriptions: _s, usage_metrics: _u, ...dealershipFields } = d;

      return {
        id: d.id,
        name: d.name,
        owner_email: ownerEmail || ownerProfile?.full_name || "Unknown",
        owner_user_id: ownerProfile?.id || null,
        created_at: d.created_at,
        subscription_status: subscription?.status || null,
        subscription_plan: subscription?.subscription_plans?.name || null,
        current_period_end: subscription?.current_period_end || null,
        stripe_customer_id: subscription?.stripe_customer_id || null,
        monthly_usage: {
          assets_generated: usageMetrics?.assets_generated || 0,
          landing_pages_created: usageMetrics?.landing_pages_created || 0,
          social_posts_published: usageMetrics?.social_posts_published || 0,
        },
        // Full dealership record for client-mode switching (no second fetch needed)
        dealership_record: dealershipFields,
      };
    });

    return NextResponse.json({ dealerships: formattedDealerships });
  } catch (error) {
    console.error("Error fetching dealerships:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/dealerships
 * Create a new dealership: auth user + dealerships row + profiles row
 */
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
    const { name, owner_email, owner_name, password, phone, website, address, city, state_code } = body;

    if (!name || !owner_email || !password) {
      return NextResponse.json(
        { error: "name, owner_email, and password are required" },
        { status: 400 }
      );
    }

    const adminSupabase = await createServiceClient();

    // 1. Create auth user
    const { data: authData, error: authError } = await adminSupabase.auth.admin.createUser({
      email: owner_email,
      password,
      email_confirm: true,
    });

    if (authError) {
      return NextResponse.json({ error: authError.message }, { status: 400 });
    }

    const newUserId = authData.user.id;

    // 2. Create dealership record
    const { data: dealershipData, error: dealershipError } = await adminSupabase
      .from("dealerships")
      .insert({
        name,
        phone: phone || null,
        website: website || null,
        address: address || null,
        city: city || null,
        state_code: state_code || null,
      })
      .select()
      .single();

    if (dealershipError) {
      // Rollback: delete the auth user
      await adminSupabase.auth.admin.deleteUser(newUserId);
      return NextResponse.json({ error: dealershipError.message }, { status: 500 });
    }

    // 3. Create profile linking user to dealership
    const { error: profileError } = await adminSupabase
      .from("profiles")
      .insert({
        id: newUserId,
        dealership_id: dealershipData.id,
        full_name: owner_name || owner_email.split("@")[0],
        role: "owner",
      });

    if (profileError) {
      // Rollback: delete dealership and auth user
      await adminSupabase.from("dealerships").delete().eq("id", dealershipData.id);
      await adminSupabase.auth.admin.deleteUser(newUserId);
      return NextResponse.json({ error: profileError.message }, { status: 500 });
    }

    return NextResponse.json({
      dealership: dealershipData,
      user_id: newUserId,
      message: "Dealership and owner account created successfully",
    });
  } catch (error) {
    console.error("Error creating dealership:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
