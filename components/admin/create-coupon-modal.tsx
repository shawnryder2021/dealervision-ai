"use client";

import { useState } from "react";
import { X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import type { CouponDetails } from "@/lib/db/coupons";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface CreateCouponModalProps {
  coupon?: CouponDetails & { current_uses: number; max_uses: number | null };
  onClose: () => void;
}

export function CreateCouponModal({ coupon, onClose }: CreateCouponModalProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    code: coupon?.code || "",
    description: coupon?.description || "",
    discount_type: (coupon?.discount_type || "percentage") as
      | "percentage"
      | "fixed"
      | "free_trial_days",
    discount_value: coupon?.discount_value || 0,
    max_uses: coupon?.max_uses || "",
    active: coupon?.active !== false,
    expiration_date: coupon?.expiration_date
      ? new Date(coupon.expiration_date).toISOString().split("T")[0]
      : "",
    applicable_plans: coupon?.applicable_plans?.join(", ") || "",
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!formData.code.trim()) {
      toast.error("Coupon code is required");
      return;
    }

    if (formData.discount_value <= 0) {
      toast.error("Discount value must be greater than 0");
      return;
    }

    setLoading(true);
    try {
      const endpoint = coupon ? `/api/admin/coupons/${coupon.id}` : "/api/admin/coupons";
      const method = coupon ? "PUT" : "POST";

      const response = await fetch(endpoint, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: formData.code.toUpperCase().trim(),
          description: formData.description || null,
          discount_type: formData.discount_type,
          discount_value: parseFloat(String(formData.discount_value)),
          max_uses: formData.max_uses ? parseInt(String(formData.max_uses)) : null,
          active: formData.active,
          expiration_date: formData.expiration_date || null,
          applicable_plans: formData.applicable_plans
            ? formData.applicable_plans.split(",").map((p) => p.trim())
            : null,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to save coupon");
      }

      toast.success(coupon ? "Coupon updated" : "Coupon created");
      onClose();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to save coupon";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-lg max-w-md w-full">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <h2 className="font-heading font-bold">
            {coupon ? "Edit Coupon" : "Create Coupon"}
          </h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4 px-6 py-4 max-h-[80vh] overflow-y-auto">
          <div className="space-y-2">
            <Label htmlFor="code">Coupon Code</Label>
            <Input
              id="code"
              value={formData.code}
              onChange={(e) => setFormData({ ...formData, code: e.target.value })}
              placeholder="SUMMER50"
              disabled={!!coupon || loading}
              className="font-mono uppercase"
            />
            <p className="text-xs text-muted-foreground">
              Code will be automatically converted to uppercase
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description (Optional)</Label>
            <Input
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Summer promotion discount"
              disabled={loading}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="discount_type">Discount Type</Label>
              <Select
                value={formData.discount_type}
                onValueChange={(value) =>
                  setFormData({
                    ...formData,
                    discount_type: value as any,
                  })
                }
                disabled={loading}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="percentage">Percentage Off</SelectItem>
                  <SelectItem value="fixed">Dollar Amount Off</SelectItem>
                  <SelectItem value="free_trial_days">Free Trial Days</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="discount_value">
                {formData.discount_type === "percentage"
                  ? "Percentage"
                  : formData.discount_type === "fixed"
                    ? "Amount ($)"
                    : "Days"}
              </Label>
              <Input
                id="discount_value"
                type="number"
                value={formData.discount_value}
                onChange={(e) =>
                  setFormData({ ...formData, discount_value: parseFloat(e.target.value) || 0 })
                }
                placeholder="50"
                disabled={loading}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="max_uses">Max Uses (Leave empty for unlimited)</Label>
            <Input
              id="max_uses"
              type="number"
              value={formData.max_uses}
              onChange={(e) =>
                setFormData({ ...formData, max_uses: e.target.value })
              }
              placeholder="100"
              disabled={loading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="expiration_date">Expiration Date (Optional)</Label>
            <Input
              id="expiration_date"
              type="date"
              value={formData.expiration_date}
              onChange={(e) =>
                setFormData({ ...formData, expiration_date: e.target.value })
              }
              disabled={loading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="applicable_plans">
              Applicable Plans (Optional - comma-separated)
            </Label>
            <Input
              id="applicable_plans"
              value={formData.applicable_plans}
              onChange={(e) =>
                setFormData({ ...formData, applicable_plans: e.target.value })
              }
              placeholder="starter, professional"
              disabled={loading}
            />
            <p className="text-xs text-muted-foreground">
              Leave empty for all plans
            </p>
          </div>

          <div className="flex items-center gap-2 px-3 py-2 border rounded-lg">
            <input
              type="checkbox"
              id="active"
              checked={formData.active}
              onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
              disabled={loading}
              className="h-4 w-4 rounded"
            />
            <Label htmlFor="active" className="font-normal cursor-pointer">
              Coupon is active
            </Label>
          </div>
        </form>

        {/* Footer */}
        <div className="flex gap-2 px-6 py-4 border-t bg-muted/50">
          <Button onClick={onClose} variant="outline" disabled={loading} className="flex-1">
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={loading} className="flex-1 gradient-primary text-white">
            {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
            {coupon ? "Update" : "Create"}
          </Button>
        </div>
      </div>
    </div>
  );
}
