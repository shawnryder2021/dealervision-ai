/**
 * Stripe server-side client (singleton).
 * Only import this from server-side code (API routes, server actions).
 */
import Stripe from "stripe";

if (!process.env.STRIPE_SECRET_KEY) {
  // During build this may not be set — only throw at request time.
  if (typeof window === "undefined" && process.env.NODE_ENV === "production") {
    throw new Error("STRIPE_SECRET_KEY is not configured");
  }
}

// Singleton pattern to avoid creating multiple instances
let _stripe: Stripe | null = null;

export function getStripe(): Stripe {
  if (!_stripe) {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) throw new Error("STRIPE_SECRET_KEY is not set");
    _stripe = new Stripe(key, {
      apiVersion: "2025-02-24.acacia",
      typescript: true,
    });
  }
  return _stripe;
}

// ─── Plan configuration ───────────────────────────────────────────────────────

export interface PlanConfig {
  name: string;
  slug: string;
  description: string;
  priceMonthly: number; // in dollars
  priceId: string;      // Stripe price ID from env
  features: string[];
  limits: {
    assetsPerMonth: number | null;  // null = unlimited
    pagesPerMonth: number | null;
    postsPerMonth: number | null;
    teamMembers: number | null;
  };
  highlighted?: boolean;
}

export const PLANS: PlanConfig[] = [
  {
    name: "Starter",
    slug: "starter",
    description: "Perfect for solo dealers getting started with AI marketing",
    priceMonthly: 29,
    priceId: process.env.STRIPE_STARTER_PRICE_ID || "price_starter_placeholder",
    features: [
      "50 AI-generated assets/month",
      "5 landing pages",
      "20 social posts",
      "2 team members",
      "Batch generation",
      "CSV inventory import",
    ],
    limits: {
      assetsPerMonth: 50,
      pagesPerMonth: 5,
      postsPerMonth: 20,
      teamMembers: 2,
    },
  },
  {
    name: "Professional",
    slug: "professional",
    description: "For active dealerships needing high volume and social publishing",
    priceMonthly: 99,
    priceId: process.env.STRIPE_PROFESSIONAL_PRICE_ID || "price_professional_placeholder",
    highlighted: true,
    features: [
      "500 AI-generated assets/month",
      "50 landing pages",
      "200 social posts",
      "10 team members",
      "Social media publishing",
      "URL inventory import",
      "Advanced analytics",
    ],
    limits: {
      assetsPerMonth: 500,
      pagesPerMonth: 50,
      postsPerMonth: 200,
      teamMembers: 10,
    },
  },
  {
    name: "Enterprise",
    slug: "enterprise",
    description: "Unlimited everything for large groups and multi-rooftop dealers",
    priceMonthly: 299,
    priceId: process.env.STRIPE_ENTERPRISE_PRICE_ID || "price_enterprise_placeholder",
    features: [
      "Unlimited assets",
      "Unlimited landing pages",
      "Unlimited social posts",
      "Unlimited team members",
      "All Professional features",
      "Priority support",
      "Custom onboarding",
    ],
    limits: {
      assetsPerMonth: null,
      pagesPerMonth: null,
      postsPerMonth: null,
      teamMembers: null,
    },
  },
];

export function getPlanByPriceId(priceId: string): PlanConfig | undefined {
  return PLANS.find((p) => p.priceId === priceId);
}

export function getPlanBySlug(slug: string): PlanConfig | undefined {
  return PLANS.find((p) => p.slug === slug);
}
