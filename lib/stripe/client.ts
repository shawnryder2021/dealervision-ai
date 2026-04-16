/**
 * Stripe server-side client (singleton).
 * Only import this from server-side code (API routes, server actions).
 */
import Stripe from "stripe";
export { PLANS, getPlanByPriceId, getPlanBySlug } from "@/lib/stripe/plans";
export type { PlanConfig } from "@/lib/stripe/plans";

// Singleton pattern to avoid creating multiple instances
// NOTE: STRIPE_SECRET_KEY is validated lazily inside getStripe() so the module
// can be imported during the Next.js build without the env var being present.
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

