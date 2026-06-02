"use client";

import { useEffect, useRef, useState } from "react";
import { Plus, Trash2, Loader2, Upload, Eye, EyeOff, Pencil, X } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { CONTENT_TYPES, CHANNEL_PRESETS, STYLE_OPTIONS } from "@/lib/constants";
import type { StarterTemplate } from "@/lib/types";
import { toast } from "sonner";

type Draft = Partial<StarterTemplate>;

const EMPTY: Draft = {
  name: "",
  description: "",
  category: "",
  preview_image_url: "",
  content_type: "vehicle-spotlight",
  channel: "instagram-post",
  style: "photorealistic",
  scene_location: "",
  headline: "",
  subheadline: "",
  cta: "",
  prompt_notes: "",
  sort_order: 0,
  is_active: true,
};

export default function AdminTemplatesPage() {
  const [templates, setTemplates] = useState<StarterTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Draft | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  async function load() {
    try {
      const res = await fetch("/api/starter-templates?all=1");
      if (res.ok) setTemplates((await res.json()).templates ?? []);
    } catch {
      toast.error("Couldn't load templates");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function handleUpload(file: File) {
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      if (!res.ok) throw new Error("Upload failed");
      const data = await res.json();
      setEditing((d) => (d ? { ...d, preview_image_url: data.url } : d));
      toast.success("Image uploaded");
    } catch {
      toast.error("Couldn't upload image");
    } finally {
      setUploading(false);
    }
  }

  async function save() {
    if (!editing) return;
    if (!editing.name || !editing.preview_image_url || !editing.content_type) {
      toast.error("Name, preview image, and content type are required");
      return;
    }
    setSaving(true);
    try {
      const isUpdate = !!editing.id;
      const res = await fetch(
        isUpdate ? `/api/starter-templates/${editing.id}` : "/api/starter-templates",
        {
          method: isUpdate ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(editing),
        }
      );
      if (!res.ok) throw new Error((await res.json()).error || "Save failed");
      toast.success(isUpdate ? "Template updated" : "Template created");
      setEditing(null);
      load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Couldn't save");
    } finally {
      setSaving(false);
    }
  }

  async function toggleActive(t: StarterTemplate) {
    await fetch(`/api/starter-templates/${t.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ is_active: !t.is_active }),
    });
    load();
  }

  async function remove(t: StarterTemplate) {
    if (!confirm(`Delete "${t.name}"? This can't be undone.`)) return;
    await fetch(`/api/starter-templates/${t.id}`, { method: "DELETE" });
    toast.success("Deleted");
    load();
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-heading font-bold">Template Gallery</h2>
          <p className="text-sm text-muted-foreground">
            Curate the starter templates dealers pick from. Each pairs a preview image
            with the generation settings it prefills.
          </p>
        </div>
        {!editing && (
          <Button onClick={() => setEditing({ ...EMPTY })}>
            <Plus className="h-4 w-4 mr-1.5" /> New Template
          </Button>
        )}
      </div>

      {/* Editor */}
      {editing && (
        <Card className="border-primary/30">
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-base">
              {editing.id ? "Edit template" : "New template"}
            </CardTitle>
            <Button variant="ghost" size="sm" onClick={() => setEditing(null)}>
              <X className="h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Left: preview image */}
              <div className="space-y-2">
                <Label>Preview image *</Label>
                <div className="aspect-[4/5] rounded-lg border border-dashed bg-muted/40 overflow-hidden flex items-center justify-center">
                  {editing.preview_image_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={editing.preview_image_url} alt="preview" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-xs text-muted-foreground">No image yet</span>
                  )}
                </div>
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  hidden
                  onChange={(e) => e.target.files?.[0] && handleUpload(e.target.files[0])}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="w-full"
                  disabled={uploading}
                  onClick={() => fileRef.current?.click()}
                >
                  {uploading ? <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> : <Upload className="h-3.5 w-3.5 mr-1.5" />}
                  {editing.preview_image_url ? "Replace image" : "Upload image"}
                </Button>
                <Input
                  placeholder="…or paste an image URL"
                  value={editing.preview_image_url ?? ""}
                  onChange={(e) => setEditing({ ...editing, preview_image_url: e.target.value })}
                />
              </div>

              {/* Right: fields */}
              <div className="space-y-3">
                <div>
                  <Label>Name *</Label>
                  <Input
                    value={editing.name ?? ""}
                    onChange={(e) => setEditing({ ...editing, name: e.target.value })}
                    placeholder="e.g. Sunset Showroom Spotlight"
                  />
                </div>
                <div>
                  <Label>Category</Label>
                  <Input
                    value={editing.category ?? ""}
                    onChange={(e) => setEditing({ ...editing, category: e.target.value })}
                    placeholder="e.g. Vehicle Spotlight, Sales Event, Seasonal"
                  />
                </div>
                <div>
                  <Label>Description</Label>
                  <Input
                    value={editing.description ?? ""}
                    onChange={(e) => setEditing({ ...editing, description: e.target.value })}
                    placeholder="Short one-liner shown on the card"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label>Sort order</Label>
                    <Input
                      type="number"
                      value={editing.sort_order ?? 0}
                      onChange={(e) => setEditing({ ...editing, sort_order: Number(e.target.value) })}
                    />
                  </div>
                  <div className="flex items-end">
                    <Button
                      type="button"
                      variant={editing.is_active ? "default" : "outline"}
                      className="w-full"
                      onClick={() => setEditing({ ...editing, is_active: !editing.is_active })}
                    >
                      {editing.is_active ? <Eye className="h-3.5 w-3.5 mr-1.5" /> : <EyeOff className="h-3.5 w-3.5 mr-1.5" />}
                      {editing.is_active ? "Active" : "Hidden"}
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            {/* Generation settings */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2 border-t">
              <div>
                <Label>Content type *</Label>
                <select
                  className="w-full h-9 rounded-md border bg-background px-2 text-sm"
                  value={editing.content_type}
                  onChange={(e) => setEditing({ ...editing, content_type: e.target.value })}
                >
                  {CONTENT_TYPES.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <Label>Channel</Label>
                <select
                  className="w-full h-9 rounded-md border bg-background px-2 text-sm"
                  value={editing.channel ?? ""}
                  onChange={(e) => setEditing({ ...editing, channel: e.target.value })}
                >
                  {CHANNEL_PRESETS.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <Label>Style</Label>
                <select
                  className="w-full h-9 rounded-md border bg-background px-2 text-sm"
                  value={editing.style ?? ""}
                  onChange={(e) => setEditing({ ...editing, style: e.target.value })}
                >
                  {STYLE_OPTIONS.map((s) => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <Label>Scene location (preset id, optional)</Label>
                <Input
                  value={editing.scene_location ?? ""}
                  onChange={(e) => setEditing({ ...editing, scene_location: e.target.value })}
                  placeholder="e.g. urban-luxury"
                />
              </div>
              <div>
                <Label>Headline</Label>
                <Input
                  value={editing.headline ?? ""}
                  onChange={(e) => setEditing({ ...editing, headline: e.target.value })}
                />
              </div>
              <div>
                <Label>Subheadline</Label>
                <Input
                  value={editing.subheadline ?? ""}
                  onChange={(e) => setEditing({ ...editing, subheadline: e.target.value })}
                />
              </div>
              <div>
                <Label>CTA</Label>
                <Input
                  value={editing.cta ?? ""}
                  onChange={(e) => setEditing({ ...editing, cta: e.target.value })}
                />
              </div>
            </div>

            <div>
              <Label>Prompt notes (shown to dealers as &quot;the prompt used&quot;)</Label>
              <Textarea
                rows={3}
                value={editing.prompt_notes ?? ""}
                onChange={(e) => setEditing({ ...editing, prompt_notes: e.target.value })}
                placeholder="Describe the look/setup so dealers understand what they're starting from."
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setEditing(null)}>Cancel</Button>
              <Button onClick={save} disabled={saving}>
                {saving && <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />}
                {editing.id ? "Save changes" : "Create template"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* List */}
      {loading ? (
        <div className="text-sm text-muted-foreground">Loading…</div>
      ) : templates.length === 0 ? (
        <Card><CardContent className="py-12 text-center text-sm text-muted-foreground">No templates yet. Create your first one.</CardContent></Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {templates.map((t) => (
            <Card key={t.id} className={t.is_active ? "" : "opacity-60"}>
              <div className="relative aspect-[4/5] bg-muted overflow-hidden rounded-t-lg">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={t.preview_image_url} alt={t.name} className="w-full h-full object-cover" />
                {!t.is_active && (
                  <Badge className="absolute top-2 left-2 bg-black/60 text-white border-0 text-[10px]">Hidden</Badge>
                )}
              </div>
              <CardContent className="p-3 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-medium text-sm truncate">{t.name}</p>
                    <p className="text-xs text-muted-foreground">{t.category || "Uncategorized"}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <Button variant="outline" size="sm" className="flex-1" onClick={() => setEditing(t)}>
                    <Pencil className="h-3.5 w-3.5 mr-1" /> Edit
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => toggleActive(t)} title={t.is_active ? "Hide" : "Show"}>
                    {t.is_active ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => remove(t)} title="Delete">
                    <Trash2 className="h-3.5 w-3.5 text-red-500" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
