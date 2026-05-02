"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  BarChart3,
  Building2,
  CreditCard,
  Users,
  Zap,
  TrendingUp,
  AlertCircle,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import type { ComponentType } from "react";

interface AdminStats {
  total_dealerships: number;
  active_subscriptions: number;
  trialing_subscriptions: number;
  canceled_subscriptions: number;
  total_monthly_revenue_cents: number;
  total_assets_generated: number;
  total_pages_created: number;
  total_posts_published: number;
  webhook_health: {
    success_rate: number;
    last_webhook_at: string | null;
  };
}

const StatCard = ({
  icon: Icon,
  label,
  value,
  subtext,
  loading,
}: {
  icon: ComponentType<{ className?: string }>;
  label: string;
  value: string | number;
  subtext?: string;
  loading?: boolean;
}) => (
  <Card>
    <CardContent className="pt-6">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-muted-foreground mb-1">{label}</p>
          {loading ? (
            <Skeleton className="h-8 w-24 mb-1" />
          ) : (
            <p className="text-3xl font-bold">{value}</p>
          )}
          {subtext && <p className="text-xs text-muted-foreground mt-1">{subtext}</p>}
        </div>
        <Icon className="h-8 w-8 text-muted-foreground/50" />
      </div>
    </CardContent>
  </Card>
);

export default function AdminDashboard() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await fetch("/api/admin/stats");
        if (res.ok) {
          const data = await res.json();
          setStats(data.stats);
        }
      } catch (error) {
        console.error("Failed to fetch stats:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  const monthlyRevenue = (stats?.total_monthly_revenue_cents || 0) / 100;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-heading font-bold tracking-tight flex items-center gap-2">
          <BarChart3 className="h-8 w-8 text-primary" />
          Platform Overview
        </h1>
        <p className="text-muted-foreground mt-2">
          System-wide metrics and operational health
        </p>
      </div>

      {/* Primary Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={Building2}
          label="Total Dealerships"
          value={stats?.total_dealerships || 0}
          subtext="Registered accounts"
          loading={loading}
        />
        <StatCard
          icon={CreditCard}
          label="Active Subscriptions"
          value={stats?.active_subscriptions || 0}
          subtext={`${stats?.trialing_subscriptions || 0} trialing`}
          loading={loading}
        />
        <StatCard
          icon={TrendingUp}
          label="Monthly Revenue"
          value={`$${monthlyRevenue.toLocaleString("en-US", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}`}
          subtext="Active plans only"
          loading={loading}
        />
        <StatCard
          icon={Users}
          label="Canceled Subs"
          value={stats?.canceled_subscriptions || 0}
          subtext="Churned accounts"
          loading={loading}
        />
      </div>

      {/* Usage Metrics */}
      <div>
        <h2 className="text-xl font-heading font-bold mb-4">Usage this month</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">
                    Assets Generated
                  </p>
                  {loading ? (
                    <Skeleton className="h-8 w-24" />
                  ) : (
                    <p className="text-2xl font-bold">
                      {(stats?.total_assets_generated || 0).toLocaleString()}
                    </p>
                  )}
                </div>
                <Zap className="h-8 w-8 text-amber-500/50" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">
                    Landing Pages
                  </p>
                  {loading ? (
                    <Skeleton className="h-8 w-24" />
                  ) : (
                    <p className="text-2xl font-bold">
                      {(stats?.total_pages_created || 0).toLocaleString()}
                    </p>
                  )}
                </div>
                <BarChart3 className="h-8 w-8 text-blue-500/50" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">
                    Social Posts
                  </p>
                  {loading ? (
                    <Skeleton className="h-8 w-24" />
                  ) : (
                    <p className="text-2xl font-bold">
                      {(stats?.total_posts_published || 0).toLocaleString()}
                    </p>
                  )}
                </div>
                <Zap className="h-8 w-8 text-green-500/50" />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* System Health */}
      <div>
        <h2 className="text-xl font-heading font-bold mb-4">System health</h2>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">
                  Webhook Status
                </p>
                <div className="flex items-center gap-2">
                  <Badge
                    variant={
                      stats?.webhook_health.success_rate === 100
                        ? "default"
                        : "secondary"
                    }
                    className={
                      stats?.webhook_health.success_rate === 100
                        ? "bg-green-500/10 text-green-600"
                        : "bg-amber-500/10 text-amber-600"
                    }
                  >
                    {stats?.webhook_health.success_rate || 0}% success rate
                  </Badge>
                  {stats?.webhook_health.last_webhook_at && (
                    <span className="text-xs text-muted-foreground">
                      Last tested{" "}
                      {new Date(
                        stats.webhook_health.last_webhook_at
                      ).toLocaleDateString()}
                    </span>
                  )}
                </div>
              </div>
              {stats?.webhook_health.success_rate === 100 ? (
                <div className="h-3 w-3 rounded-full bg-green-500" />
              ) : (
                <AlertCircle className="h-6 w-6 text-amber-500" />
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="bg-muted/50 border border-dashed rounded-lg p-6">
        <h3 className="font-semibold mb-4">Quick setup checklist</h3>
        <ul className="space-y-2 text-sm">
          <li className="flex items-center gap-2">
            <input type="checkbox" className="w-4 h-4" defaultChecked />
            <span>Stripe API keys configured</span>
          </li>
          <li className="flex items-center gap-2">
            <input type="checkbox" className="w-4 h-4" />
            <span>Webhook endpoint registered</span>
          </li>
          <li className="flex items-center gap-2">
            <input type="checkbox" className="w-4 h-4" />
            <span>Pricing tiers configured</span>
          </li>
          <li className="flex items-center gap-2">
            <input type="checkbox" className="w-4 h-4" />
            <span>Database migration completed</span>
          </li>
        </ul>
      </div>
    </div>
  );
}
