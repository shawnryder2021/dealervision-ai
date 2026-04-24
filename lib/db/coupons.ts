import { createClient } from "@/lib/supabase/client";
import type { Database } from "@/lib/supabase/types";

const supabase = createClient();

export interface CouponDetails {
  id: string;
  code: string;
  description: string | null;
  discount_type: "percentage" | "fixed" | "free_trial_days";
  discount_value: number;
  applicable_plans: string[] | null;
  active: boolean;
  expiration_date: string | null;
}

export interface CouponValidationResult {
  valid: boolean;
  coupon?: CouponDetails;
  discount_amount?: number; // For fixed discounts
  discount_percent?: number; // For percentage discounts
  error?: string;
}

export interface ApplyCouponResult {
  success: boolean;
  discount_amount?: number;
  error?: string;
}

/**
 * Validate a coupon code
 * Checks if coupon is valid, active, not expired, within usage limits
 * Optionally validates if coupon applies to a specific plan
 */
export async function validateCoupon(
  code: string,
  planSlug?: string
): Promise<CouponValidationResult> {
  try {
    const { data, error } = await supabase
      .from("coupon_codes")
      .select("*")
      .eq("code", code.toUpperCase().trim())
      .single();

    if (error || !data) {
      return { valid: false, error: "Coupon code not found" };
    }

    // Check if coupon is active
    if (!data.active) {
      return { valid: false, error: "This coupon is no longer active" };
    }

    // Check if coupon has expired
    if (data.expiration_date) {
      const expDate = new Date(data.expiration_date);
      if (expDate < new Date()) {
        return { valid: false, error: "This coupon has expired" };
      }
    }

    // Check if coupon has reached max uses
    if (data.max_uses && data.current_uses >= data.max_uses) {
      return { valid: false, error: "This coupon has reached its usage limit" };
    }

    // Check if coupon applies to the requested plan
    if (planSlug && data.applicable_plans && data.applicable_plans.length > 0) {
      if (!data.applicable_plans.includes(planSlug)) {
        return {
          valid: false,
          error: `This coupon cannot be applied to the ${planSlug} plan`,
        };
      }
    }

    // Coupon is valid
    const couponDetails: CouponDetails = {
      id: data.id,
      code: data.code,
      discount_type: data.discount_type,
      discount_value: data.discount_value,
      applicable_plans: data.applicable_plans,
      active: data.active,
      expiration_date: data.expiration_date,
    };

    return {
      valid: true,
      coupon: couponDetails,
      discount_amount:
        data.discount_type === "fixed" ? data.discount_value : undefined,
      discount_percent:
        data.discount_type === "percentage" ? data.discount_value : undefined,
    };
  } catch (error) {
    console.error("Error validating coupon:", error);
    return { valid: false, error: "Error validating coupon" };
  }
}

/**
 * Record coupon usage for a dealership
 */
export async function applyCoupon(
  couponId: string,
  dealershipId: string,
  subscriptionId: string | null,
  discountAmount: number
): Promise<ApplyCouponResult> {
  try {
    // Increment coupon usage
    const { error: updateError } = await supabase
      .from("coupon_codes")
      .update({ current_uses: supabase.rpc("increment", { x: 1 }) })
      .eq("id", couponId);

    if (updateError) throw updateError;

    // Record usage
    const { error: insertError } = await supabase.from("coupon_usage").insert({
      coupon_id: couponId,
      dealership_id: dealershipId,
      subscription_id: subscriptionId,
      discount_amount: discountAmount,
      applied_at: new Date().toISOString(),
    });

    if (insertError) {
      // If UNIQUE constraint fails, coupon was already applied by this dealership
      if (insertError.code === "23505") {
        return { success: false, error: "Coupon already applied to this account" };
      }
      throw insertError;
    }

    return { success: true, discount_amount: discountAmount };
  } catch (error) {
    console.error("Error applying coupon:", error);
    return { success: false, error: "Error applying coupon" };
  }
}

