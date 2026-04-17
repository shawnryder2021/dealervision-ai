"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Building2, TrendingUp, Wand2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useAppStore } from "@/lib/store";
import { toast } from "sonner";

interface DealershipData {
  id: string;
  name: string;
  owner_email: string;
  created_at: string;
  subscription_status: string | null;
  subscription_plan: string | null;
  current_period_end: string | null;
  stripe_customer_id: string | null;
  monthly_usage: {
    assets_generated: number;
    landing_pages_created: number;
    social_posts_published: number;
  };
  // Full dealership record returned by the admin API (bypasses RLS)
  dealership_record: Record<string, any>;
}

const statusColors: Record<string, string> = {
  active: "bg-green-500/10 text-green-600",
  trialing: "bg-blue-500/10 text-blue-600",
  past_due: "bg-amber-500/10 text-amber-600",
  canceled: "bg-red-500/10 text-red-600",
  incomplete: "bg-gray-500/10 text-gray-600",
};

export default function DealershipsPage() {
  const [dealerships, setDealerships] = useState<DealershipData[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const { dealership: currentDealership, setDealership, setAdminActiveDealership, setOwnDealership } = useAppStore();

  useEffect(() => {
    fetchDealerships();
  }, []);

  const fetchDealerships = async () => {
    try {
      const res = await fetch("/api/admin/dealerships");
      if (res.ok) {
        const data = await res.json();
        setDealerships(data.dealerships || []);
      }
    } catch (error) {
      console.error("Failed to fetch dealerships:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleWorkAsClient = (d: DealershipData) => {
    // Use the full dealership record already fetched server-side (bypasses RLS)
    const fullDealership = d.dealership_record;

    if (!fullDealership) {
      toast.error("Could not load dealership data");
      return;
    }

    // Stash own dealership, switch to client
    setOwnDealership(currentDealership);
    setAdminActiveDealership(fullDealership as any);
    setDealership(fullDealership as any);
    toast.success(`Now working as: ${fullDealership.name}`);
    router.push("/dashboard");
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-heading font-bold tracking-tight flex items-center gap-2">
          <Building2 className="h-8 w-8 text-primary" />
          All Dealerships
        </h1>
        <p className="text-muted-foreground mt-2">
          {dealerships.length} dealerships across the platform
        </p>
      </div>

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle>Dealership Directory</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-12" />
              ))}
            </div>
          ) : dealerships.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              No dealerships found
            </p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Owner</TableHead>
                    <TableHead>Subscription</TableHead>
                    <TableHead className="text-right">Assets</TableHead>
                    <TableHead className="text-right">Pages</TableHead>
                    <TableHead className="text-right">Posts</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {dealerships.map((dealership) => (
                    <TableRow key={dealership.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{dealership.name}</p>
                          <p className="text-xs text-muted-foreground font-mono">
                            {dealership.id}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <p className="text-sm">{dealership.owner_email}</p>
                      </TableCell>
                      <TableCell>
                        {dealership.subscription_status ? (
                          <div>
                            <Badge
                              className={statusColors[dealership.subscription_status] || ""}
                            >
                              {dealership.subscription_status.charAt(0).toUpperCase() +
                                dealership.subscription_status.slice(1)}
                            </Badge>
                            {dealership.subscription_plan && (
                              <p className="text-xs text-muted-foreground mt-1">
                                {dealership.subscription_plan}
                              </p>
                            )}
                            {dealership.current_period_end && (
                              <p className="text-xs text-muted-foreground">
                                {new Date(
                                  dealership.current_period_end
                                ).toLocaleDateString()}
                              </p>
                            )}
                          </div>
                        ) : (
                          <Badge variant="outline">No subscription</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        {dealership.monthly_usage.assets_generated}
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        {dealership.monthly_usage.landing_pages_created}
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        {dealership.monthly_usage.social_posts_published}
                      </TableCell>
                      <TableCell className="text-sm">
                        {new Date(dealership.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <Button
                          size="sm"
                          variant="outline"
                          className="gap-1.5 text-xs"
                          onClick={() => handleWorkAsClient(dealership)}
                        >
                          <Wand2 className="h-3 w-3" />
                          Work as Client
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Summary Stats */}
      {!loading && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Active Subs</p>
                  <p className="text-2xl font-bold">
                    {dealerships.filter((d) => d.subscription_status === "active")
                      .length}
                  </p>
                </div>
                <TrendingUp className="h-8 w-8 text-green-500/50" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">No Sub</p>
                  <p className="text-2xl font-bold">
                    {dealerships.filter((d) => !d.subscription_status).length}
                  </p>
                </div>
                <Building2 className="h-8 w-8 text-amber-500/50" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Usage (this month)</p>
                  <p className="text-2xl font-bold">
                    {dealerships.reduce(
                      (sum, d) => sum + d.monthly_usage.assets_generated,
                      0
                    )}
                    &nbsp;assets
                  </p>
                </div>
                <TrendingUp className="h-8 w-8 text-blue-500/50" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
