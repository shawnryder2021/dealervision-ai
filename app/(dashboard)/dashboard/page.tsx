"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Image, Car, TrendingUp, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { QuickActions } from "@/components/dashboard/QuickActions";
import { SeasonalSuggestions } from "@/components/dashboard/SeasonalSuggestions";
import { RecentGenerations } from "@/components/dashboard/RecentGenerations";
import { useAppStore } from "@/lib/store";
import { createClient } from "@/lib/supabase/client";
import { isDemoMode } from "@/lib/demo-data";

export default function DashboardPage() {
  const { dealership, vehicles, recentAssets, setRecentAssets } = useAppStore();
  const [stats, setStats] = useState({
    totalGenerations: 0,
    totalVehicles: 0,
    thisMonth: 0,
  });

  useEffect(() => {
    async function loadData() {
      if (!dealership) return;

      if (isDemoMode()) {
        setStats({
          totalGenerations: recentAssets.length,
          totalVehicles: vehicles.length,
          thisMonth: recentAssets.length,
        });
        return;
      }

      const supabase = createClient();

      const { data: assets } = await supabase
        .from("generated_assets")
        .select("*")
        .eq("dealership_id", dealership.id)
        .order("created_at", { ascending: false })
        .limit(10);

      if (assets) setRecentAssets(assets);

      const { count: totalGenerations } = await supabase
        .from("generated_assets")
        .select("*", { count: "exact", head: true })
        .eq("dealership_id", dealership.id);

      const { count: totalVehicles } = await supabase
        .from("vehicles")
        .select("*", { count: "exact", head: true })
        .eq("dealership_id", dealership.id);

      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);

      const { count: thisMonth } = await supabase
        .from("generated_assets")
        .select("*", { count: "exact", head: true })
        .eq("dealership_id", dealership.id)
        .gte("created_at", startOfMonth.toISOString());

      setStats({
        totalGenerations: totalGenerations || 0,
        totalVehicles: totalVehicles || 0,
        thisMonth: thisMonth || 0,
      });
    }

    loadData();
  }, [dealership, vehicles, recentAssets, setRecentAssets]);

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold">
            {dealership ? `Welcome, ${dealership.name}` : "Dashboard"}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Create AI-powered marketing visuals for your dealership
          </p>
        </div>
        <Link href="/dashboard/create">
          <Button className="gradient-primary text-white">
            <Plus className="h-4 w-4 mr-2" />
            Create Visual
          </Button>
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="glass">
          <CardContent className="flex items-center gap-4 p-5">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <Image className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-heading font-bold">
                {stats.totalGenerations}
              </p>
              <p className="text-xs text-muted-foreground">Total Generations</p>
            </div>
          </CardContent>
        </Card>

        <Card className="glass">
          <CardContent className="flex items-center gap-4 p-5">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent/10">
              <TrendingUp className="h-5 w-5 text-accent" />
            </div>
            <div>
              <p className="text-2xl font-heading font-bold">
                {stats.thisMonth}
              </p>
              <p className="text-xs text-muted-foreground">This Month</p>
            </div>
          </CardContent>
        </Card>

        <Card className="glass">
          <CardContent className="flex items-center gap-4 p-5">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-500/10">
              <Car className="h-5 w-5 text-green-500" />
            </div>
            <div>
              <p className="text-2xl font-heading font-bold">
                {stats.totalVehicles}
              </p>
              <p className="text-xs text-muted-foreground">Vehicles</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Seasonal Suggestions */}
      <SeasonalSuggestions />

      {/* Quick Actions */}
      <div>
        <h2 className="font-heading text-lg font-semibold mb-3">
          Quick Create
        </h2>
        <QuickActions />
      </div>

      {/* Recent Generations */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-heading text-lg font-semibold">
            Recent Generations
          </h2>
          <Link
            href="/dashboard/library"
            className="text-sm text-primary hover:underline"
          >
            View All
          </Link>
        </div>
        <RecentGenerations assets={recentAssets} />
      </div>
    </div>
  );
}
