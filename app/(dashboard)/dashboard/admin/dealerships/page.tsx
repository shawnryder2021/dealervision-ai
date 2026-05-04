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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Building2,
  TrendingUp,
  Wand2,
  Plus,
  KeyRound,
  Eye,
  EyeOff,
  Loader2,
  Users,
  Trash2,
  UserPlus,
  ShieldCheck,
  User,
  Crown,
  Coins,
  ArrowUpCircle,
  ArrowDownCircle,
  History,
  Minus,
} from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { useAppStore } from "@/lib/store";
import { toast } from "sonner";
import type { Dealership } from "@/lib/types";

// ─── Types ────────────────────────────────────────────────────────────────────
interface CreditBalance {
  dealership_id: string;
  balance: number;
  total_granted: number;
  total_used: number;
  updated_at?: string;
}

interface CreditTransaction {
  id: string;
  amount: number;
  type: "grant" | "usage" | "adjustment";
  note: string | null;
  admin_email: string | null;
  created_at: string;
}

interface DealershipUser {
  id: string;
  email: string;
  full_name: string | null;
  role: "owner" | "admin" | "member";
  created_at: string;
}

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

// ─── Helpers ──────────────────────────────────────────────────────────────────
const statusColors: Record<string, string> = {
  active: "bg-green-500/10 text-green-600",
  trialing: "bg-blue-500/10 text-blue-600",
  past_due: "bg-amber-500/10 text-amber-600",
  canceled: "bg-red-500/10 text-red-600",
  incomplete: "bg-gray-500/10 text-gray-600",
};

const roleIcon = (role: string) => {
  if (role === "owner") return <Crown className="h-3 w-3 text-amber-500" />;
  if (role === "admin") return <ShieldCheck className="h-3 w-3 text-blue-500" />;
  return <User className="h-3 w-3 text-muted-foreground" />;
};

const roleBadgeClass = (role: string) => {
  if (role === "owner") return "bg-amber-500/10 text-amber-600 border-amber-200";
  if (role === "admin") return "bg-blue-500/10 text-blue-600 border-blue-200";
  return "bg-muted text-muted-foreground";
};

function PasswordInput({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <Input
        type={show ? "text" : "password"}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder || "Min 6 characters"}
        className="pr-10"
      />
      <button
        type="button"
        onClick={() => setShow(!show)}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
      >
        {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
      </button>
    </div>
  );
}

