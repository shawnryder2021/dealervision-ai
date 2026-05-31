"use client";

import Link from "next/link";
import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Check, Sparkles, Rocket, ArrowRight, ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FREE_TRIAL, PRO_PLAN, type PlanConfig } from "@/lib/stripe/plans";
import { useAppStore } from "@/lib/store";
import { toast } from "sonner";

export default function PricingPage() {
  return (
    <Suspense>
      <PricingContent />
    </Suspense>
  );
}

function PricingContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const canceled = searchParams.get("canceled") === "true";
  const { dealership } = useAppStore();
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);

  async function handleSelectPlan(plan: PlanConfig) {
    if (plan.isFree) {
      // Free trial — just go to signup (credits are granted at onboard)
      router.push("/signup");
      return;
    }

    if (!dealership) {
      // Not logged in — redirect to signup first, then they can upgrade
      router.push("/signup");
      return;
    }

    setLoadingPlan(plan.slug);
    try {
      const res = await fetch("/api/stripe/checkout-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          priceId: plan.priceId,
          dealershipId: dealership.id,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: res.statusText }));
        throw new Error(err.error || "Failed to start checkout");
      }

      const { url } = await res.json();
      window.location.href = url;
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't start checkout");
      setLoadingPlan(null);
    }
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b">
        <div className="max-w-6xl mx-auto px-4 py-4 flex justify-between items-center">
          <span className="text-xl font-heading font-bold">DealerVision AI</span>
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" onClick={() => router.push("/login")}>
              Sign in
            </Button>
            <Button size="sm" onClick={() => router.push("/signup")}>
              Get started free
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-16 space-y-12">
        {/* Hero */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-heading font-bold tracking-tight">
            Start free. Go unlimited when you&apos;re ready.
          </h1>
          <p className="text-muted-foreground text-lg max-w-xl mx-auto">
            Try DealerVision AI with 25 free image credits — no card required.
            Upgrade to Pro for unlimited AI-powered marketing.
          </p>
          {canceled && (
            <div className="inline-flex items-center gap-2 bg-amber-500/10 text-amber-700 dark:text-amber-400 px-4 py-2 rounded-lg text-sm">
              Checkout was canceled. No charge was made.
            </div>
          )}
        </div>

        {/* Plan cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-3xl mx-auto">
          {/* Free Trial */}
          <Card className="relative flex flex-col">
            <CardHeader className="pb-4">
              <div className="flex items-center gap-3 mb-4">
                <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center">
                  <Sparkles className="h-5 w-5" />
                </div>
                <h3 className="font-heading font-bold text-lg">{FREE_TRIAL.name}</h3>
              </div>

              <div className="mb-2">
                <span className="text-4xl font-bold">Free</span>
              </div>
              <p className="text-sm text-muted-foreground">{FREE_TRIAL.description}</p>
            </CardHeader>

            <CardContent className="flex flex-col flex-1 gap-6">
              <div className="flex items-center gap-2 bg-primary/5 rounded-lg px-3 py-2">
                <ImageIcon className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium">25 image credits included</span>
              </div>

              <ul className="space-y-2.5 flex-1">
                {FREE_TRIAL.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2 text-sm">
                    <Check className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>

              <Button
                type="button"
                className="w-full"
                variant="outline"
                onClick={() => handleSelectPlan(FREE_TRIAL)}
              >
                Start free trial
                <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            </CardContent>
          </Card>

          {/* Pro */}
          <Card className="relative flex flex-col border-primary shadow-lg shadow-primary/10 ring-1 ring-primary">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2">
              <Badge className="bg-primary text-primary-foreground px-3">
                Recommended
              </Badge>
            </div>

            <CardHeader className="pb-4">
              <div className="flex items-center gap-3 mb-4">
                <div className="h-10 w-10 rounded-lg bg-primary text-primary-foreground flex items-center justify-center">
                  <Rocket className="h-5 w-5" />
                </div>
                <h3 className="font-heading font-bold text-lg">{PRO_PLAN.name}</h3>
              </div>

              <div className="mb-2">
                <span className="text-4xl font-bold">${PRO_PLAN.priceMonthly}</span>
                <span className="text-muted-foreground">/month</span>
              </div>
              <p className="text-sm text-muted-foreground">{PRO_PLAN.description}</p>
            </CardHeader>

            <CardContent className="flex flex-col flex-1 gap-6">
              <div className="flex items-center gap-2 bg-primary/10 rounded-lg px-3 py-2">
                <ImageIcon className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium text-primary">Unlimited image generations</span>
              </div>

              <ul className="space-y-2.5 flex-1">
                {PRO_PLAN.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2 text-sm">
                    <Check className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>

              <Button
                type="button"
                className="w-full"
                disabled={loadingPlan === "pro"}
                onClick={() => handleSelectPlan(PRO_PLAN)}
              >
                {loadingPlan === "pro" ? "Redirecting to checkout…" : "Get Pro"}
                {loadingPlan !== "pro" && <ArrowRight className="h-4 w-4 ml-1" />}
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Value props */}
        <div className="text-center space-y-6 pt-4">
          <h2 className="text-xl font-heading font-semibold">Everything you need to market your inventory</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-sm">
            <div className="space-y-1.5">
              <p className="font-medium">13 Channels</p>
              <p className="text-muted-foreground">Instagram, Facebook, X, email, print, billboard, YouTube, and more</p>
            </div>
            <div className="space-y-1.5">
              <p className="font-medium">11 Content Types</p>
              <p className="text-muted-foreground">Vehicle spotlights, new arrivals, sales events, service promos, and more</p>
            </div>
            <div className="space-y-1.5">
              <p className="font-medium">Full Design Studio</p>
              <p className="text-muted-foreground">Badges, text overlays, templates, merge tags — built for dealers</p>
            </div>
          </div>
        </div>

        {/* Trust strip */}
        <div className="text-center space-y-2 pb-12">
          <p className="text-sm text-muted-foreground">
            SSL-secured payments via Stripe · Cancel anytime · No setup fees · No per-image charges on Pro
          </p>
        </div>

        {/* Footer */}
        <div className="border-t border-border/30 pt-8 mt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-muted-foreground">
          <p>
            &copy; {new Date().getFullYear()} DealerVision AI. All rights reserved.
          </p>
          <p>
            Developed by{" "}
            <Link
              href="https://shawnryder.com"
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-foreground hover:text-primary transition-colors"
            >
              Shawn Ryder Digital
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
