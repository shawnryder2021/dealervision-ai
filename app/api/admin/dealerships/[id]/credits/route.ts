/**
 * Admin: view and manage credits for a dealership
 * GET  /api/admin/dealerships/[id]/credits  — balance + transaction history
 * POST /api/admin/dealerships/[id]/credits  — grant or adjust credits
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isSuperAdmin } from "@/lib/db/admin";
import {
  getCreditBalanceAdmin,
  getCreditTransactions,
  grantCredits,
} from "@/lib/db/credits";

async function getAdminUser() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user?.email || !(await isSuperAdmin(user.email))) return null;
  return user;
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await getAdminUser();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  const { id: dealershipId } = await params;
  const [balance, transactions] = await Promise.all([
    getCreditBalanceAdmin(dealershipId),
    getCreditTransactions(dealershipId, 100),
  ]);

  return NextResponse.json({
    balance: balance ?? {
      dealership_id: dealershipId,
      balance: 0,
      total_granted: 0,
      total_used: 0,
    },
    transactions,
  });
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await getAdminUser();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  const { id: dealershipId } = await params;
  const body = await req.json();
  const { amount, note, type = "grant" } = body;

  if (!amount || typeof amount !== "number" || amount === 0) {
    return NextResponse.json({ error: "amount must be a non-zero number" }, { status: 400 });
  }
  if (!["grant", "adjustment"].includes(type)) {
    return NextResponse.json({ error: "type must be grant or adjustment" }, { status: 400 });
  }

  try {
    const balance = await grantCredits(
      dealershipId,
      amount,
      note || (amount > 0 ? "Credits granted by admin" : "Credits adjusted by admin"),
      admin.email!,
      type
    );
    return NextResponse.json({ balance, message: "Credits updated" });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