// ─── Create Dealership Modal ──────────────────────────────────────────────────
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
      toast.success(`Dealership "${form.name}" created`);
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
            <Plus className="h-5 w-5 text-primary" /> Create New Dealership
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Dealership Info</p>
            <div>
              <Label className="text-xs">Dealership Name *</Label>
              <Input className="mt-1" value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="Acme Ford" required />
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
              <Input className="mt-1" type="email" value={form.owner_email} onChange={(e) => set("owner_email", e.target.value)} placeholder="owner@dealership.com" required />
            </div>
            <div>
              <Label className="text-xs">Owner Full Name</Label>
              <Input className="mt-1" value={form.owner_name} onChange={(e) => set("owner_name", e.target.value)} placeholder="John Smith" />
            </div>
            <div>
              <Label className="text-xs">Password *</Label>
              <div className="mt-1">
                <PasswordInput value={form.password} onChange={(v) => set("password", v)} />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={saving}>Cancel</Button>
            <Button type="submit" disabled={saving}>
              {saving ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Creating…</> : "Create Dealership"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ─── Reset Password Modal ─────────────────────────────────────────────────────
function ResetPasswordModal({
  open,
  onClose,
  userId,
  userEmail,
  context,
}: {
  open: boolean;
  onClose: () => void;
  userId: string | null;
  userEmail: string;
  context: string;
}) {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) { toast.error("Password must be at least 6 characters"); return; }
    if (password !== confirm) { toast.error("Passwords do not match"); return; }
    if (!userId) { toast.error("No user ID"); return; }
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/users/${userId}/password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");
      toast.success(`Password updated for ${userEmail}`);
      onClose();
      setPassword(""); setConfirm("");
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
            <KeyRound className="h-5 w-5 text-primary" /> Reset Password
          </DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">
          New password for <strong>{userEmail}</strong>
          {context && <span className="text-xs"> · {context}</span>}
        </p>
        <form onSubmit={handleSubmit} className="space-y-3 mt-1">
          <div>
            <Label className="text-xs">New Password</Label>
            <div className="mt-1"><PasswordInput value={password} onChange={setPassword} /></div>
          </div>
          <div>
            <Label className="text-xs">Confirm Password</Label>
            <Input type="password" className="mt-1" value={confirm} onChange={(e) => setConfirm(e.target.value)} placeholder="Re-enter password" required />
          </div>
          <DialogFooter className="mt-2">
            <Button type="button" variant="outline" onClick={onClose} disabled={saving}>Cancel</Button>
            <Button type="submit" disabled={saving}>
              {saving ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Updating…</> : "Update Password"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ─── Manage Credits Modal ─────────────────────────────────────────────────────
function ManageCreditsModal({
  open,
  onClose,
  dealership,
}: {
  open: boolean;
  onClose: () => void;
  dealership: DealershipData | null;
}) {
  const [balance, setBalance] = useState<CreditBalance | null>(null);
  const [transactions, setTransactions] = useState<CreditTransaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ amount: "", type: "grant", note: "" });
  const [saving, setSaving] = useState(false);

  const load = async () => {
    if (!dealership) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/dealerships/${dealership.id}/credits`);
      if (res.ok) {
        const data = await res.json();
        setBalance(data.balance);
        setTransactions(data.transactions || []);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open && dealership) load();
  }, [open, dealership]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseInt(form.amount, 10);
    if (!amt || isNaN(amt)) { toast.error("Enter a valid amount"); return; }
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/dealerships/${dealership!.id}/credits`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: form.type === "adjustment" && amt > 0 ? amt : form.type === "adjustment" ? amt : Math.abs(amt),
          type: form.type,
          note: form.note || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");
      toast.success("Credits updated");
      setForm({ amount: "", type: "grant", note: "" });
      load();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  const txIcon = (tx: CreditTransaction) => {
    if (tx.type === "usage") return <ArrowDownCircle className="h-3.5 w-3.5 text-red-500 shrink-0" />;
    if (tx.amount < 0) return <Minus className="h-3.5 w-3.5 text-orange-500 shrink-0" />;
    return <ArrowUpCircle className="h-3.5 w-3.5 text-green-500 shrink-0" />;
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Coins className="h-5 w-5 text-primary" />
            Manage Credits — {dealership?.name}
          </DialogTitle>
        </DialogHeader>

        {/* Balance summary */}
        {loading ? (
          <Skeleton className="h-24" />
        ) : (
          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="rounded-lg border p-3">
              <p className="text-2xl font-bold text-primary">{balance?.balance ?? 0}</p>
              <p className="text-xs text-muted-foreground mt-0.5">Available</p>
            </div>
            <div className="rounded-lg border p-3">
              <p className="text-2xl font-bold">{balance?.total_granted ?? 0}</p>
              <p className="text-xs text-muted-foreground mt-0.5">Total Granted</p>
            </div>
            <div className="rounded-lg border p-3">
              <p className="text-2xl font-bold">{balance?.total_used ?? 0}</p>
              <p className="text-xs text-muted-foreground mt-0.5">Total Used</p>
            </div>
          </div>
        )}

        {/* Add / adjust credits form */}
        <form onSubmit={handleSubmit} className="border rounded-md p-4 space-y-3 bg-muted/30">
          <p className="text-sm font-semibold">Add / Adjust Credits</p>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Amount</Label>
              <Input
                className="mt-1"
                type="number"
                min={1}
                value={form.amount}
                onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
                placeholder="e.g. 50"
                required
              />
              <p className="text-xs text-muted-foreground mt-0.5">Use negative for adjustments</p>
            </div>
            <div>
              <Label className="text-xs">Type</Label>
              <Select value={form.type} onValueChange={(v) => v && setForm((f) => ({ ...f, type: v }))}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="grant">Grant (add credits)</SelectItem>
                  <SelectItem value="adjustment">Adjustment (add or remove)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <Label className="text-xs">Note (optional)</Label>
            <Textarea
              className="mt-1 text-sm"
              rows={2}
              value={form.note}
              onChange={(e) => setForm((f) => ({ ...f, note: e.target.value }))}
              placeholder="e.g. Onboarding package — 50 credits"
            />
          </div>
          <div className="flex gap-2 pt-1">
            <Button type="submit" size="sm" disabled={saving}>
              {saving ? <><Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />Saving…</> : "Apply Credits"}
            </Button>
          </div>
        </form>

        {/* Transaction history */}
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
            <History className="h-3.5 w-3.5" /> Transaction History
          </p>
          {loading ? (
            <div className="space-y-1">{[1,2,3].map((i) => <Skeleton key={i} className="h-8" />)}</div>
          ) : transactions.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">No transactions yet.</p>
          ) : (
            <div className="border rounded-md divide-y max-h-56 overflow-y-auto">
              {transactions.map((tx) => (
                <div key={tx.id} className="flex items-start gap-2 px-3 py-2 text-sm">
                  {txIcon(tx)}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className={`font-medium ${tx.amount > 0 ? "text-green-600" : "text-red-600"}`}>
                        {tx.amount > 0 ? "+" : ""}{tx.amount}
                      </span>
                      <span className="text-xs text-muted-foreground shrink-0">
                        {new Date(tx.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </div>
                    {tx.note && <p className="text-xs text-muted-foreground truncate">{tx.note}</p>}
                    {tx.admin_email && (
                      <p className="text-xs text-muted-foreground/60">by {tx.admin_email}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── Manage Users Modal ───────────────────────────────────────────────────────
function ManageUsersModal({
  open,
  onClose,
  dealership,
}: {
  open: boolean;
  onClose: () => void;
  dealership: DealershipData | null;
}) {
  const [users, setUsers] = useState<DealershipUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [addForm, setAddForm] = useState({ email: "", full_name: "", password: "", role: "member" });
  const [addSaving, setAddSaving] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [passwordTarget, setPasswordTarget] = useState<DealershipUser | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const setAdd = (k: string, v: string) => setAddForm((f) => ({ ...f, [k]: v }));

  const loadUsers = async () => {
    if (!dealership) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/dealerships/${dealership.id}/users`);
      if (res.ok) {
        const data = await res.json();
        setUsers(data.users || []);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open && dealership) { loadUsers(); setShowAdd(false); }
  }, [open, dealership]);

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addForm.email || !addForm.password) { toast.error("Email and password required"); return; }
    setAddSaving(true);
    try {
      const res = await fetch(`/api/admin/dealerships/${dealership!.id}/users`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(addForm),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");
      toast.success(`User ${addForm.email} added`);
      setAddForm({ email: "", full_name: "", password: "", role: "member" });
      setShowAdd(false);
      loadUsers();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setAddSaving(false);
    }
  };

  const handleRoleChange = async (userId: string, role: string) => {
    const res = await fetch(`/api/admin/dealerships/${dealership!.id}/users/${userId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role }),
    });
    if (res.ok) {
      toast.success("Role updated");
      loadUsers();
    } else {
      const d = await res.json();
      toast.error(d.error || "Failed to update role");
    }
  };

  const handleDelete = async (user: DealershipUser) => {
    if (!confirm(`Remove ${user.email} from ${dealership?.name}? This deletes their account permanently.`)) return;
    setDeletingId(user.id);
    try {
      const res = await fetch(`/api/admin/dealerships/${dealership!.id}/users/${user.id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");
      toast.success(`${user.email} removed`);
      loadUsers();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              Team Members — {dealership?.name}
            </DialogTitle>
          </DialogHeader>

          {/* User list */}
          {loading ? (
            <div className="space-y-2 py-4">
              {[1, 2, 3].map((i) => <Skeleton key={i} className="h-12" />)}
            </div>
          ) : users.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4">No users found.</p>
          ) : (
            <div className="border rounded-md overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Added</TableHead>
                    <TableHead className="w-[100px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((u) => (
                    <TableRow key={u.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium text-sm">{u.email}</p>
                          {u.full_name && (
                            <p className="text-xs text-muted-foreground">{u.full_name}</p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Select
                          value={u.role}
                          onValueChange={(v) => v && handleRoleChange(u.id, v)}
                        >
                          <SelectTrigger className="h-7 w-28 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="owner">
                              <span className="flex items-center gap-1.5"><Crown className="h-3 w-3 text-amber-500" />Owner</span>
                            </SelectItem>
                            <SelectItem value="admin">
                              <span className="flex items-center gap-1.5"><ShieldCheck className="h-3 w-3 text-blue-500" />Admin</span>
                            </SelectItem>
                            <SelectItem value="member">
                              <span className="flex items-center gap-1.5"><User className="h-3 w-3" />Member</span>
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {new Date(u.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button
                            size="icon-xs"
                            variant="ghost"
                            onClick={() => setPasswordTarget(u)}
                            title="Reset password"
                          >
                            <KeyRound className="h-3.5 w-3.5 text-muted-foreground" />
                          </Button>
                          <Button
                            size="icon-xs"
                            variant="ghost"
                            onClick={() => handleDelete(u)}
                            disabled={deletingId === u.id}
                            title="Remove user"
                          >
                            {deletingId === u.id
                              ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                              : <Trash2 className="h-3.5 w-3.5 text-destructive" />}
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          {/* Add user form */}
          {!showAdd ? (
            <Button
              variant="outline"
              className="w-full gap-1.5 mt-2"
              onClick={() => setShowAdd(true)}
            >
              <UserPlus className="h-4 w-4" />
              Add Team Member
            </Button>
          ) : (
            <form onSubmit={handleAddUser} className="border rounded-md p-4 space-y-3 mt-2 bg-muted/30">
              <p className="text-sm font-semibold">Add Team Member</p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs">Email *</Label>
                  <Input
                    className="mt-1"
                    type="email"
                    value={addForm.email}
                    onChange={(e) => setAdd("email", e.target.value)}
                    placeholder="user@dealership.com"
                    required
                  />
                </div>
                <div>
                  <Label className="text-xs">Full Name</Label>
                  <Input
                    className="mt-1"
                    value={addForm.full_name}
                    onChange={(e) => setAdd("full_name", e.target.value)}
                    placeholder="Jane Smith"
                  />
                </div>
                <div>
                  <Label className="text-xs">Password *</Label>
                  <div className="mt-1">
                    <PasswordInput value={addForm.password} onChange={(v) => setAdd("password", v)} />
                  </div>
                </div>
                <div>
                  <Label className="text-xs">Role</Label>
                  <Select value={addForm.role} onValueChange={(v) => v && setAdd("role", v)}>
                    <SelectTrigger className="mt-1 h-9">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="owner">Owner</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                      <SelectItem value="member">Member</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex gap-2 pt-1">
                <Button type="submit" size="sm" disabled={addSaving}>
                  {addSaving ? <><Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />Adding…</> : "Add User"}
                </Button>
                <Button type="button" size="sm" variant="ghost" onClick={() => setShowAdd(false)}>
                  Cancel
                </Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* Password reset modal (nested — stays on top) */}
      <ResetPasswordModal
        open={!!passwordTarget}
        onClose={() => setPasswordTarget(null)}
        userId={passwordTarget?.id ?? null}
        userEmail={passwordTarget?.email ?? ""}
        context={dealership?.name ?? ""}
      />
    </>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function DealershipsPage() {
  const [dealerships, setDealerships] = useState<DealershipData[]>([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [passwordTarget, setPasswordTarget] = useState<DealershipData | null>(null);
  const [usersTarget, setUsersTarget] = useState<DealershipData | null>(null);
  const [creditsTarget, setCreditsTarget] = useState<DealershipData | null>(null);
  const [creditBalances, setCreditBalances] = useState<Record<string, number>>({});
  const router = useRouter();
  const { dealership: currentDealership, setDealership, setAdminActiveDealership, setOwnDealership } = useAppStore();

  useEffect(() => { fetchDealerships(); }, []);

  const fetchDealerships = async () => {
    try {
      const res = await fetch("/api/admin/dealerships");
      if (res.ok) {
        const data = await res.json();
        const list: DealershipData[] = data.dealerships || [];
        setDealerships(list);
        // Fetch credit balances for all dealerships in parallel (best effort)
        const balanceEntries = await Promise.all(
          list.map(async (d) => {
            try {
              const cr = await fetch(`/api/admin/dealerships/${d.id}/credits`);
              if (cr.ok) {
                const cd = await cr.json();
                return [d.id, cd.balance?.balance ?? 0] as [string, number];
              }
            } catch {}
            return [d.id, 0] as [string, number];
          })
        );
        setCreditBalances(Object.fromEntries(balanceEntries));
      }
    } catch (error) {
      console.error("Failed to fetch dealerships:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleWorkAsClient = (d: DealershipData) => {
    const fullDealership = d.dealership_record;
    if (!fullDealership) { toast.error("Could not load dealership data"); return; }
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
          <Plus className="h-4 w-4" /> Create Dealership
        </Button>
      </div>

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle>Dealership Directory</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-12" />)}</div>
          ) : dealerships.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">No dealerships found</p>
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
                    <TableHead className="text-right">Credits</TableHead>
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
                          <p className="text-xs text-muted-foreground font-mono">{dealership.id}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <p className="text-sm">{dealership.owner_email}</p>
                      </TableCell>
                      <TableCell>
                        {dealership.subscription_status ? (
                          <div>
                            <Badge className={statusColors[dealership.subscription_status] || ""}>
                              {dealership.subscription_status.charAt(0).toUpperCase() + dealership.subscription_status.slice(1)}
                            </Badge>
                            {dealership.subscription_plan && (
                              <p className="text-xs text-muted-foreground mt-1">{dealership.subscription_plan}</p>
                            )}
                            {dealership.current_period_end && (
                              <p className="text-xs text-muted-foreground">
                                {new Date(dealership.current_period_end).toLocaleDateString()}
                              </p>
                            )}
                          </div>
                        ) : (
                          <Badge variant="outline">No subscription</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right font-mono">{dealership.monthly_usage.assets_generated}</TableCell>
                      <TableCell className="text-right font-mono">{dealership.monthly_usage.landing_pages_created}</TableCell>
                      <TableCell className="text-right font-mono">{dealership.monthly_usage.social_posts_published}</TableCell>
                      <TableCell className="text-right">
                        {(creditBalances[dealership.id] ?? 0) > 0 ? (
                          <span className="font-semibold text-primary">
                            {creditBalances[dealership.id]}
                          </span>
                        ) : (
                          <span className="text-muted-foreground font-mono">0</span>
                        )}
                      </TableCell>
                      <TableCell className="text-sm">
                        {new Date(dealership.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1.5 flex-wrap">
                          <Button
                            size="sm"
                            variant="outline"
                            className="gap-1 text-xs"
                            onClick={() => handleWorkAsClient(dealership)}
                          >
                            <Wand2 className="h-3 w-3" />
                            Work as Client
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="gap-1 text-xs"
                            onClick={() => setUsersTarget(dealership)}
                          >
                            <Users className="h-3 w-3" />
                            Users
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className={`gap-1 text-xs ${(creditBalances[dealership.id] ?? 0) > 0 ? "border-primary/50 text-primary" : ""}`}
                            onClick={() => setCreditsTarget(dealership)}
                          >
                            <Coins className="h-3 w-3" />
                            Credits {(creditBalances[dealership.id] ?? 0) > 0 && `(${creditBalances[dealership.id]})`}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="gap-1 text-xs"
                            onClick={() => setPasswordTarget(dealership)}
                            disabled={!dealership.owner_user_id}
                            title={!dealership.owner_user_id ? "No user account linked" : "Reset owner password"}
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
                    {dealerships.reduce((sum, d) => sum + d.monthly_usage.assets_generated, 0)}&nbsp;assets
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
        userId={passwordTarget?.owner_user_id ?? null}
        userEmail={passwordTarget?.owner_email ?? ""}
        context={passwordTarget?.name ?? ""}
      />
      <ManageCreditsModal
        open={!!creditsTarget}
        onClose={() => {
          setCreditsTarget(null);
          // Refresh balances after closing so the table updates
          fetchDealerships();
        }}
        dealership={creditsTarget}
      />
      <ManageUsersModal
        open={!!usersTarget}
        onClose={() => setUsersTarget(null)}
        dealership={usersTarget}
      />
    </div>
  );
}
