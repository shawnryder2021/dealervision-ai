"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  CreditCard, CheckCircle, AlertTriangle, XCircle,
  ExternalLink, Zap, Rocket, Building2, ArrowUpRight,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAppStore } from "@/lib/store";
import { PLANS } from "@/lib/stripe/plans";
import { toast } from "sonner";

interface SubscriptionData {
  status: string;
  stripe_price_id: string | null;
  current_period_end: string | null;
  cancel_at_period_end: boolean;
}

interface UsageData {
  assets_generated: number;
  landing_pages_created: number;
  social_posts_published: number;
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; className: string }> = {
    active: { label: "Active", className: "bg-green-500/10 text-green-600 dark:text-green-400" },
    trialing: { label: "Trial", className: "bg-blue-500/10 text-blue-600 dark:text-blue-400" },
    past_due: { label: "Past due", className: "bg-amber-500/10 text-amber-600 dark:text-amber-400" },
    canceled: { label: "Canceled", className: "bg-red-500/10 text-red-600 dark:text-red-400" },
    unpaid: { label: "Unpaid", className: "bg-red-500/10 text-red-600 dark:text-red-400" },
    incomplete: { label: "Incomplete", className: "bg-muted text-muted-foreground" },
  };
  const s = map[status] ?? map.incomplete;
  return <Badge variant="secondary" className={s.className}>{s.label}</Badge>;
}

function UsageBar({ used, limit, label }: { used: number; limit: number | null; label: string }) {
  const pct = limit === null ? 0 : Math.min(100, Math.round((used / limit) * 100));
  const color = pct >= 90 ? "bg-red-500" : pct >= 70 ? "bg-amber-500" : "bg-primary";

  return (
    <div className="space-y-1.5">
      <div className="flex justify-between items-center text-sm">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-medium">
          {used.toLocaleString()}{limit !== null ? ` / ${limit.toLocaleString()}` : " / ∞"}
        </span>
      </div>
      <div className="h-2 rounded-full bg-muted overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${color}`}
          style={{ width: limit === null ? "4%" : `${pct}%` }}
        />
      </div>
    </div>
  );
}

export default function BillingPage() {
  return (
    <Suspense>
      <BillingContent />
    </Suspense>
  );
}

function BillingContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { dealership } = useAppStore();

  const [subscription, setSubscription] = useState<SubscriptionData | null>(null);
  const [usage, setUsage] = useState<UsageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [portalLoading, setPortalLoading] = useState(false);
  const [upgradingTo, setUpgradingTo] = useState<string | null>(null);

  // Show success toast if redirected back from Stripe Checkout
  useEffect(() => {
    if (searchParams.get("success") === "true") {
      toast.success("Subscription activated! Welcome aboard 🎉");
      router.replace("/dashboard/settings/billing");
    }
  }, [searchParams, router]);

  useEffect(() => {
    if (!dealership) return;

    async function load() {
      try {
        const res = await fetch(`/api/stripe/subscription?dealershipId=${dealership!.id}`);
        if (res.ok) {
          const data = await res.json();
          setSubscription(data.subscription);
          setUsage(data.usage);
        }
      } catch {
        // Subscription not found — new user
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [dealership]);

  const activePlan = subscription?.stripe_price_id
    ? PLANS.find((p) => p.priceId === subscription.stripe_price_id)
    : null;

  const isActive = subscription?.status === "active" || subscription?.status === "trialing";

  async function handleManage() {
    if (!dealership) return;
    setPortalLoading(true);
    try {
      const res = await fetch("/api/stripe/create-portal-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dealershipId: dealership.id }),
      });
      if (!res.ok) throw new Error("Failed to open billing portal");
      const { url } = await res.json();
      window.location.href = url;
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't open billing portal");
      setPortalLoading(false);
    }
  }

  async function handleUpgrade(plan: typeof PLANS[0]) {
    if (!dealership) return;
    setUpgradingTo(plan.slug);
    try {
      const res = await fetch("/api/stripe/checkout-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ priceId: plan.priceId, dealershipId: dealership.id }),
      });
      if (!res.ok) throw new Error("Couldn't start checkout");
      const { url } = await res.json();
      window.location.href = url;
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't start checkout");
      setUpgradingTo(null);
    }
  }

  const PLAN_ICONS = [Zap, Rocket, Building2];

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-heading font-bold tracking-tight flex items-center gap-2">
          <CreditCard className="h-6 w-6 text-primary" />
          Billing & Subscription
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          Manage your plan, usage, and payment details. Shared across your entire team.
        </p>
      </div>

      {/* Current plan */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Current Plan</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {loading ? (
            <div className="h-16 animate-pulse bg-muted rounded-lg" />
          ) : !subscription || !isActive ? (
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center">
                  <AlertTriangle className="h-5 w-5 text-amber-500" />
                </div>
                <div>
                  <p className="font-medium">No active subscription</p>
                  <p className="text-sm text-muted-foreground">
                    Choose a plan to unlock all features
                  </p>
                </div>
              </div>
              <Button type="button" onClick={() => router.push("/pricing")}>
                View plans <ArrowUpRight className="h-3.5 w-3.5 ml-1" />
              </Button>
            </div>
          ) : (
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <CheckCircle className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-medium">{activePlan?.name ?? "Unknown"} Plan</p>
                    <StatusBadge status={subscription.status} />
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {activePlan ? `$${activePlan.priceMonthly}/month · ` : ""}
                    {subscription.cancel_at_period_end
                      ? `Cancels ${subscription.current_period_end ? new Date(subscription.current_period_end).toLocaleDateString() : "soon"}`
                      : subscription.current_period_end
                        ? `Renews ${new Date(subscription.current_period_end).toLocaleDateString()}`
                        : ""}
                  </p>
                </div>
              </div>
              <Button
                type="button"
                variant="outline"
                onClick={handleManage}
                disabled={portalLoading}
                className="gap-1.5"
              >
                <ExternalLink className="h-3.5 w-3.5" />
                {portalLoading ? "Opening…" : "Manage subscription"}
              </Button>
            </div>
          )}

          {subscription?.status === "past_due" && (
            <div className="flex items-start gap-2 bg-amber-500/10 text-amber-700 dark:text-amber-400 px-3 py-2 rounded-lg text-sm">
              <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
              <span>
                Your last payment failed. Please update your payment method to avoid service interruption.
              </span>
            </div>
          )}

          {subscription?.status === "canceled" && (
            <div className="flex items-start gap-2 bg-red-500/10 text-red-700 dark:text-red-400 px-3 py-2 rounded-lg text-sm">
              <XCircle className="h-4 w-4 mt-0.5 shrink-0" />
              <span>Your subscription was canceled. Resubscribe to continue using the platform.</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Usage this month */}
      {isActive && usage && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Usage this month</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <UsageBar
              used={usage.assets_generated}
              limit={activePlan?.limits.assetsPerMonth ?? null}
              label="Assets generated"
            />
            <UsageBar
              used={usage.landing_pages_created}
              limit={activePlan?.limits.pagesPerMonth ?? null}
              label="Landing pages"
            />
            <UsageBar
              used={usage.social_posts_published}
              limit={activePlan?.limits.postsPerMonth ?? null}
              label="Social posts"
            />
          </CardContent>
        </Card>
      )}

      {/* Plan comparison / upgrade */}
      {isActive && activePlan && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Change plan</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {PLANS.map((plan, idx) => {
                const Icon = PLAN_ICONS[idx];
                const isCurrent = plan.slug === activePlan.slug;
                const isUpgrade = plan.priceMonthly > activePlan.priceMonthly;
                const isLoading = upgradingTo === plan.slug;

                return (
                  <div
                    key={plan.slug}
                    className={`rounded-lg border p-4 space-y-3 ${
                      isCurrent ? "border-primary bg-primary/5" : ""
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Icon className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium text-sm">{plan.name}</span>
                      {isCurrent && (
                        <Badge variant="secondary" className="text-[10px] ml-auto">Current</Badge>
                      )}
                    </div>
                    <div>
                      <span className="text-xl font-bold">${plan.priceMonthly}</span>
                      <span className="text-muted-foreground text-xs">/mo</span>
                    </div>
                    {!isCurrent && (
                      <Button
                        type="button"
                        size="sm"
                        variant={isUpgrade ? "default" : "outline"}
                        className="w-full"
                        disabled={isLoading}
                        onClick={() => handleManage()}
                        title="Use the billing portal to change plans"
                      >
                        {isLoading ? "Loading…" : isUpgrade ? "Upgrade" : "Downgrade"}
                      </Button>
                    )}
                  </div>
                );
              })}
            </div>
            <p className="text-xs text-muted-foreground mt-3">
              Plan changes take effect immediately. Prorated amounts are applied to your next invoice.
              Use &quot;Manage subscription&quot; to change plans via the Stripe portal.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
