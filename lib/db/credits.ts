/**
 * Dealership credits helpers.
 * All write operations use the service-role client so they bypass RLS.
 * Read operations use the regular client (RLS allows dealers to see own balance).
 */

import { createClient, createServiceClient } from "@/lib/supabase/server";

export interface CreditBalance {
  dealership_id: string;
  balance: number;
  total_granted: number;
  total_used: number;
  updated_at: string;
}

export interface CreditTransaction {
  id: string;
  dealership_id: string;
  amount: number;
  type: "grant" | "usage" | "adjustment";
  note: string | null;
  admin_email: string | null;
  created_at: string;
}

// ── Read ──────────────────────────────────────────────────────────────────────

/** Get credit balance for a dealership (returns null if no row yet = 0 credits). */
export async function getCreditBalance(dealershipId: string): Promise<CreditBalance | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("dealership_credits")
    .select("*")
    .eq("dealership_id", dealershipId)
    .single();
  return (data as CreditBalance) ?? null;
}

/** Get balance using service role (for server-side quota checks). */
export async function getCreditBalanceAdmin(dealershipId: string): Promise<CreditBalance | null> {
  const supabase = await createServiceClient();
  const { data } = await supabase
    .from("dealership_credits")
    .select("*")
    .eq("dealership_id", dealershipId)
    .single();
  return (data as CreditBalance) ?? null;
}

/** Get recent credit transactions for a dealership. */
export async function getCreditTransactions(
  dealershipId: string,
  limit = 50
): Promise<CreditTransaction[]> {
  const supabase = await createServiceClient();
  const { data } = await supabase
    .from("credit_transactions")
    .select("*")
    .eq("dealership_id", dealershipId)
    .order("created_at", { ascending: false })
    .limit(limit);
  return (data as CreditTransaction[]) ?? [];
}

// ── Write (service-role only) ─────────────────────────────────────────────────

/**
 * Grant or adjust credits for a dealership.
 * amount > 0 = add credits, amount < 0 = remove credits (adjustment).
 * Ensures balance never goes below 0.
 */
export async function grantCredits(
  dealershipId: string,
  amount: number,
  note: string,
  adminEmail: string,
  type: "grant" | "adjustment" = "grant"
): Promise<CreditBalance> {
  const supabase = await createServiceClient();

  // Upsert balance row
  const { data: existing } = await supabase
    .from("dealership_credits")
    .select("balance, total_granted")
    .eq("dealership_id", dealershipId)
    .single();

  const currentBalance = existing?.balance ?? 0;
  const currentGranted = existing?.total_granted ?? 0;
  const newBalance = Math.max(0, currentBalance + amount);
  const newGranted = type === "grant" ? currentGranted + Math.max(0, amount) : currentGranted;

  const { data, error } = await supabase
    .from("dealership_credits")
    .upsert(
      {
        dealership_id: dealershipId,
        balance: newBalance,
        total_granted: newGranted,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "dealership_id" }
    )
    .select()
    .single();

  if (error) throw new Error(error.message);

  // Record the transaction
  await supabase.from("credit_transactions").insert({
    dealership_id: dealershipId,
    amount,
    type,
    note,
    admin_email: adminEmail,
  });

  return data as CreditBalance;
}

/**
 * Atomically deduct 1 credit via the DB function.
 * Returns the new balance, or -1 if insufficient credits.
 */
export async function deductOneCredit(dealershipId: string): Promise<number> {
  const supabase = await createServiceClient();
  const { data, error } = await supabase.rpc("deduct_one_credit", {
    p_dealership_id: dealershipId,
  });
  if (error) {
    console.error("deductOneCredit error:", error);
    return -1;
  }
  return data as number;
}
