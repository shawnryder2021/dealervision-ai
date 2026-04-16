/**
 * Stripe webhook endpoint.
 *
 * Verifies the Stripe signature then handles:
 * - customer.subscription.created / updated / deleted
 * - invoice.payment_succeeded / payment_failed
 *
 * This route must receive the RAW request body (not parsed JSON) for signature
 * verification — set `bodyParser: false` via Next.js config is not needed in
 * App Router; reading req.text() achieves the same thing.
 *
 * Register this URL in the Stripe Dashboard:
 *   https://dashboard.stripe.com/webhooks
 *   URL: https://yourdomain.com/api/stripe/webhooks
 */
import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { getStripe } from "@/lib/stripe/client";
import { upsertSubscription, getSubscriptionByCustomerId } from "@/lib/db/subscriptions";

export const runtime = "nodejs";

// Must read raw body for webhook signature verification
export async function POST(req: NextRequest) {
  const body = await req.text();
  const sig = req.headers.get("stripe-signature");

  if (!sig) {
    return NextResponse.json({ error: "Missing stripe-signature header" }, { status: 400 });
  }

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    console.error("STRIPE_WEBHOOK_SECRET is not set");
    return NextResponse.json({ error: "Webhook secret not configured" }, { status: 500 });
  }

  let event: Stripe.Event;
  try {
    event = getStripe().webhooks.constructEvent(body, sig, webhookSecret);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("Webhook signature verification failed:", message);
    return NextResponse.json({ error: `Webhook error: ${message}` }, { status: 400 });
  }

  try {
    await handleEvent(event);
  } catch (err) {
    console.error(`Error handling Stripe event ${event.type}:`, err);
    // Return 200 so Stripe doesn't retry — log the error for investigation
    return NextResponse.json({ received: true, error: "Handler failed (logged)" });
  }

  return NextResponse.json({ received: true });
}

// ─── Event handlers ────────────────────────────────────────────────────────────

async function handleEvent(event: Stripe.Event): Promise<void> {
  switch (event.type) {
    case "customer.subscription.created":
    case "customer.subscription.updated":
      await handleSubscriptionUpsert(event.data.object as Stripe.Subscription);
      break;

    case "customer.subscription.deleted":
      await handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
      break;

    case "invoice.payment_succeeded":
      await handlePaymentSucceeded(event.data.object as Stripe.Invoice);
      break;

    case "invoice.payment_failed":
      await handlePaymentFailed(event.data.object as Stripe.Invoice);
      break;

    case "customer.created":
      // We create the customer row at checkout initiation time, nothing to do here
      break;

    default:
      // Ignore unhandled events
      break;
  }
}

async function handleSubscriptionUpsert(sub: Stripe.Subscription): Promise<void> {
  const customerId = typeof sub.customer === "string" ? sub.customer : sub.customer.id;

  // Find the dealership linked to this Stripe customer
  const existing = await getSubscriptionByCustomerId(customerId);
  if (!existing) {
    console.warn(`No subscription row found for Stripe customer ${customerId}`);
    return;
  }

  const priceId = sub.items.data[0]?.price?.id ?? null;
  const periodStart = sub.current_period_start
    ? new Date(sub.current_period_start * 1000).toISOString()
    : null;
  const periodEnd = sub.current_period_end
    ? new Date(sub.current_period_end * 1000).toISOString()
    : null;
  const canceledAt = sub.canceled_at
    ? new Date(sub.canceled_at * 1000).toISOString()
    : null;

  await upsertSubscription({
    dealership_id: existing.dealership_id,
    stripe_customer_id: customerId,
    stripe_subscription_id: sub.id,
    stripe_price_id: priceId,
    status: sub.status,
    current_period_start: periodStart,
    current_period_end: periodEnd,
    cancel_at_period_end: sub.cancel_at_period_end,
    canceled_at: canceledAt,
  });
}

async function handleSubscriptionDeleted(sub: Stripe.Subscription): Promise<void> {
  const customerId = typeof sub.customer === "string" ? sub.customer : sub.customer.id;
  const existing = await getSubscriptionByCustomerId(customerId);
  if (!existing) return;

  await upsertSubscription({
    dealership_id: existing.dealership_id,
    stripe_customer_id: customerId,
    stripe_subscription_id: sub.id,
    stripe_price_id: existing.stripe_price_id ?? undefined,
    status: "canceled",
    cancel_at_period_end: false,
    canceled_at: new Date().toISOString(),
  });
}

async function handlePaymentSucceeded(invoice: Stripe.Invoice): Promise<void> {
  // Subscription row is already updated by the subscription.updated event.
  // Log for debugging — could send a receipt email here.
  const customerId = typeof invoice.customer === "string"
    ? invoice.customer
    : invoice.customer?.id;
  console.log(`Payment succeeded for customer ${customerId}, invoice ${invoice.id}`);
}

async function handlePaymentFailed(invoice: Stripe.Invoice): Promise<void> {
  const customerId = typeof invoice.customer === "string"
    ? invoice.customer
    : invoice.customer?.id;
  console.warn(`Payment failed for customer ${customerId}, invoice ${invoice.id}`);
  // TODO: send a "payment failed" email via Resend/Postmark
}
