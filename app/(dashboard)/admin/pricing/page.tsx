"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Zap, Rocket, Building2, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

interface Plan {
  id: string;
  name: string;
  slug: string;
  description: string;
  price_monthly_cents: number;
  stripe_price_id: string;
  monthly_assets_limit: number | null;
  monthly_pages_limit: number | null;
  monthly_posts_limit: number | null;
  max_team_members: number | null;
  features: Record<string, boolean>;
  is_active: boolean;
  created_at: string;
}

const PLAN_ICONS: Record<string, any> = {
  starter: Zap,
  professional: Rocket,
  enterprise: Building2,
};

export default function PricingPage() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingPlan, setEditingPlan] = useState<Partial<Plan> | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    try {
      const res = await fetch("/api/admin/plans");
      if (res.ok) {
        const data = await res.json();
        setPlans(data.plans);
      }
    } catch (error) {
      console.error("Failed to fetch plans:", error);
      toast.error("Failed to load pricing plans");
    } finally {
      setLoading(false);
    }
  };

  const startEdit = (plan: Plan) => {
    setEditingId(plan.id);
    setEditingPlan({ ...plan });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditingPlan(null);
  };

  const handleSavePlan = async () => {
    if (!editingPlan || !editingId) return;

    setSaving(true);
    try {
      const res = await fetch(`/api/admin/plans/${editingId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editingPlan),
      });

      if (res.ok) {
        toast.success("Plan updated");
        await fetchPlans();
        cancelEdit();
      } else {
        const data = await res.json();
        toast.error(data.error || "Failed to update plan");
      }
    } catch (error) {
      console.error("Error saving plan:", error);
      toast.error("Failed to save plan");
    } finally {
      setSaving(false);
    }
  };

  const handleDeletePlan = async (planId: string) => {
    if (!confirm("Archive this plan? Existing subscriptions will continue.")) {
      return;
    }

    try {
      const res = await fetch(`/api/admin/plans/${planId}`, {
        method: "DELETE",
      });

      if (res.ok) {
        toast.success("Plan archived");
        await fetchPlans();
      } else {
        toast.error("Failed to archive plan");
      }
    } catch (error) {
      console.error("Error deleting plan:", error);
      toast.error("Failed to archive plan");
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-heading font-bold">Pricing Plans</h1>
        <Card>
          <CardContent className="pt-6">Loading...</CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-heading font-bold tracking-tight">
            Pricing Plans
          </h1>
          <p className="text-muted-foreground mt-2">
            Manage subscription tiers and limits
          </p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          New Plan
        </Button>
      </div>

      {/* Plans Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {plans.map((plan) => {
          const Icon = PLAN_ICONS[plan.slug] || Zap;
          const isEditing = editingId === plan.id;

          if (isEditing && editingPlan) {
            return (
              <Card key={plan.id} className="border-blue-500/50">
                <CardHeader className="pb-3">
                  <Input
                    type="text"
                    value={editingPlan.name || ""}
                    onChange={(e) =>
                      setEditingPlan({ ...editingPlan, name: e.target.value })
                    }
                    className="font-bold"
                    placeholder="Plan name"
                  />
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <label className="text-xs font-medium">Price/Month (cents)</label>
                    <Input
                      type="number"
                      value={editingPlan.price_monthly_cents || ""}
                      onChange={(e) =>
                        setEditingPlan({
                          ...editingPlan,
                          price_monthly_cents: parseInt(e.target.value),
                        })
                      }
                    />
                  </div>

                  <div>
                    <label className="text-xs font-medium">Assets/Month</label>
                    <Input
                      type="number"
                      value={editingPlan.monthly_assets_limit ?? ""}
                      onChange={(e) =>
                        setEditingPlan({
                          ...editingPlan,
                          monthly_assets_limit: e.target.value
                            ? parseInt(e.target.value)
                            : null,
                        })
                      }
                      placeholder="Leave blank for unlimited"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-medium">Pages/Month</label>
                    <Input
                      type="number"
                      value={editingPlan.monthly_pages_limit ?? ""}
                      onChange={(e) =>
                        setEditingPlan({
                          ...editingPlan,
                          monthly_pages_limit: e.target.value
                            ? parseInt(e.target.value)
                            : null,
                        })
                      }
                      placeholder="Leave blank for unlimited"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-medium">Posts/Month</label>
                    <Input
                      type="number"
                      value={editingPlan.monthly_posts_limit ?? ""}
                      onChange={(e) =>
                        setEditingPlan({
                          ...editingPlan,
                          monthly_posts_limit: e.target.value
                            ? parseInt(e.target.value)
                            : null,
                        })
                      }
                      placeholder="Leave blank for unlimited"
                    />
                  </div>

                  <div className="flex gap-2 pt-4">
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1"
                      onClick={cancelEdit}
                    >
                      Cancel
                    </Button>
                    <Button
                      size="sm"
                      className="flex-1"
                      onClick={handleSavePlan}
                      disabled={saving}
                    >
                      {saving ? "Saving..." : "Save"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          }

          return (
            <Card key={plan.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Icon className="h-5 w-5" />
                    <h3 className="font-bold">{plan.name}</h3>
                  </div>
                  {!plan.is_active && (
                    <Badge variant="outline" className="bg-red-500/10 text-red-600">
                      Archived
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-2xl font-bold">
                    ${(plan.price_monthly_cents / 100).toFixed(2)}
                  </p>
                  <p className="text-xs text-muted-foreground">/month</p>
                </div>

                <div className="space-y-1 text-sm">
                  <p>
                    Assets:{" "}
                    <span className="font-mono">
                      {plan.monthly_assets_limit ?? "∞"}
                    </span>
                  </p>
                  <p>
                    Pages:{" "}
                    <span className="font-mono">
                      {plan.monthly_pages_limit ?? "∞"}
                    </span>
                  </p>
                  <p>
                    Posts:{" "}
                    <span className="font-mono">
                      {plan.monthly_posts_limit ?? "∞"}
                    </span>
                  </p>
                  <p>
                    Members:{" "}
                    <span className="font-mono">
                      {plan.max_team_members ?? "∞"}
                    </span>
                  </p>
                </div>

                <div className="flex gap-2 pt-4">
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1"
                    onClick={() => startEdit(plan)}
                  >
                    Edit
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-red-600 hover:bg-red-500/10"
                    onClick={() => handleDeletePlan(plan.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Info */}
      <Card className="bg-blue-500/5 border-blue-500/20">
        <CardContent className="pt-6">
          <p className="text-sm text-muted-foreground">
            💡 <strong>Tip:</strong> Limits set to NULL become unlimited. Changes
            apply immediately to new subscriptions. Existing customers keep their
            current plan limits.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
