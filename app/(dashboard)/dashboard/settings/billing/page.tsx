"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  CreditCard, CheckCircle, AlertTriangle, XCircle,
  ExternalLink, Rocket, ArrowUpRight, Coins, ImageIcon,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAppStore } from "@/lib/store";
import { PLANS, PRO_PLAN } from "@/lib/stripe/plans";
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
  const [creditBalance, setCreditBalance] = useState<{ balance: number; total_granted: number; total_used: number } | null>(null);
  const [portalLoading, setPortalLoading] = useState(false);
  const [upgradeLoading, setUpgradeLoading] = useState(false);

  // Show success toast if redirected back from Stripe Checkout
  useEffect(() => {
    if (searchParams.get("success") === "true") {
      toast.success("Pro subscription activated! Unlimited generations unlocked.");
      router.replace("/dashboard/settings/billing");
    }
  }, [searchParams, router]);

  useEffect(() => {
    if (!dealership) return;

    async function load() {
      try {
        const [subRes, credRes] = await Promise.all([
          fetch(`/api/stripe/subscription?dealershipId=${dealership!.id}`),
          fetch("/api/credits"),
        ]);
        if (subRes.ok) {
          const data = await subRes.json();
          setSubscription(data.subscription);
          setUsage(data.usage);
        }
        if (credRes.ok) {
          const credData = await credRes.json();
          if (credData.balance) {
            setCreditBalance(credData.balance);
          }
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
  const isPro = isActive && activePlan?.slug === "pro";

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

  async function handleUpgrade() {
    if (!dealership) return;
    setUpgradeLoading(true);
    try {
      const res = await fetch("/api/stripe/checkout-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ priceId: PRO_PLAN.priceId, dealershipId: dealership.id }),
      });
      if (!res.ok) throw new Error("Couldn't start checkout");
      const { url } = await res.json();
      window.location.href = url;
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't start checkout");
      setUpgradeLoading(false);
    }
  }

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-heading font-bold tracking-tight flex items-center gap-2">
          <CreditCard className="h-6 w-6 text-primary" />
          Billing & Plan
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          Manage your subscription and image generation credits.
        </p>
      </div>

      {/* Credits balance */}
      {creditBalance && (creditBalance.balance > 0 || creditBalance.total_granted > 0) && (
        <Card className="border-primary/30 bg-primary/5">
          <CardContent className="pt-5 pb-5">
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Coins className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="font-semibold text-primary text-lg">
                    {creditBalance.balance.toLocaleString()} credit{creditBalance.balance !== 1 ? "s" : ""} remaining
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {creditBalance.total_used.toLocaleString()} of {creditBalance.total_granted.toLocaleString()} used · 1 credit = 1 image
                  </p>
                </div>
              </div>
              {creditBalance.total_granted > 0 && (
                <div className="w-40">
                  <div className="flex justify-between text-xs text-muted-foreground mb-1">
                    <span>Used</span>
                    <span>{Math.round((creditBalance.total_used / creditBalance.total_granted) * 100)}%</span>
                  </div>
                  <div className="h-2 rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full rounded-full bg-primary transition-all"
                      style={{ width: `${Math.min(100, Math.round((creditBalance.total_used / creditBalance.total_granted) * 100))}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Current plan */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Current Plan</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {loading ? (
            <div className="h-16 animate-pulse bg-muted rounded-lg" />
          ) : isPro ? (
            /* ── Active Pro subscriber ── */
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Rocket className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-medium">Pro Plan</p>
                    <StatusBadge status={subscription!.status} />
                  </div>
                  <p className="text-sm text-muted-foreground">
                    ${PRO_PLAN.priceMonthly}/month · Unlimited image generations ·{" "}
                    {subscription!.cancel_at_period_end
                      ? `Cancels ${subscription!.current_period_end ? new Date(subscription!.current_period_end).toLocaleDateString() : "soon"}`
                      : subscription!.current_period_end
                        ? `Renews ${new Date(subscription!.current_period_end).toLocaleDateString()}`
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
          ) : (
            /* ── Free trial / no subscription ── */
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center">
                  <ImageIcon className="h-5 w-5 text-muted-foreground" />
                </div>
                <div>
                  <p className="font-medium">Free Trial</p>
                  <p className="text-sm text-muted-foreground">
                    {creditBalance && creditBalance.balance > 0
                      ? `${creditBalance.balance} image credit${creditBalance.balance !== 1 ? "s" : ""} remaining`
                      : "No credits remaining — upgrade to Pro for unlimited"}
                  </p>
                </div>
              </div>
              <Button type="button" onClick={handleUpgrade} disabled={upgradeLoading}>
                {upgradeLoading ? "Redirecting…" : "Upgrade to Pro"}
                {!upgradeLoading && <ArrowUpRight className="h-3.5 w-3.5 ml-1" />}
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
              <span>Your subscription was canceled. Upgrade to Pro to continue generating unlimited images.</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Usage this month — only show for Pro subscribers */}
      {isPro && usage && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Usage this month</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-green-500/10 flex items-center justify-center">
                <CheckCircle className="h-5 w-5 text-green-500" />
              </div>
              <div>
                <p className="font-medium text-lg">{usage.assets_generated.toLocaleString()} images generated</p>
                <p className="text-sm text-muted-foreground">Unlimited plan — no caps</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Upgrade CTA for free users */}
      {!isPro && !loading && (
        <Card className="border-primary/30">
          <CardContent className="pt-6 pb-6">
            <div className="flex flex-col sm:flex-row sm:items-center gap-4">
              <div className="flex-1 space-y-1">
                <h3 className="font-heading font-semibold flex items-center gap-2">
                  <Rocket className="h-4 w-4 text-primary" />
                  Unlock unlimited image generation
                </h3>
                <p className="text-sm text-muted-foreground">
                  Pro gives you unlimited AI image generations across all 13 channels and 11 content types
                  — plus batch generation, Design Studio, multi-angle galleries, and priority support.
                </p>
                <p className="text-sm font-medium">
                  ${PRO_PLAN.priceMonthly}/month · Cancel anytime
                </p>
              </div>
              <Button
                type="button"
                onClick={handleUpgrade}
                disabled={upgradeLoading}
                className="shrink-0"
              >
                {upgradeLoading ? "Redirecting…" : "Upgrade to Pro"}
                {!upgradeLoading && <ArrowUpRight className="h-3.5 w-3.5 ml-1" />}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
