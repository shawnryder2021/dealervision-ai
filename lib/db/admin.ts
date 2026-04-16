/**
 * Admin utilities for platform configuration and super admin operations.
 */

import { createClient } from "@/lib/supabase/server";

// ─── Super Admin Management ────────────────────────────────────────────────────

export interface SuperAdmin {
  id: string;
  email: string;
  granted_at: string;
  granted_by: string | null;
  revoked_at: string | null;
  notes: string | null;
}

export async function isSuperAdmin(email: string): Promise<boolean> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("super_admins")
    .select("id")
    .eq("email", email)
    .is("revoked_at", null)
    .single();
  return !!data;
}

export async function getSuperAdmins(): Promise<SuperAdmin[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("super_admins")
    .select("*")
    .is("revoked_at", null)
    .order("granted_at", { ascending: false });
  if (error) return [];
  return data as SuperAdmin[];
}

export async function grantSuperAdmin(
  email: string,
  grantedBy: string
): Promise<SuperAdmin | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("super_admins")
    .upsert(
      {
        email,
        granted_by: grantedBy,
        revoked_at: null,
      },
      { onConflict: "email" }
    )
    .select()
    .single();
  if (error) {
    console.error("Failed to grant super admin:", error);
    return null;
  }
  return data as SuperAdmin;
}

export async function revokeSuperAdmin(email: string): Promise<boolean> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("super_admins")
    .update({ revoked_at: new Date().toISOString() })
    .eq("email", email);
  if (error) {
    console.error("Failed to revoke super admin:", error);
    return false;
  }
  return true;
}

// ─── Stripe Configuration ──────────────────────────────────────────────────────

export interface StripeConfig {
  id: string;
  secret_key: string;
  publishable_key: string;
  webhook_secret: string;
  account_id: string | null;
  test_mode: boolean;
  configured_at: string;
  configured_by: string;
  last_tested_at: string | null;
  last_test_status: string | null;
  last_test_message: string | null;
}

export interface StripeConfigMasked {
  id: string;
  publishable_key: string;
  webhook_secret: string;
  account_id: string | null;
  test_mode: boolean;
  configured_at: string;
  configured_by: string;
  last_tested_at: string | null;
  last_test_status: string | null;
}

/**
 * Get current Stripe configuration (masked for security)
 */
export async function getStripeConfig(): Promise<StripeConfigMasked | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("stripe_config")
    .select("id, publishable_key, webhook_secret, account_id, test_mode, configured_at, configured_by, last_tested_at, last_test_status")
    .order("configured_at", { ascending: false })
    .limit(1)
    .single();

  if (error) return null;
  return data as StripeConfigMasked;
}

/**
 * Get full Stripe configuration (includes secret key - admin only)
 */
export async function getStripeConfigFull(): Promise<StripeConfig | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("stripe_config")
    .select("*")
    .order("configured_at", { ascending: false })
    .limit(1)
    .single();

  if (error) return null;
  return data as StripeConfig;
}

export interface StripeConfigUpdate {
  secret_key?: string;
  publishable_key?: string;
  webhook_secret?: string;
  account_id?: string | null;
  test_mode?: boolean;
  last_tested_at?: string | null;
  last_test_status?: string | null;
  last_test_message?: string | null;
}

/**
 * Update Stripe configuration
 */
export async function updateStripeConfig(
  config: StripeConfigUpdate,
  configuredBy: string
): Promise<StripeConfig | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("stripe_config")
    .upsert(
      {
        ...config,
        configured_by: configuredBy,
        configured_at: new Date().toISOString(),
      },
      {
        onConflict: "id",
      }
    )
    .select()
    .single();

  if (error) {
    console.error("Failed to update Stripe config:", error);
    return null;
  }
  return data as StripeConfig;
}

/**
 * Record Stripe connection test result
 */
export async function recordStripeTest(
  status: "success" | "failed",
  message?: string
): Promise<boolean> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("stripe_config")
    .update({
      last_tested_at: new Date().toISOString(),
      last_test_status: status,
      last_test_message: message || null,
    })
    .eq("id", (await getStripeConfig())?.id);

  if (error) {
    console.error("Failed to record Stripe test:", error);
    return false;
  }
  return true;
}
