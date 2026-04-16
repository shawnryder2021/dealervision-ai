/**
 * Admin Dashboard Statistics API
 * Provides platform-wide metrics and analytics
 * Only accessible by super admins
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isSuperAdmin } from "@/lib/db/admin";

interface AdminStats {
  total_dealerships: number;
  active_subscriptions: number;
  trialing_subscriptions: number;
  canceled_subscriptions: number;
  total_monthly_revenue_cents: number;
  total_assets_generated: number;
  total_pages_created: number;
  total_posts_published: number;
  webhook_health: {
    success_rate: number;
    last_webhook_at: string | null;
  };
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user?.email || !(await isSuperAdmin(user.email))) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Get counts using raw SQL for efficiency
    const [
      { count: totalDealerships },
      { data: subscriptionCounts },
      { data: revenueData },
      { data: usageData },
    ] = await Promise.all([
      // Total dealerships
      supabase
        .from("dealerships")
        .select("*", { count: "exact", head: true }),

      // Subscription status counts
      supabase
        .from("subscriptions")
        .select("status")
        .then((res) => {
          const counts = {
            active: 0,
            trialing: 0,
            canceled: 0,
          };
          res.data?.forEach((sub) => {
            if (sub.status === "active") counts.active++;
            if (sub.status === "trialing") counts.trialing++;
            if (sub.status === "canceled") counts.canceled++;
          });
          return res.data ? { data: counts } : { data: counts };
        }),

      // Revenue calculation (sum of all active subscriptions' monthly price)
      supabase
        .from("subscriptions")
        .select("subscription_plans(price_monthly_cents)")
        .eq("status", "active")
        .then((res) => {
          let total = 0;
          res.data?.forEach((sub: any) => {
            if (sub.subscription_plans) {
              total += sub.subscription_plans.price_monthly_cents || 0;
            }
          });
          return { data: total };
        }),

      // Total usage across all dealerships (current month)
      supabase
        .from("usage_metrics")
        .select("assets_generated, landing_pages_created, social_posts_published")
        .then((res) => {
          const totals = {
            assets_generated: 0,
            pages_created: 0,
            posts_published: 0,
          };
          res.data?.forEach((metric) => {
            totals.assets_generated += metric.assets_generated || 0;
            totals.pages_created += metric.landing_pages_created || 0;
            totals.posts_published += metric.social_posts_published || 0;
          });
          return { data: totals };
        }),
    ]);

    // Get webhook health (success rate of recent webhooks)
    const { data: webhookData } = await supabase
      .from("stripe_config")
      .select("last_tested_at, last_test_status")
      .order("configured_at", { ascending: false })
      .limit(1)
      .single();

    const stats: AdminStats = {
      total_dealerships: totalDealerships || 0,
      active_subscriptions: subscriptionCounts?.active || 0,
      trialing_subscriptions: subscriptionCounts?.trialing || 0,
      canceled_subscriptions: subscriptionCounts?.canceled || 0,
      total_monthly_revenue_cents: revenueData || 0,
      total_assets_generated: usageData?.assets_generated || 0,
      total_pages_created: usageData?.pages_created || 0,
      total_posts_published: usageData?.posts_published || 0,
      webhook_health: {
        success_rate: webhookData?.last_test_status === "success" ? 100 : 0,
        last_webhook_at: webhookData?.last_tested_at || null,
      },
    };

    return NextResponse.json({ stats });
  } catch (error) {
    console.error("Error fetching admin stats:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
