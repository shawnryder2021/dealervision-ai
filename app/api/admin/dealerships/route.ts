/**
 * Admin Dealerships API - View all dealerships and their subscription status
 * Only accessible by super admins
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isSuperAdmin } from "@/lib/db/admin";

interface DealershipWithSubscription {
  id: string;
  name: string;
  owner_email: string;
  created_at: string;
  subscription_status: string | null;
  subscription_plan: string | null;
  current_period_end: string | null;
  stripe_customer_id: string | null;
  monthly_usage: {
    assets_generated: number;
    landing_pages_created: number;
    social_posts_published: number;
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

    // Get all dealerships with their subscription info
    const { data: dealerships, error } = await supabase
      .from("dealerships")
      .select(
        `
        id,
        name,
        owner_email: profiles(email),
        created_at,
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
      `
      )
      .order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Transform the data for easier consumption
    const formattedDealerships: DealershipWithSubscription[] = dealerships.map(
      (d: any) => {
        const subscription = Array.isArray(d.subscriptions)
          ? d.subscriptions[0]
          : d.subscriptions;
        const ownerProfile = Array.isArray(d.owner_email)
          ? d.owner_email[0]
          : d.owner_email;
        const usageMetrics = Array.isArray(d.usage_metrics)
          ? d.usage_metrics[0]
          : d.usage_metrics;

        return {
          id: d.id,
          name: d.name,
          owner_email: ownerProfile?.email || "Unknown",
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
      }
    );

    return NextResponse.json({ dealerships: formattedDealerships });
  } catch (error) {
    console.error("Error fetching dealerships:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
