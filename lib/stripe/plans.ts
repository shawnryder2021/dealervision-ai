/**
 * Plan configuration — pure data, no server-side SDK imports.
 * Safe to import in both client and server components.
 *
 * Pricing model (May 2026):
 *   Free Trial  — 25 image credits, no subscription required
 *   Pro         — $249/month, unlimited image generation
 *
 * 1 credit = 1 image generation (our credit, not KIE's internal credits).
 */

export interface PlanConfig {
  name: string;
  slug: string;
  description: string;
  priceMonthly: number; // in dollars (0 for free trial)
  priceId: string;      // Stripe price ID from env (resolved at runtime; empty for free)
  features: string[];
  limits: {
    assetsPerMonth: number | null; // null = unlimited
  };
  highlighted?: boolean;
  /** True for the free tier — no Stripe checkout, credits-based. */
  isFree?: boolean;
  /** Number of credits granted on signup (free trial only). */
  freeCredits?: number;
}

/** Free trial plan — not a Stripe subscription; credits are granted at signup. */
export const FREE_TRIAL: PlanConfig = {
  name: "Free Trial",
  slug: "free-trial",
  description: "Try DealerAdGen AI with 25 free image credits — no card required",
  priceMonthly: 0,
  priceId: "",
  isFree: true,
  freeCredits: 25,
  features: [
    "25 AI image generations",
    "All 13 channels & formats",
    "All content types",
    "Design Studio access",
    "Inventory management",
    "No credit card required",
  ],
  limits: {
    assetsPerMonth: 25, // soft — enforced via credits, not subscription
  },
};

/** Pro plan — Stripe subscription, unlimited generation. */
export const PRO_PLAN: PlanConfig = {
  name: "Pro",
  slug: "pro",
  description: "Unlimited AI image generation for your dealership",
  priceMonthly: 249,
  priceId: process.env.NEXT_PUBLIC_STRIPE_PRO_PRICE_ID || process.env.STRIPE_PRO_PRICE_ID || "price_pro_placeholder",
  highlighted: true,
  features: [
    "Unlimited AI image generations",
    "All 13 channels & formats",
    "All content types",
    "Design Studio & templates",
    "Batch generation",
    "Multi-angle gallery",
    "AI copy assist",
    "Conversion widgets",
    "Vehicle descriptions & social captions",
    "Priority support",
  ],
  limits: {
    assetsPerMonth: null, // unlimited
  },
};

/**
 * All plans in display order.
 * The checkout flow only uses PRO_PLAN (free trial has no Stripe session).
 */
export const PLANS: PlanConfig[] = [FREE_TRIAL, PRO_PLAN];

export function getPlanByPriceId(priceId: string): PlanConfig | undefined {
  return PLANS.find((p) => p.priceId === priceId);
}

export function getPlanBySlug(slug: string): PlanConfig | undefined {
  return PLANS.find((p) => p.slug === slug);
}
