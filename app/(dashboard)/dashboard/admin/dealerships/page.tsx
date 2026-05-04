"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Building2, TrendingUp, Wand2, Plus, KeyRound, Eye, EyeOff, Loader2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useAppStore } from "@/lib/store";
import { toast } from "sonner";
import type { Dealership } from "@/lib/types";

interface DealershipData {
  id: string;
  name: string;
  owner_email: string;
  owner_user_id: string | null;
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
  dealership_record: Dealership;
}

const statusColors: Record<string, string> = {
  active: "bg-green-500/10 text-green-600",
  trialing: "bg-blue-500/10 text-blue-600",
  past_due: "bg-amber-500/10 text-amber-600",
  canceled: "bg-red-500/10 text-red-600",
  incomplete: "bg-gray-500/10 text-gray-600",
};

// ─── Create Dealership Modal ─────────────────────────────────────────────────
function CreateDealershipModal({
  open,
  onClose,
  onCreated,
}: {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
}) {
  const [form, setForm] = useState({
    name: "",
    owner_email: "",
    owner_name: "",
    password: "",
    phone: "",
    website: "",
    city: "",
    state_code: "",
  });
  const [showPass, setShowPass] = useState(false);
  const [saving, setSaving] = useState(false);

  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.owner_email || !form.password) {
      toast.error("Dealership name, owner email, and password are required");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/admin/dealerships", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create");
      toast.success(`Dealership "${form.name}" created successfully`);
      onCreated();
      onClose();
      setForm({ name: "", owner_email: "", owner_name: "", password: "", phone: "", website: "", city: "", state_code: "" });
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5 text-primary" />
            Create New Dealership
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Dealership Info</p>
            <div>
              <Label className="text-xs">Dealership Name *</Label>
              <Input
                className="mt-1"
                value={form.name}
                onChange={(e) => set("name", e.target.value)}
                placeholder="Acme Ford"
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Phone</Label>
                <Input className="mt-1" value={form.phone} onChange={(e) => set("phone", e.target.value)} placeholder="(555) 555-5555" />
              </div>
              <div>
                <Label className="text-xs">Website</Label>
                <Input className="mt-1" value={form.website} onChange={(e) => set("website", e.target.value)} placeholder="https://..." />
              </div>
              <div>
                <Label className="text-xs">City</Label>
                <Input className="mt-1" value={form.city} onChange={(e) => set("city", e.target.value)} placeholder="Dallas" />
              </div>
              <div>
                <Label className="text-xs">State</Label>
                <Input className="mt-1" value={form.state_code} onChange={(e) => set("state_code", e.target.value)} placeholder="TX" maxLength={2} />
              </div>
            </div>
          </div>

          <div className="space-y-3 border-t pt-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Owner Account</p>
            <div>
              <Label className="text-xs">Owner Email *</Label>
              <Input
                className="mt-1"
                type="email"
                value={form.owner_email}
                onChange={(e) => set("owner_email", e.target.value)}
                placeholder="owner@dealership.com"
                required
              />
            </div>
            <div>
              <Label className="text-xs">Owner Full Name</Label>
              <Input className="mt-1" value={form.owner_name} onChange={(e) => set("owner_name", e.target.value)} placeholder="John Smith" />
            </div>
            <div>
              <Label className="text-xs">Password *</Label>
              <div className="relative mt-1">
                <Input
                  type={showPass ? "text" : "password"}
                  value={form.password}
                  onChange={(e) => set("password", e.target.value)}
                  placeholder="Min 6 characters"
                  required
                  minLength={6}
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={saving}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Creating…</> : "Create Dealership"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ─── Reset Password Modal ────────────────────────────────────────────────────
function ResetPasswordModal({
  open,
  onClose,
  dealership,
}: {
  open: boolean;
  onClose: () => void;
  dealership: DealershipData | null;
}) {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }
    if (password !== confirm) {
      toast.error("Passwords do not match");
      return;
    }
    if (!dealership?.owner_user_id) {
      toast.error("No user ID found for this dealership");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch(`/api/admin/users/${dealership.owner_user_id}/password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update password");
      toast.success(`Password updated for ${dealership.owner_email}`);
      onClose();
      setPassword("");
      setConfirm("");
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <KeyRound className="h-5 w-5 text-primary" />
            Reset Password
          </DialogTitle>
        </DialogHeader>
        {dealership && (
          <p className="text-sm text-muted-foreground">
            Setting new password for <strong>{dealership.owner_email}</strong>
            {" "}({dealership.name})
          </p>
        )}
        <form onSubmit={handleSubmit} className="space-y-3 mt-1">
          <div>
            <Label className="text-xs">New Password</Label>
            <div className="relative mt-1">
              <Input
                type={showPass ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Min 6 characters"
                required
                minLength={6}
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPass(!showPass)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>
          <div>
            <Label className="text-xs">Confirm Password</Label>
            <Input
              type="password"
              className="mt-1"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              placeholder="Re-enter password"
              required
            />
          </div>
          <DialogFooter className="mt-2">
            <Button type="button" variant="outline" onClick={onClose} disabled={saving}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Updating…</> : "Update Password"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ─── Main Page ───────────────────────────────────────────────────────────────
export default function DealershipsPage() {
  const [dealerships, setDealerships] = useState<DealershipData[]>([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [passwordTarget, setPasswordTarget] = useState<DealershipData | null>(null);
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
    const fullDealership = d.dealership_record;
    if (!fullDealership) {
      toast.error("Could not load dealership data");
      return;
    }
    setOwnDealership(currentDealership);
    setAdminActiveDealership(fullDealership);
    setDealership(fullDealership);
    toast.success(`Now working as: ${fullDealership.name}`);
    router.push("/dashboard");
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-heading font-bold tracking-tight flex items-center gap-2">
            <Building2 className="h-8 w-8 text-primary" />
            All Dealerships
          </h1>
          <p className="text-muted-foreground mt-2">
            {dealerships.length} dealerships across the platform
          </p>
        </div>
        <Button onClick={() => setCreateOpen(true)} className="gap-1.5">
          <Plus className="h-4 w-4" />
          Create Dealership
        </Button>
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
                        {dealership.owner_user_id && (
                          <p className="text-xs text-muted-foreground font-mono truncate max-w-[140px]">
                            {dealership.owner_user_id}
                          </p>
                        )}
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
                        <div className="flex gap-1.5">
                          <Button
                            size="sm"
                            variant="outline"
                            className="gap-1.5 text-xs"
                            onClick={() => handleWorkAsClient(dealership)}
                          >
                            <Wand2 className="h-3 w-3" />
                            Work as Client
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="gap-1.5 text-xs"
                            onClick={() => setPasswordTarget(dealership)}
                            disabled={!dealership.owner_user_id}
                            title={!dealership.owner_user_id ? "No user account linked" : "Reset password"}
                          >
                            <KeyRound className="h-3 w-3" />
                            Password
                          </Button>
                        </div>
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
                    {dealerships.filter((d) => d.subscription_status === "active").length}
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
                    {dealerships.reduce((sum, d) => sum + d.monthly_usage.assets_generated, 0)}
                    &nbsp;assets
                  </p>
                </div>
                <TrendingUp className="h-8 w-8 text-blue-500/50" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Modals */}
      <CreateDealershipModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreated={fetchDealerships}
      />
      <ResetPasswordModal
        open={!!passwordTarget}
        onClose={() => setPasswordTarget(null)}
        dealership={passwordTarget}
      />
    </div>
  );
}
