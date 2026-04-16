/**
 * Subscription & usage DB operations.
 * All Supabase calls use the server client so RLS is bypassed via service role
 * for webhook / server-only paths, and respected via anon key for UI reads.
 */
import { createClient } from "@/lib/supabase/server";
import { getPlanByPriceId } from "@/lib/stripe/plans";

export interface Subscription {
  id: string;
  dealership_id: string;
  stripe_customer_id: string;
  stripe_subscription_id: string | null;
  stripe_price_id: string | null;
  status: string;
  current_period_start: string | null;
  current_period_end: string | null;
  cancel_at_period_end: boolean;
  canceled_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface UsageMetrics {
  dealership_id: string;
  month_year: string;
  assets_generated: number;
  landing_pages_created: number;
  social_posts_published: number;
}

// ─── Subscription helpers ─────────────────────────────────────────────────────

export async function getSubscription(dealershipId: string): Promise<Subscription | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("subscriptions")
    .select("*")
    .eq("dealership_id", dealershipId)
    .single();
  if (error) return null;
  return data as Subscription;
}

export async function getSubscriptionByCustomerId(
  stripeCustomerId: string
): Promise<Subscription | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("subscriptions")
    .select("*")
    .eq("stripe_customer_id", stripeCustomerId)
    .single();
  if (error) return null;
  return data as Subscription;
}

export async function upsertSubscription(payload: Partial<Subscription> & {
  dealership_id: string;
  stripe_customer_id: string;
}): Promise<Subscription | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("subscriptions")
    .upsert(payload, { onConflict: "stripe_customer_id" })
    .select()
    .single();
  if (error) {
    console.error("upsertSubscription error:", error);
    return null;
  }
  return data as Subscription;
}

export async function createStripeCustomer(
  dealershipId: string,
  stripeCustomerId: string
): Promise<Subscription | null> {
  return upsertSubscription({
    dealership_id: dealershipId,
    stripe_customer_id: stripeCustomerId,
    status: "incomplete",
  });
}

/** Returns true when the dealership has an active or trialing subscription */
export function isActiveSubscription(sub: Subscription | null): boolean {
  if (!sub) return false;
  return sub.status === "active" || sub.status === "trialing";
}

// ─── Usage helpers ────────────────────────────────────────────────────────────

function currentMonthYear(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-01`;
}

export async function getMonthlyUsage(dealershipId: string): Promise<UsageMetrics> {
  const supabase = await createClient();
  const monthYear = currentMonthYear();
  const { data } = await supabase
    .from("usage_metrics")
    .select("*")
    .eq("dealership_id", dealershipId)
    .eq("month_year", monthYear)
    .single();

  return (data as UsageMetrics) ?? {
    dealership_id: dealershipId,
    month_year: monthYear,
    assets_generated: 0,
    landing_pages_created: 0,
    social_posts_published: 0,
  };
}

export async function incrementUsage(
  dealershipId: string,
  increments: Partial<Pick<UsageMetrics, "assets_generated" | "landing_pages_created" | "social_posts_published">>
): Promise<void> {
  const supabase = await createClient();
  const monthYear = currentMonthYear();

  // Upsert the row then increment using raw SQL via rpc to avoid race conditions
  // Step 1: ensure row exists
  await supabase.from("usage_metrics").upsert(
    { dealership_id: dealershipId, month_year: monthYear },
    { onConflict: "dealership_id,month_year", ignoreDuplicates: true }
  );

  // Step 2: increment columns
  const updates: string[] = [];
  if (increments.assets_generated) updates.push(`assets_generated = assets_generated + ${increments.assets_generated}`);
  if (increments.landing_pages_created) updates.push(`landing_pages_created = landing_pages_created + ${increments.landing_pages_created}`);
  if (increments.social_posts_published) updates.push(`social_posts_published = social_posts_published + ${increments.social_posts_published}`);

  if (updates.length > 0) {
    await supabase.rpc("increment_usage_metrics", {
      p_dealership_id: dealershipId,
      p_month_year: monthYear,
      p_assets: increments.assets_generated ?? 0,
      p_pages: increments.landing_pages_created ?? 0,
      p_posts: increments.social_posts_published ?? 0,
    });
  }
}

// ─── Quota checking ────────────────────────────────────────────────────────────

export interface QuotaStatus {
  allowed: boolean;
  reason?: string;
  used: number;
  limit: number | null;
  percentUsed: number;
}

export async function checkQuota(
  dealershipId: string,
  resource: "assets_generated" | "landing_pages_created" | "social_posts_published"
): Promise<QuotaStatus> {
  const [sub, usage] = await Promise.all([
    getSubscription(dealershipId),
    getMonthlyUsage(dealershipId),
  ]);

  if (!isActiveSubscription(sub)) {
    return {
      allowed: false,
      reason: "No active subscription. Please subscribe to continue.",
      used: 0,
      limit: 0,
      percentUsed: 100,
    };
  }

  const plan = getPlanByPriceId(sub!.stripe_price_id ?? "");
  if (!plan) {
    // Unknown plan — allow (be lenient for mis-configs)
    return { allowed: true, used: 0, limit: null, percentUsed: 0 };
  }

  const limitMap = {
    assets_generated: plan.limits.assetsPerMonth,
    landing_pages_created: plan.limits.pagesPerMonth,
    social_posts_published: plan.limits.postsPerMonth,
  };

  const limit = limitMap[resource];
  const used = usage[resource];

  if (limit === null) {
    return { allowed: true, used, limit: null, percentUsed: 0 };
  }

  const percentUsed = Math.round((used / limit) * 100);

  if (used >= limit) {
    return {
      allowed: false,
      reason: `Monthly ${resource.replace(/_/g, " ")} limit of ${limit} reached. Upgrade your plan for more.`,
      used,
      limit,
      percentUsed: 100,
    };
  }

  return { allowed: true, used, limit, percentUsed };
}
