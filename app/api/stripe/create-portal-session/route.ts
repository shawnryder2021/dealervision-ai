/**
 * Creates a Stripe Billing Portal session.
 * Allows users to manage their subscription, update card, view invoices, cancel.
 *
 * POST /api/stripe/create-portal-session
 * Body: { dealershipId: string }
 *
 * Returns: { url: string }
 */
import { NextRequest, NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe/client";
import { getSubscription } from "@/lib/db/subscriptions";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { dealershipId: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { dealershipId } = body;
  if (!dealershipId) {
    return NextResponse.json({ error: "dealershipId is required" }, { status: 400 });
  }

  const sub = await getSubscription(dealershipId);
  if (!sub?.stripe_customer_id) {
    return NextResponse.json({ error: "No subscription found for this dealership" }, { status: 404 });
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  const portalSession = await getStripe().billingPortal.sessions.create({
    customer: sub.stripe_customer_id,
    return_url: `${appUrl}/dashboard/settings/billing`,
  });

  return NextResponse.json({ url: portalSession.url });
}
