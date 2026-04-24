"use client";

import { useEffect, useState } from "react";
import { Plus, Trash2, Edit2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import type { CouponDetails } from "@/lib/db/coupons";
import { CreateCouponModal } from "@/components/admin/create-coupon-modal";

interface CouponWithUsage extends CouponDetails {
  current_uses: number;
  max_uses: number | null;
}

export default function AdminCouponsPage() {
  const [coupons, setCoupons] = useState<CouponWithUsage[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<CouponWithUsage | null>(null);

  useEffect(() => {
    loadCoupons();
  }, []);

  async function loadCoupons() {
    try {
      setLoading(true);
      const response = await fetch("/api/admin/coupons");
      if (!response.ok) throw new Error("Failed to load coupons");

      const data = await response.json();
      setCoupons(data);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to load coupons";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }

  async function handleDeleteCoupon(couponId: string) {
    if (!confirm("Are you sure you want to delete this coupon?")) return;

    try {
      const response = await fetch(`/api/admin/coupons/${couponId}`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("Failed to delete coupon");

      toast.success("Coupon deleted");
      setCoupons(coupons.filter((c) => c.id !== couponId));
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to delete coupon";
      toast.error(message);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Coupon Codes</h1>
          <p className="text-muted-foreground mt-1">
            Create and manage discount codes for your dealership clients
          </p>
        </div>
        <Button
          onClick={() => setShowCreateModal(true)}
          className="gradient-primary text-white"
        >
          <Plus className="h-4 w-4 mr-2" />
          New Coupon
        </Button>
      </div>

      {/* Coupons Table */}
      {coupons.length === 0 ? (
        <Card>
          <CardContent className="pt-12 pb-12 text-center">
            <p className="text-muted-foreground mb-4">No coupons yet</p>
            <Button
              onClick={() => setShowCreateModal(true)}
              variant="outline"
            >
              Create Your First Coupon
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left px-6 py-4 font-semibold text-sm">
                      Code
                    </th>
                    <th className="text-left px-6 py-4 font-semibold text-sm">
                      Discount
                    </th>
                    <th className="text-left px-6 py-4 font-semibold text-sm">
                      Usage
                    </th>
                    <th className="text-left px-6 py-4 font-semibold text-sm">
                      Status
                    </th>
                    <th className="text-left px-6 py-4 font-semibold text-sm">
                      Expires
                    </th>
                    <th className="text-right px-6 py-4 font-semibold text-sm">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {coupons.map((coupon) => (
                    <tr key={coupon.id} className="border-b hover:bg-muted/50">
                      <td className="px-6 py-4">
                        <code className="font-mono font-semibold text-sm bg-muted px-2 py-1 rounded">
                          {coupon.code}
                        </code>
                      </td>
                      <td className="px-6 py-4 text-sm">
                        {coupon.discount_type === "percentage"
                          ? `${coupon.discount_value}% off`
                          : coupon.discount_type === "fixed"
                            ? `$${coupon.discount_value} off`
                            : `${coupon.discount_value} free days`}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        {coupon.max_uses ? (
                          <span>
                            {coupon.current_uses} / {coupon.max_uses}
                          </span>
                        ) : (
                          <span>{coupon.current_uses} (Unlimited)</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <span
                          className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
                            coupon.active
                              ? "bg-green-100 text-green-700"
                              : "bg-gray-100 text-gray-700"
                          }`}
                        >
                          {coupon.active ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm">
                        {coupon.expiration_date
                          ? new Date(coupon.expiration_date).toLocaleDateString()
                          : "Never"}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setEditingCoupon(coupon)}
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-red-600 hover:text-red-700"
                            onClick={() => handleDeleteCoupon(coupon.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Modals */}
      {showCreateModal && (
        <CreateCouponModal
          onClose={() => {
            setShowCreateModal(false);
            loadCoupons();
          }}
        />
      )}

      {editingCoupon && (
        <CreateCouponModal
          coupon={editingCoupon}
          onClose={() => {
            setEditingCoupon(null);
            loadCoupons();
          }}
        />
      )}
    </div>
  );
}
