"use client";

import { useState } from "react";
import { AlertCircle, CheckCircle2, Loader2, Zap } from "lucide-react";
import type { CouponValidationResult } from "@/lib/db/coupons";

interface CouponStepProps {
  selectedPlan?: string;
  onCouponApply?: (coupon: CouponValidationResult["coupon"]) => void;
  onCouponRemove?: () => void;
  appliedCoupon?: CouponValidationResult["coupon"] | null;
}

export function CouponStep({
  selectedPlan,
  onCouponApply,
  onCouponRemove,
  appliedCoupon,
}: CouponStepProps) {
  const [couponCode, setCouponCode] = useState("");
  const [validating, setValidating] = useState(false);
  const [validationResult, setValidationResult] =
    useState<CouponValidationResult | null>(null);

  const handleValidateCoupon = async (code: string) => {
    if (!code.trim()) {
      setValidationResult(null);
      return;
    }

    setValidating(true);
    try {
      const response = await fetch("/api/coupons/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: code.trim(),
          plan: selectedPlan,
        }),
      });

      const result = await response.json();
      setValidationResult(result);

      // Call callback if coupon is valid
      if (result.valid && result.coupon && onCouponApply) {
        onCouponApply(result.coupon);
      }
    } catch (error) {
      console.error("Error validating coupon:", error);
      setValidationResult({
        valid: false,
        error: "Failed to validate coupon. Please try again.",
      });
    } finally {
      setValidating(false);
    }
  };

  const handleRemoveCoupon = () => {
    setCouponCode("");
    setValidationResult(null);
    if (onCouponRemove) {
      onCouponRemove();
    }
  };

  if (appliedCoupon) {
    return (
      <div className="space-y-4">
        <div className="rounded-xl bg-green-50 border border-green-200 p-4">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="h-5 w-5 text-green-600 shrink-0 mt-0.5" />
            <div className="flex-1">
              <h3 className="font-semibold text-green-900">
                Coupon Applied: {appliedCoupon.code}
              </h3>
              <p className="text-sm text-green-700 mt-1">
                {appliedCoupon.discount_type === "percentage"
                  ? `${appliedCoupon.discount_value}% discount`
                  : appliedCoupon.discount_type === "fixed"
                    ? `$${appliedCoupon.discount_value} off`
                    : `${appliedCoupon.discount_value} free trial days`}
              </p>
              <button
                onClick={handleRemoveCoupon}
                className="text-xs text-green-600 hover:text-green-700 font-medium mt-2"
              >
                Remove coupon
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <label htmlFor="coupon" className="block text-sm font-medium mb-2">
          Have a coupon code? (Optional)
        </label>
        <div className="flex gap-2">
          <input
            id="coupon"
            type="text"
            value={couponCode}
            onChange={(e) => {
              setCouponCode(e.target.value);
              if (e.target.value.trim()) {
                handleValidateCoupon(e.target.value);
              } else {
                setValidationResult(null);
              }
            }}
            placeholder="Enter coupon code"
            className="flex-1 px-4 py-2.5 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={validating}
          />
          {couponCode && validating && (
            <div className="flex items-center px-4">
              <Loader2 className="h-5 w-5 text-gray-400 animate-spin" />
            </div>
          )}
        </div>
      </div>

      {validationResult && !validationResult.valid && (
        <div className="rounded-lg bg-red-50 border border-red-200 p-3 flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
          <p className="text-sm text-red-700">{validationResult.error}</p>
        </div>
      )}

      {validationResult && validationResult.valid && validationResult.coupon && (
        <div className="rounded-lg bg-blue-50 border border-blue-200 p-3 flex items-start gap-3">
          <Zap className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-blue-900">
              {validationResult.coupon.discount_type === "percentage"
                ? `Save ${validationResult.coupon.discount_value}% on your subscription`
                : validationResult.coupon.discount_type === "fixed"
                  ? `Save $${validationResult.coupon.discount_value} on your subscription`
                  : `Get ${validationResult.coupon.discount_value} free trial days`}
            </p>
          </div>
        </div>
      )}

      <p className="text-xs text-gray-500">
        Coupon codes are optional. Leave blank to proceed without a discount.
      </p>
    </div>
  );
}