/**
 * Get coupon details by code
 */
export async function getCouponByCode(code: string): Promise<CouponDetails | null> {
  try {
    const { data, error } = await supabase
      .from("coupon_codes")
      .select("*")
      .eq("code", code.toUpperCase().trim())
      .single();

    if (error || !data) return null;

    return {
      id: data.id,
      code: data.code,
      discount_type: data.discount_type,
      discount_value: data.discount_value,
      applicable_plans: data.applicable_plans,
      active: data.active,
      expiration_date: data.expiration_date,
    };
  } catch (error) {
    console.error("Error getting coupon:", error);
    return null;
  }
}

/**
 * Create a new coupon (admin only)
 */
export async function createCoupon(params: {
  code: string;
  description?: string;
  discount_type: "percentage" | "fixed" | "free_trial_days";
  discount_value: number;
  max_uses?: number;
  applicable_plans?: string[];
  expiration_date?: string;
}): Promise<{ success: boolean; coupon?: CouponDetails; error?: string }> {
  try {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) {
      return { success: false, error: "Not authenticated" };
    }

    const { data, error } = await supabase
      .from("coupon_codes")
      .insert({
        code: params.code.toUpperCase().trim(),
        description: params.description,
        discount_type: params.discount_type,
        discount_value: params.discount_value,
        max_uses: params.max_uses || null,
        applicable_plans: params.applicable_plans || null,
        expiration_date: params.expiration_date || null,
        created_by: userData.user.id,
      })
      .select()
      .single();

    if (error) throw error;

    return {
      success: true,
      coupon: {
        id: data.id,
        code: data.code,
        discount_type: data.discount_type,
        discount_value: data.discount_value,
        applicable_plans: data.applicable_plans,
        active: data.active,
        expiration_date: data.expiration_date,
      },
    };
  } catch (error) {
    console.error("Error creating coupon:", error);
    return { success: false, error: "Error creating coupon" };
  }
}

/**
 * Get all coupons with usage stats (admin only)
 */
export async function listCoupons(): Promise<
  Array<CouponDetails & { current_uses: number; max_uses: number | null }>
> {
  try {
    const { data, error } = await supabase
      .from("coupon_codes")
      .select("id, code, discount_type, discount_value, applicable_plans, active, expiration_date, current_uses, max_uses")
      .order("created_at", { ascending: false });

    if (error) throw error;

    return data || [];
  } catch (error) {
    console.error("Error listing coupons:", error);
    return [];
  }
}

/**
 * Update a coupon (admin only)
 */
export async function updateCoupon(
  couponId: string,
  updates: Partial<{
    description: string;
    discount_value: number;
    max_uses: number;
    applicable_plans: string[];
    active: boolean;
    expiration_date: string;
  }>
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from("coupon_codes")
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq("id", couponId);

    if (error) throw error;

    return { success: true };
  } catch (error) {
    console.error("Error updating coupon:", error);
    return { success: false, error: "Error updating coupon" };
  }
}

/**
 * Delete a coupon (admin only)
 */
export async function deleteCoupon(couponId: string): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    const { error } = await supabase
      .from("coupon_codes")
      .delete()
      .eq("id", couponId);

    if (error) throw error;

    return { success: true };
  } catch (error) {
    console.error("Error deleting coupon:", error);
    return { success: false, error: "Error deleting coupon" };
  }
}

/**
 * Check if a dealership has already used a coupon
 */
export async function hasUsedCoupon(
  dealershipId: string,
  couponId: string
): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from("coupon_usage")
      .select("id")
      .eq("dealership_id", dealershipId)
      .eq("coupon_id", couponId)
      .single();

    if (error && error.code !== "PGRST116") {
      // PGRST116 = no rows returned (expected)
      throw error;
    }

    return !!data;
  } catch (error) {
    console.error("Error checking coupon usage:", error);
    return false;
  }
}
