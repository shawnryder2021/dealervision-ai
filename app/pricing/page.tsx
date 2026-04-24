"use client";

import Link from "next/link";
import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Check, Zap, Building2, Rocket } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PLANS, type PlanConfig } from "@/lib/stripe/plans";
import { useAppStore } from "@/lib/store";
import { toast } from "sonner";

const PLAN_ICONS = [Zap, Rocket, Building2];

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
    if (!dealership) {
      // Not logged in — redirect to signup
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

      <div className="max-w-6xl mx-auto px-4 py-16 space-y-12">
        {/* Hero */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-heading font-bold tracking-tight">
            Simple, transparent pricing
          </h1>
          <p className="text-muted-foreground text-lg max-w-xl mx-auto">
            One subscription per dealership — shared across your entire team.
            Cancel anytime, no lock-in.
          </p>
          {canceled && (
            <div className="inline-flex items-center gap-2 bg-accent/10 text-accent px-4 py-2 rounded-lg text-sm">
              Checkout was canceled. No charge was made.
            </div>
          )}
        </div>

        {/* Plan cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {PLANS.map((plan, idx) => {
            const Icon = PLAN_ICONS[idx];
            const isLoading = loadingPlan === plan.slug;

            return (
              <Card
                key={plan.slug}
                className={`relative flex flex-col ${
                  plan.highlighted
                    ? "border-primary shadow-lg shadow-primary/10 ring-1 ring-primary"
                    : ""
                }`}
              >
                {plan.highlighted && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge className="bg-primary text-primary-foreground px-3">
                      Most popular
                    </Badge>
                  </div>
                )}

                <CardHeader className="pb-4">
                  <div className="flex items-center gap-3 mb-4">
                    <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${
                      plan.highlighted ? "bg-primary text-primary-foreground" : "bg-muted"
                    }`}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="font-heading font-bold text-lg">{plan.name}</h3>
                    </div>
                  </div>

                  <div className="mb-2">
                    <span className="text-4xl font-bold">${plan.priceMonthly}</span>
                    <span className="text-muted-foreground">/month</span>
                  </div>
                  <p className="text-sm text-muted-foreground">{plan.description}</p>
                </CardHeader>

                <CardContent className="flex flex-col flex-1 gap-6">
                  <ul className="space-y-2.5 flex-1">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-start gap-2 text-sm">
                        <Check className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <Button
                    type="button"
                    className="w-full"
                    variant={plan.highlighted ? "default" : "outline"}
                    disabled={isLoading}
                    onClick={() => handleSelectPlan(plan)}
                  >
                    {isLoading ? "Redirecting…" : `Get ${plan.name}`}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Trust strip */}
        <div className="text-center space-y-2 pb-12">
          <p className="text-sm text-muted-foreground">
            All plans include: SSL-secured payments via Stripe · Cancel anytime ·
            Shared across your team · 24-hour support
          </p>
        </div>

        {/* Footer */}
        <div className="border-t border-border/30 pt-8 mt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-muted-foreground">
          <p>
            &copy; {new Date().getFullYear()} DealerAdGen AI. All rights reserved.
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
