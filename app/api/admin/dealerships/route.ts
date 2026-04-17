/**
 * Admin Dealerships API - View all dealerships and their subscription status
 * Only accessible by super admins
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
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

    // Get all dealerships
    const { data: dealerships, error } = await supabase
      .from("dealerships")
      .select(`
        id, name, created_at,
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
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, dealership_id, full_name, role")
      .in("dealership_id", dealershipIds)
      .eq("role", "owner");

    // Get emails from auth.users for each owner profile
    const ownerIds = (profiles || []).map((p: any) => p.id);
    const { data: authData } = await supabase.auth.admin.listUsers();
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

      return {
        id: d.id,
        name: d.name,
        owner_email: ownerEmail || ownerProfile?.full_name || "Unknown",
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
