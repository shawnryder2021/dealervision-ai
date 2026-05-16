"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  Camera,
  Loader2,
  Plus,
  Search,
  Trash2,
  Upload,
  Image as ImageIcon,
  Power,
  PowerOff,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  VEHICLE_MAKES_MODELS,
  getModelsForMake,
  COMMON_TRIMS,
  getYearRange,
} from "@/lib/vehicle-data";

interface ReferenceVehicle {
  id: string;
  year: number;
  make: string;
  model: string;
  trim: string | null;
  color: string | null;
  image_url: string;
  thumbnail_url: string | null;
  notes: string | null;
  is_active: boolean;
  created_by: string | null;
  created_at: string;
}

const YEARS = getYearRange();
const MAKES = VEHICLE_MAKES_MODELS.map((m) => m.make);
// "Any trim" sentinel value (Radix Select doesn't allow empty-string values)
const ANY_TRIM = "__any__";

export default function ReferenceVehiclesPage() {
  const [list, setList] = useState<ReferenceVehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  // Form state
  const [year, setYear] = useState<string>(String(YEARS[0]));
  const [make, setMake] = useState<string>("");
  const [model, setModel] = useState<string>("");
  const [trim, setTrim] = useState<string>(ANY_TRIM);
  const [color, setColor] = useState<string>("");
  const [notes, setNotes] = useState<string>("");
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [creating, setCreating] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadVehicles = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/reference-vehicles");
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Failed to load");
      }
      const data = await res.json();
      setList(data.vehicles || []);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadVehicles();
  }, [loadVehicles]);

  async function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Upload failed");
      }
      const data = await res.json();
      const url = data.url || data.image_url;
      if (!url) throw new Error("Upload did not return a URL");
      setImageUrl(url);
      toast.success("Image uploaded");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  function resetForm() {
    setYear(String(YEARS[0]));
    setMake("");
    setModel("");
    setTrim(ANY_TRIM);
    setColor("");
    setNotes("");
    setImageUrl(null);
  }

  async function handleCreate() {
    if (!year || !make || !model || !imageUrl) {
      toast.error("Year, make, model, and image are all required");
      return;
    }
    setCreating(true);
    try {
      const res = await fetch("/api/admin/reference-vehicles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          year: parseInt(year, 10),
          make: make.trim(),
          model: model.trim(),
          trim: trim === ANY_TRIM ? null : trim.trim() || null,
          color: color.trim() || null,
          image_url: imageUrl,
          notes: notes.trim() || null,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Failed to create");
      }
      toast.success(`Added ${year} ${make} ${model}${trim !== ANY_TRIM ? ` (${trim})` : ""}`);
      resetForm();
      loadVehicles();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create");
    } finally {
      setCreating(false);
    }
  }

  async function handleDelete(id: string, label: string) {
    if (!confirm(`Delete reference for ${label}? This cannot be undone.`)) return;
    try {
      const res = await fetch(`/api/admin/reference-vehicles/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Failed to delete");
      }
      toast.success("Removed");
      setList((prev) => prev.filter((v) => v.id !== id));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete");
    }
  }

  async function handleToggleActive(v: ReferenceVehicle) {
    const next = !v.is_active;
    try {
      const res = await fetch(`/api/admin/reference-vehicles/${v.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_active: next }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Failed to update");
      }
      setList((prev) =>
        prev.map((row) => (row.id === v.id ? { ...row, is_active: next } : row))
      );
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update");
    }
  }

  const filtered = list.filter((v) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      v.make.toLowerCase().includes(q) ||
      v.model.toLowerCase().includes(q) ||
      (v.trim?.toLowerCase().includes(q) ?? false) ||
      String(v.year).includes(q)
    );
  });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-heading font-bold flex items-center gap-2">
          <Camera className="h-5 w-5 text-primary" />
          Reference Vehicles
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          Upload reference photos by year / make / model / trim. The platform
          uses these at generation time so the AI renders the exact vehicle a
          dealer is marketing. Active references are passed to the image model
          as visual guides.
        </p>
      </div>

      {/* Add new */}
      <Card className="glass">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Add Reference Vehicle
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Year</Label>
              <Select value={year} onValueChange={(v) => setYear(v ?? "")}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {YEARS.map((y) => (
                    <SelectItem key={y} value={String(y)}>
                      {y}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Make</Label>
              <Select
                value={make}
                onValueChange={(v) => {
                  setMake(v ?? "");
                  setModel("");
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Pick a make" />
                </SelectTrigger>
                <SelectContent className="max-h-[40vh]">
                  {MAKES.map((m) => (
                    <SelectItem key={m} value={m}>
                      {m}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Model</Label>
              <Select
                value={model}
                onValueChange={(v) => setModel(v ?? "")}
                disabled={!make}
              >
                <SelectTrigger>
                  <SelectValue placeholder={make ? "Pick a model" : "Pick a make first"} />
                </SelectTrigger>
                <SelectContent className="max-h-[40vh]">
                  {make &&
                    getModelsForMake(make).map((m) => (
                      <SelectItem key={m} value={m}>
                        {m}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">
                Trim <span className="text-muted-foreground">(optional)</span>
              </Label>
              <Select value={trim} onValueChange={(v) => setTrim(v ?? ANY_TRIM)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="max-h-[40vh]">
                  <SelectItem value={ANY_TRIM}>Any trim</SelectItem>
                  {COMMON_TRIMS.map((t) => (
                    <SelectItem key={t} value={t}>
                      {t}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">
                Color <span className="text-muted-foreground">(optional)</span>
              </Label>
              <Input
                placeholder="e.g., Velocity Blue, Midnight Black"
                value={color}
                onChange={(e) => setColor(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">
                Notes <span className="text-muted-foreground">(optional)</span>
              </Label>
              <Input
                placeholder="e.g., Press photo front 3/4, OEM stock"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>
          </div>

          {/* Image upload */}
          <div className="space-y-1.5">
            <Label className="text-xs">Reference photo</Label>
            {imageUrl ? (
              <div className="flex items-start gap-3">
                <div className="relative w-40 h-32 rounded-lg overflow-hidden border border-border bg-muted">
                  <img
                    src={imageUrl}
                    alt="Reference"
                    className="w-full h-full object-cover"
                  />
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  type="button"
                  onClick={() => setImageUrl(null)}
                >
                  Replace
                </Button>
              </div>
            ) : (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-border rounded-lg p-6 text-center cursor-pointer hover:border-primary/40 hover:bg-muted/30 transition-colors"
              >
                {uploading ? (
                  <div className="flex flex-col items-center gap-2">
                    <Loader2 className="h-5 w-5 animate-spin text-primary" />
                    <p className="text-sm text-muted-foreground">Uploading…</p>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-2">
                    <Upload className="h-7 w-7 text-muted-foreground/60" />
                    <p className="text-sm font-medium">Click to upload reference</p>
                    <p className="text-xs text-muted-foreground">
                      Use an OEM press photo or a clean dealer-lot shot. JPG / PNG / WebP.
                    </p>
                  </div>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileSelect}
                  className="hidden"
                />
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <Button variant="ghost" type="button" onClick={resetForm} disabled={creating}>
              Clear
            </Button>
            <Button
              type="button"
              onClick={handleCreate}
              disabled={creating || !year || !make || !model || !imageUrl}
              className="gradient-primary text-white"
            >
              {creating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
                  Adding…
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4 mr-1.5" />
                  Add reference
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* List */}
      <Card className="glass">
        <CardHeader>
          <CardTitle className="text-base flex items-center justify-between gap-3">
            <span className="flex items-center gap-2">
              <ImageIcon className="h-4 w-4" />
              Library
              <Badge variant="secondary" className="ml-1">
                {list.length}
              </Badge>
            </span>
            <div className="relative w-full max-w-xs">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                placeholder="Search make / model / trim / year"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-7 h-8 text-sm font-normal"
              />
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-12 text-sm text-muted-foreground">
              {list.length === 0
                ? "No reference vehicles yet. Add your first above."
                : "No matches for that search."}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
              {filtered.map((v) => (
                <div
                  key={v.id}
                  className={`rounded-lg border overflow-hidden bg-card transition-opacity ${
                    v.is_active ? "" : "opacity-50"
                  }`}
                >
                  <div className="aspect-video bg-muted/40 relative">
                    <img
                      src={v.image_url}
                      alt={`${v.year} ${v.make} ${v.model}`}
                      className="w-full h-full object-cover"
                    />
                    {!v.is_active && (
                      <div className="absolute top-1.5 left-1.5">
                        <Badge variant="secondary" className="text-[10px]">
                          Inactive
                        </Badge>
                      </div>
                    )}
                  </div>
                  <div className="p-3 space-y-1.5">
                    <p className="text-sm font-medium leading-tight">
                      {v.year} {v.make} {v.model}
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {v.trim && (
                        <Badge variant="outline" className="text-[10px]">
                          {v.trim}
                        </Badge>
                      )}
                      {v.color && (
                        <Badge variant="outline" className="text-[10px]">
                          {v.color}
                        </Badge>
                      )}
                    </div>
                    {v.notes && (
                      <p className="text-xs text-muted-foreground line-clamp-2">{v.notes}</p>
                    )}
                    <div className="flex justify-between items-center pt-1.5">
                      <Button
                        size="sm"
                        variant="ghost"
                        type="button"
                        onClick={() => handleToggleActive(v)}
                        className="h-7 text-xs"
                      >
                        {v.is_active ? (
                          <>
                            <PowerOff className="h-3.5 w-3.5 mr-1" />
                            Disable
                          </>
                        ) : (
                          <>
                            <Power className="h-3.5 w-3.5 mr-1 text-green-500" />
                            Enable
                          </>
                        )}
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        type="button"
                        onClick={() =>
                          handleDelete(v.id, `${v.year} ${v.make} ${v.model}`)
                        }
                        className="h-7 text-xs text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
