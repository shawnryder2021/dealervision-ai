/**
 * Creates a Stripe Checkout session for a given plan.
 *
 * POST /api/stripe/checkout-session
 * Body: { priceId: string; dealershipId: string; userEmail: string }
 *
 * Returns: { url: string }  — redirect the user to this URL
 */
import { NextRequest, NextResponse } from "next/server";
import { getStripe, PLANS } from "@/lib/stripe/client";
import { getSubscription, upsertSubscription } from "@/lib/db/subscriptions";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  // Verify auth
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { priceId: string; dealershipId: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { priceId, dealershipId } = body;
  if (!priceId || !dealershipId) {
    return NextResponse.json({ error: "priceId and dealershipId are required" }, { status: 400 });
  }

  // Validate plan exists
  const plan = PLANS.find((p) => p.priceId === priceId);
  if (!plan) {
    return NextResponse.json({ error: "Invalid price ID" }, { status: 400 });
  }

  const stripe = getStripe();

  // Get or create Stripe customer
  let stripeCustomerId: string;
  const existing = await getSubscription(dealershipId);

  if (existing?.stripe_customer_id) {
    stripeCustomerId = existing.stripe_customer_id;
  } else {
    // Create a new Stripe customer
    const customer = await stripe.customers.create({
      email: user.email,
      metadata: {
        dealership_id: dealershipId,
        supabase_user_id: user.id,
      },
    });
    stripeCustomerId = customer.id;

    // Save customer ID immediately so webhooks can find this dealership
    await upsertSubscription({
      dealership_id: dealershipId,
      stripe_customer_id: stripeCustomerId,
      status: "incomplete",
    });
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  const session = await stripe.checkout.sessions.create({
    customer: stripeCustomerId,
    mode: "subscription",
    payment_method_types: ["card"],
    line_items: [{ price: priceId, quantity: 1 }],
    subscription_data: {
      metadata: {
        dealership_id: dealershipId,
      },
    },
    // Allow users to cancel anytime (no trial, no lock-in)
    success_url: `${appUrl}/dashboard/settings/billing?success=true&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${appUrl}/pricing?canceled=true`,
    allow_promotion_codes: true,
    billing_address_collection: "auto",
  });

  if (!session.url) {
    return NextResponse.json({ error: "Failed to create checkout session" }, { status: 500 });
  }

  return NextResponse.json({ url: session.url });
}
