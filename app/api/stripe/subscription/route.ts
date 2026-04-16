/**
 * GET /api/stripe/subscription?dealershipId=xxx
 * Returns the current subscription and monthly usage for a dealership.
 */
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getSubscription, getMonthlyUsage } from "@/lib/db/subscriptions";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const dealershipId = req.nextUrl.searchParams.get("dealershipId");
  if (!dealershipId) {
    return NextResponse.json({ error: "dealershipId is required" }, { status: 400 });
  }

  const [subscription, usage] = await Promise.all([
    getSubscription(dealershipId),
    getMonthlyUsage(dealershipId),
  ]);

  return NextResponse.json({ subscription, usage });
}
