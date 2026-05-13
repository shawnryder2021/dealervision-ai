"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Clock, TrendingDown, Sparkles, AlertTriangle, Car } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useAppStore } from "@/lib/store";
import { createClient } from "@/lib/supabase/client";
import type { Vehicle } from "@/lib/types";

type Bucket = { label: string; minDays: number; maxDays: number | null; color: string };

const BUCKETS: Bucket[] = [
  { label: "Fresh (0–29 days)", minDays: 0, maxDays: 29, color: "bg-green-500/10 text-green-500" },
  { label: "Watch (30–59 days)", minDays: 30, maxDays: 59, color: "bg-amber-500/10 text-amber-500" },
  { label: "Aging (60–89 days)", minDays: 60, maxDays: 89, color: "bg-orange-500/10 text-orange-500" },
  { label: "Stale (90+ days)", minDays: 90, maxDays: null, color: "bg-red-500/10 text-red-500" },
];

function daysBetween(iso: string): number {
  const ms = Date.now() - new Date(iso).getTime();
  return Math.max(0, Math.floor(ms / 86400000));
}

function bucketForDays(days: number): Bucket {
  return BUCKETS.find((b) => days >= b.minDays && (b.maxDays === null || days <= b.maxDays)) || BUCKETS[0];
}

export default function InventoryAgingPage() {
  const { dealership } = useAppStore();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeBucket, setActiveBucket] = useState<string>("all");

  useEffect(() => {
    if (!dealership) return;
    const load = async () => {
      setLoading(true);
      const supabase = createClient();
      const { data, error } = await supabase
        .from("vehicles")
        .select("*")
        .eq("dealership_id", dealership.id)
        .eq("status", "available")
        .order("created_at", { ascending: true });
      if (!error && data) setVehicles(data as Vehicle[]);
      setLoading(false);
    };
    load();
  }, [dealership]);

  const enriched = useMemo(
    () =>
      vehicles
        .map((v) => ({ ...v, daysInStock: daysBetween(v.created_at), bucket: bucketForDays(daysBetween(v.created_at)) }))
        .sort((a, b) => b.daysInStock - a.daysInStock),
    [vehicles]
  );

  const bucketCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const b of BUCKETS) counts[b.label] = 0;
    for (const v of enriched) counts[v.bucket.label] = (counts[v.bucket.label] || 0) + 1;
    return counts;
  }, [enriched]);

  const filtered = useMemo(
    () => (activeBucket === "all" ? enriched : enriched.filter((v) => v.bucket.label === activeBucket)),
    [enriched, activeBucket]
  );

  const totalAging = bucketCounts[BUCKETS[2].label] + bucketCounts[BUCKETS[3].label];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold flex items-center gap-2">
          <Clock className="h-6 w-6 text-primary" />
          Inventory Aging
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Vehicles in stock the longest — generate price-drop campaigns to move them.
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {BUCKETS.map((b) => (
          <Card key={b.label}>
            <CardContent className="pt-6">
              <p className="text-xs text-muted-foreground">{b.label}</p>
              <p className="text-2xl font-bold mt-1">{bucketCounts[b.label] || 0}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {totalAging > 0 && (
        <Card className="border-amber-500/40 bg-amber-500/5">
          <CardContent className="pt-6 flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-amber-500 mt-0.5 shrink-0" />
            <div className="flex-1">
              <p className="font-semibold">
                {totalAging} vehicle{totalAging === 1 ? "" : "s"} aging on your lot
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                Vehicles sitting more than 60 days lose ~1% of their value per week. Run a price-drop campaign to refresh interest.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs value={activeBucket} onValueChange={setActiveBucket}>
        <TabsList>
          <TabsTrigger value="all">All ({enriched.length})</TabsTrigger>
          {BUCKETS.map((b) => (
            <TabsTrigger key={b.label} value={b.label}>
              {b.label.split(" ")[0]} ({bucketCounts[b.label] || 0})
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value={activeBucket} className="mt-4">
          {loading ? (
            <p className="text-sm text-muted-foreground">Loading…</p>
          ) : filtered.length === 0 ? (
            <Card>
              <CardContent className="pt-6 text-center text-sm text-muted-foreground">
                <Car className="h-10 w-10 mx-auto mb-2 opacity-50" />
                No vehicles in this bucket.
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2">
              {filtered.map((v) => (
                <Card key={v.id} className="hover:border-primary/40 transition-colors">
                  <CardContent className="pt-6 flex items-center gap-4">
                    {v.photos?.[0] ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={v.photos[0]} alt="" className="w-20 h-16 object-cover rounded" />
                    ) : (
                      <div className="w-20 h-16 bg-muted rounded flex items-center justify-center">
                        <Car className="h-6 w-6 text-muted-foreground" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">
                        {v.year} {v.make} {v.model} {v.trim}
                      </p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                        {v.stock_number && <span>#{v.stock_number}</span>}
                        {v.price && <span>${v.price.toLocaleString()}</span>}
                        {v.mileage && <span>{v.mileage.toLocaleString()} mi</span>}
                      </div>
                    </div>
                    <Badge className={v.bucket.color}>{v.daysInStock}d</Badge>
                    <Link
                      className={buttonVariants({ size: "sm", variant: "outline" })}
                      href={`/dashboard/create/price-drop?vehicleId=${v.id}${
                        v.price ? `&currentPrice=${v.price}` : ""
                      }&campaign=${encodeURIComponent("Inventory Aging")}`}
                    >
                      <TrendingDown className="h-4 w-4 mr-1" />
                      Price Drop
                    </Link>
                    <Link
                      className={buttonVariants({ size: "sm", variant: "ghost" })}
                      href={`/dashboard/create/vehicle-spotlight?vehicleId=${v.id}&campaign=${encodeURIComponent(
                        "Inventory Aging"
                      )}`}
                    >
                      <Sparkles className="h-4 w-4 mr-1" />
                      Spotlight
                    </Link>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
