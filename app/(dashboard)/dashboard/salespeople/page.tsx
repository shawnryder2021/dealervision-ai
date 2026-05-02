"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { UserCircle, Plus, Trash2, ExternalLink, Loader2, Edit } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import type { Salesperson } from "@/lib/db/salespeople";
import { useAppStore } from "@/lib/store";
import { toast } from "sonner";

const empty: Partial<Salesperson> = {
  full_name: "",
  title: "Sales Consultant",
  email: "",
  phone: "",
  photo_url: "",
  bio: "",
  years_experience: null,
  languages: [],
  specialties: [],
  is_active: true,
};

export default function SalespeoplePage() {
  const { dealership } = useAppStore();
  const [people, setPeople] = useState<Salesperson[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Salesperson | null>(null);
  const [form, setForm] = useState<Partial<Salesperson>>(empty);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    const res = await fetch("/api/salespeople");
    if (res.ok) {
      const data = await res.json();
      setPeople(data.salespeople || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const startNew = () => {
    setEditing(null);
    setForm({ ...empty });
    setOpen(true);
  };
  const startEdit = (s: Salesperson) => {
    setEditing(s);
    setForm(s);
    setOpen(true);
  };

  const save = async () => {
    if (!form.full_name?.trim()) {
      toast.error("Name is required");
      return;
    }
    setSaving(true);
    try {
      const url = editing ? `/api/salespeople/${editing.id}` : "/api/salespeople";
      const method = editing ? "PATCH" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const e = await res.json().catch(() => ({}));
        throw new Error(e.error || "Failed");
      }
      toast.success(editing ? "Updated" : "Added");
      setOpen(false);
      load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed");
    } finally {
      setSaving(false);
    }
  };

  const remove = async (s: Salesperson) => {
    if (!confirm(`Delete ${s.full_name}?`)) return;
    const res = await fetch(`/api/salespeople/${s.id}`, { method: "DELETE" });
    if (res.ok) {
      toast.success("Deleted");
      load();
    } else toast.error("Failed");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold flex items-center gap-2">
            <UserCircle className="h-6 w-6 text-primary" />
            Salespeople
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Each salesperson gets a public landing page they can share with their leads.
          </p>
        </div>
        <Button onClick={startNew}>
          <Plus className="h-4 w-4 mr-1" />
          Add Salesperson
        </Button>
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : people.length === 0 ? (
        <Card>
          <CardContent className="pt-8 pb-8 text-center text-sm text-muted-foreground">
            <UserCircle className="h-12 w-12 mx-auto mb-3 opacity-50" />
            No salespeople yet. Add your first one to give them a shareable page.
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {people.map((s) => (
            <Card key={s.id}>
              <CardContent className="pt-6 space-y-3">
                <div className="flex items-center gap-3">
                  {s.photo_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={s.photo_url} alt={s.full_name} className="h-14 w-14 rounded-full object-cover" />
                  ) : (
                    <div className="h-14 w-14 rounded-full bg-muted flex items-center justify-center">
                      <UserCircle className="h-7 w-7 text-muted-foreground" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold truncate">{s.full_name}</p>
                    {s.title && <p className="text-xs text-muted-foreground truncate">{s.title}</p>}
                    {!s.is_active && (
                      <p className="text-[10px] uppercase tracking-wide text-amber-500 mt-1">Hidden</p>
                    )}
                  </div>
                </div>
                {s.bio && <p className="text-xs text-muted-foreground line-clamp-3">{s.bio}</p>}
                <div className="flex flex-wrap gap-1 text-[11px] text-muted-foreground">
                  {s.email && <span className="px-1.5 py-0.5 bg-muted rounded">{s.email}</span>}
                  {s.phone && <span className="px-1.5 py-0.5 bg-muted rounded">{s.phone}</span>}
                </div>
                <div className="flex gap-2 pt-2">
                  {dealership?.slug && (
                    <Link
                      href={`/team/${dealership.slug}/${s.slug}`}
                      target="_blank"
                      className={buttonVariants({ size: "sm", variant: "outline" })}
                    >
                      <ExternalLink className="h-3.5 w-3.5 mr-1" />
                      View page
                    </Link>
                  )}
                  <Button size="sm" variant="ghost" onClick={() => startEdit(s)}>
                    <Edit className="h-3.5 w-3.5" />
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => remove(s)}>
                    <Trash2 className="h-3.5 w-3.5 text-destructive" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Salesperson" : "New Salesperson"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Full name *</Label>
              <Input
                value={form.full_name || ""}
                onChange={(e) => setForm((f) => ({ ...f, full_name: e.target.value }))}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Title</Label>
                <Input value={form.title || ""} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} />
              </div>
              <div>
                <Label>Years experience</Label>
                <Input
                  type="number"
                  value={form.years_experience ?? ""}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, years_experience: e.target.value ? Number(e.target.value) : null }))
                  }
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Email</Label>
                <Input value={form.email || ""} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} />
              </div>
              <div>
                <Label>Phone</Label>
                <Input value={form.phone || ""} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} />
              </div>
            </div>
            <div>
              <Label>Photo URL</Label>
              <Input
                placeholder="https://…"
                value={form.photo_url || ""}
                onChange={(e) => setForm((f) => ({ ...f, photo_url: e.target.value }))}
              />
            </div>
            <div>
              <Label>Bio</Label>
              <Textarea
                rows={4}
                value={form.bio || ""}
                onChange={(e) => setForm((f) => ({ ...f, bio: e.target.value }))}
                placeholder="What makes them great with customers"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Languages (comma-sep)</Label>
                <Input
                  value={(form.languages || []).join(", ")}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, languages: e.target.value.split(",").map((s) => s.trim()).filter(Boolean) }))
                  }
                />
              </div>
              <div>
                <Label>Specialties</Label>
                <Input
                  value={(form.specialties || []).join(", ")}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, specialties: e.target.value.split(",").map((s) => s.trim()).filter(Boolean) }))
                  }
                  placeholder="Trucks, Trade-ins, First-time buyers"
                />
              </div>
            </div>
            <div className="flex items-center justify-between pt-2">
              <Label className="flex items-center gap-2">
                <Switch
                  checked={form.is_active !== false}
                  onCheckedChange={(v) => setForm((f) => ({ ...f, is_active: v }))}
                />
                Page is public
              </Label>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={save} disabled={saving}>
                  {saving && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
                  Save
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
