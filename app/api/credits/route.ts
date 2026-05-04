/**
 * Dealer-facing credits endpoint
 * GET /api/credits — returns own dealership credit balance + recent transactions
 */

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getCreditBalanceAdmin, getCreditTransactions } from "@/lib/db/credits";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: profile } = await supabase
    .from("profiles")
    .select("dealership_id")
    .eq("id", user.id)
    .single();

  if (!profile?.dealership_id) {
    return NextResponse.json({ error: "No dealership linked" }, { status: 404 });
  }

  const [balance, transactions] = await Promise.all([
    getCreditBalanceAdmin(profile.dealership_id),
    getCreditTransactions(profile.dealership_id, 20),
  ]);

  return NextResponse.json({
    balance: balance ?? {
      dealership_id: profile.dealership_id,
      balance: 0,
      total_granted: 0,
      total_used: 0,
    },
    transactions,
  });
}
