"use client";

import { useEffect, useState } from "react";
import { BarChart3, Image, DollarSign, TrendingUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useAppStore } from "@/lib/store";
import { createClient } from "@/lib/supabase/client";

interface UsageStats {
  totalGenerations: number;
  thisMonth: number;
  totalCredits: number;
  monthlyCredits: number;
  byContentType: { type: string; count: number }[];
  byChannel: { channel: string; count: number }[];
}

export default function UsagePage() {
  const { dealership } = useAppStore();
  const supabase = createClient();
  const [stats, setStats] = useState<UsageStats>({
    totalGenerations: 0,
    thisMonth: 0,
    totalCredits: 0,
    monthlyCredits: 0,
    byContentType: [],
    byChannel: [],
  });

  useEffect(() => {
    async function loadStats() {
      if (!dealership) return;

      const { count: total } = await supabase
        .from("generated_assets")
        .select("*", { count: "exact", head: true })
        .eq("dealership_id", dealership.id);

      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);

      const { count: monthly } = await supabase
        .from("generated_assets")
        .select("*", { count: "exact", head: true })
        .eq("dealership_id", dealership.id)
        .gte("created_at", startOfMonth.toISOString());

      // Fetch usage logs for credit totals
      const { data: usageLogs } = await supabase
        .from("usage_logs")
        .select("credits_used, created_at")
        .eq("dealership_id", dealership.id) as { data: { credits_used: number; created_at: string }[] | null };

      const totalCredits =
        usageLogs?.reduce((sum, log) => sum + (log.credits_used || 0), 0) || 0;
      const monthlyCredits =
        usageLogs
          ?.filter((log) => new Date(log.created_at) >= startOfMonth)
          .reduce((sum, log) => sum + (log.credits_used || 0), 0) || 0;

      // Fetch content type distribution
      const { data: assets } = await supabase
        .from("generated_assets")
        .select("content_type, channel")
        .eq("dealership_id", dealership.id) as { data: { content_type: string; channel: string }[] | null };

      const typeMap = new Map<string, number>();
      const channelMap = new Map<string, number>();
      assets?.forEach((a) => {
        typeMap.set(a.content_type, (typeMap.get(a.content_type) || 0) + 1);
        channelMap.set(a.channel, (channelMap.get(a.channel) || 0) + 1);
      });

      setStats({
        totalGenerations: total || 0,
        thisMonth: monthly || 0,
        totalCredits,
        monthlyCredits,
        byContentType: Array.from(typeMap.entries())
          .map(([type, count]) => ({ type, count }))
          .sort((a, b) => b.count - a.count),
        byChannel: Array.from(channelMap.entries())
          .map(([channel, count]) => ({ channel, count }))
          .sort((a, b) => b.count - a.count),
      });
    }

    loadStats();
  }, [dealership, supabase]);

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="font-heading text-2xl font-bold flex items-center gap-2">
          <BarChart3 className="h-6 w-6 text-primary" />
          Usage & Analytics
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Track your generation history and API usage
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="glass">
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
                <Image className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="text-xl font-heading font-bold">
                  {stats.totalGenerations}
                </p>
                <p className="text-xs text-muted-foreground">
                  Total Generations
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass">
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent/10">
                <TrendingUp className="h-4 w-4 text-accent" />
              </div>
              <div>
                <p className="text-xl font-heading font-bold">
                  {stats.thisMonth}
                </p>
                <p className="text-xs text-muted-foreground">This Month</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass">
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-green-500/10">
                <DollarSign className="h-4 w-4 text-green-500" />
              </div>
              <div>
                <p className="text-xl font-heading font-bold">
                  ${stats.totalCredits.toFixed(2)}
                </p>
                <p className="text-xs text-muted-foreground">Total Spent</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass">
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-purple-500/10">
                <DollarSign className="h-4 w-4 text-purple-500" />
              </div>
              <div>
                <p className="text-xl font-heading font-bold">
                  ${stats.monthlyCredits.toFixed(2)}
                </p>
                <p className="text-xs text-muted-foreground">This Month</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="glass">
          <CardHeader>
            <CardTitle className="text-base">By Content Type</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {stats.byContentType.length === 0 && (
              <p className="text-sm text-muted-foreground">No data yet</p>
            )}
            {stats.byContentType.map(({ type, count }) => (
              <div key={type} className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <span className="capitalize">{type.replace(/-/g, " ")}</span>
                  <span className="text-muted-foreground">{count}</span>
                </div>
                <Progress
                  value={
                    stats.totalGenerations
                      ? (count / stats.totalGenerations) * 100
                      : 0
                  }
                  className="h-1.5"
                />
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="glass">
          <CardHeader>
            <CardTitle className="text-base">By Channel</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {stats.byChannel.length === 0 && (
              <p className="text-sm text-muted-foreground">No data yet</p>
            )}
            {stats.byChannel.map(({ channel, count }) => (
              <div key={channel} className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <span className="capitalize">
                    {channel.replace(/-/g, " ")}
                  </span>
                  <span className="text-muted-foreground">{count}</span>
                </div>
                <Progress
                  value={
                    stats.totalGenerations
                      ? (count / stats.totalGenerations) * 100
                      : 0
                  }
                  className="h-1.5"
                />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
