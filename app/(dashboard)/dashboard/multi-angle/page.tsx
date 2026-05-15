"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Camera,
  Image as ImageIcon,
  Loader2,
  Save,
  Sparkles,
  Upload,
  Wand2,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAppStore } from "@/lib/store";
import { createClient } from "@/lib/supabase/client";
import { getScenePreset, type ScenePreset } from "@/lib/scene-presets";
import {
  ANGLE_PROMPTS,
  buildAnglePrompt,
  makeEmptyAngleJobs,
  type AngleJob,
} from "@/lib/multi-angle";
import { AngleGrid } from "@/components/multi-angle/AngleGrid";
import type { Vehicle } from "@/lib/types";
import { toast } from "sonner";

/**
 * Curated list of practical, driver-realistic locations for multi-angle galleries.
 * Grouped by setting. Drawn from the full scene-presets catalog, hand-picked to
 * exclude fantasy/showroom-only environments that don't read as real-world.
 */
const LOCATION_GROUPS: Array<{ label: string; presetIds: string[] }> = [
  {
    label: "Showroom & Studio",
    presetIds: [
      "studio-white",
      "studio-gradient",
      "showroom-urban-luxury",
      "showroom-classic-heritage",
      "showroom-origin-loft",
      "showroom-elise-gallery",
      "dealership-lot",
    ],
  },
  {
    label: "Everyday & Residential",
    presetIds: [
      "suburban-driveway",
      "upscale-neighborhood",
      "cafe-parking",
      "mall-parking",
    ],
  },
  {
    label: "City & Urban",
    presetIds: [
      "city-golden-hour",
      "historic-downtown",
      "industrial-brick",
      "downtown-high-rise",
    ],
  },
  {
    label: "Roads & Highway",
    presetIds: [
      "sunrise-highway",
      "country-road",
      "coastal-cliff",
      "canyon-road",
      "forest-road",
    ],
  },
  {
    label: "Nature & Scenic",
    presetIds: [
      "mountain-summit",
      "rolling-hills",
      "beach-boardwalk",
      "lake-reflection",
      "park-pathway",
    ],
  },
  {
    label: "Premium Lifestyle",
    presetIds: [
      "marina-waterfront",
      "golf-course",
      "mansion-driveway",
    ],
  },
];

/** Resolved location groups with full preset objects (drops any missing IDs). */
const LOCATION_SECTIONS: Array<{ label: string; presets: ScenePreset[] }> =
  LOCATION_GROUPS.map((g) => ({
    label: g.label,
    presets: g.presetIds
      .map((id) => getScenePreset(id))
      .filter((p): p is ScenePreset => !!p),
  })).filter((s) => s.presets.length > 0);

/** Flat list — used for default selection only. */
const ALL_PRACTICAL_LOCATIONS: ScenePreset[] = LOCATION_SECTIONS.flatMap(
  (s) => s.presets
);

const MAX_CONCURRENT = 3;

export default function MultiAnglePage() {
  const router = useRouter();
  const { dealership, adminActiveDealership } = useAppStore();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [vehicleId, setVehicleId] = useState<string>("none");
  const [showroomId, setShowroomId] = useState<string>(
    // Default to first showroom in the catalog
    ALL_PRACTICAL_LOCATIONS[0]?.id ?? ""
  );
  const [heroImageUrl, setHeroImageUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [jobs, setJobs] = useState<AngleJob[]>(makeEmptyAngleJobs());
  const [isGenerating, setIsGenerating] = useState(false);
  const [savedGalleryId, setSavedGalleryId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cancelledRef = useRef(false);

  // Load vehicles for the optional binding dropdown
  useEffect(() => {
    if (!dealership) return;
    const supabase = createClient();
    supabase
      .from("vehicles")
      .select("*")
      .eq("dealership_id", dealership.id)
      .order("created_at", { ascending: false })
      .then((res: { data: Vehicle[] | null }) => {
        if (res.data) setVehicles(res.data);
      });
  }, [dealership]);

  // Header for X-Dealership-Id support
  const dealershipHeaders = useCallback((): HeadersInit => {
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (adminActiveDealership) {
      headers["X-Dealership-Id"] = adminActiveDealership.id;
    }
    return headers;
  }, [adminActiveDealership]);

  async function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Upload failed");
      }
      const data = await res.json();
      const url = data.url || data.image_url;
      if (!url) throw new Error("Upload did not return a URL");
      setHeroImageUrl(url);
      toast.success("Hero photo uploaded");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Upload failed";
      toast.error(msg);
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  function setJob(angleId: string, update: Partial<AngleJob>) {
    setJobs((prev) =>
      prev.map((j) => (j.angle.id === angleId ? { ...j, ...update } : j))
    );
  }

  /** Run one angle: kick off /api/edit-image then poll until done. */
  async function runAngle(job: AngleJob): Promise<void> {
    if (!heroImageUrl) return;
    const prompt = buildAnglePrompt({ angle: job.angle, showroomPresetId: showroomId });

    setJob(job.angle.id, { status: "processing", error: null });

    try {
      const res = await fetch("/api/edit-image", {
        method: "POST",
        headers: dealershipHeaders(),
        body: JSON.stringify({
          prompt,
          image_url: heroImageUrl,
          image_size: "1:1",
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || `HTTP ${res.status}`);
      }
      const { taskId } = await res.json();
      setJob(job.angle.id, { taskId });

      // Poll
      const maxAttempts = 40;
      for (let i = 0; i < maxAttempts; i++) {
        if (cancelledRef.current) throw new Error("Cancelled");
        await new Promise((r) => setTimeout(r, 3000));
        const pollRes = await fetch(
          `/api/edit-image?taskId=${encodeURIComponent(taskId)}`,
          { headers: dealershipHeaders() }
        );
        if (!pollRes.ok) continue;
        const pollData = await pollRes.json();
        if (pollData.status === "completed" && pollData.output?.image_url) {
          setJob(job.angle.id, {
            status: "completed",
            imageUrl: pollData.output.image_url,
          });
          return;
        }
        if (pollData.status === "failed") {
          throw new Error(pollData.error || "Generation failed");
        }
      }
      throw new Error("Timed out");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Generation failed";
      setJob(job.angle.id, { status: "failed", error: msg });
    }
  }

  /** Throttled fan-out: max 3 in flight at once. */
  async function handleGenerateAll() {
    if (!heroImageUrl) {
      toast.error("Upload a hero photo first");
      return;
    }
    if (isGenerating) return;

    cancelledRef.current = false;
    setSavedGalleryId(null);
    setJobs(makeEmptyAngleJobs());
    setIsGenerating(true);

    // Wait for state to settle so the freshly-reset jobs are visible
    await new Promise((r) => setTimeout(r, 0));

    const fresh = makeEmptyAngleJobs();
    const queue = [...fresh];

    async function worker() {
      while (queue.length > 0) {
        const next = queue.shift();
        if (!next) return;
        await runAngle(next);
      }
    }

    await Promise.all(
      Array.from({ length: MAX_CONCURRENT }, () => worker())
    );

    setIsGenerating(false);
  }

  async function handleRetry(angleId: string) {
    const job = jobs.find((j) => j.angle.id === angleId);
    if (!job) return;
    await runAngle(job);
  }

  async function handleSaveGallery() {
    const completed = jobs.filter((j) => j.status === "completed" && j.imageUrl);
    if (completed.length === 0) {
      toast.error("No completed angles to save");
      return;
    }
    if (!heroImageUrl) return;

    const toastId = toast.loading("Saving gallery to library…");
    try {
      const res = await fetch("/api/multi-angle-gallery", {
        method: "POST",
        headers: dealershipHeaders(),
        body: JSON.stringify({
          vehicle_id: vehicleId === "none" ? null : vehicleId,
          showroom_preset_id: showroomId || null,
          source_image_url: heroImageUrl,
          jobs: completed.map((j) => ({
            angle_id: j.angle.id,
            angle_label: j.angle.label,
            image_url: j.imageUrl!,
            prompt: buildAnglePrompt({ angle: j.angle, showroomPresetId: showroomId }),
          })),
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Save failed");
      }
      const data = await res.json();
      setSavedGalleryId(data.gallery_id);
      toast.success(`Saved ${completed.length} angles to library`, { id: toastId });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Save failed";
      toast.error(msg, { id: toastId });
    }
  }

  function handleDownloadAngle(job: AngleJob) {
    if (!job.imageUrl) return;
    window.open(job.imageUrl, "_blank");
  }

  function handleStartOver() {
    cancelledRef.current = true;
    setJobs(makeEmptyAngleJobs());
    setHeroImageUrl(null);
    setSavedGalleryId(null);
    setIsGenerating(false);
  }

  const completedCount = jobs.filter((j) => j.status === "completed").length;
  const allDone = completedCount === ANGLE_PROMPTS.length;
  const anyDone = completedCount > 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="font-heading text-2xl font-bold flex items-center gap-2">
          <Sparkles className="h-6 w-6 text-primary" />
          Multi-Angle Gallery
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Upload one hero photo. We generate 8 photoreal angles in the showroom of your choice — front, rear, profiles, close-ups.
        </p>
      </div>

      {/* Setup card */}
      <Card className="glass">
        <CardHeader>
          <CardTitle className="text-base">Configure</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-xs">Location / backdrop</Label>
              <Select value={showroomId} onValueChange={(v) => setShowroomId(v ?? "")}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="max-h-[60vh]">
                  {LOCATION_SECTIONS.map((section) => (
                    <SelectGroup key={section.label}>
                      <SelectLabel className="text-[10px] uppercase tracking-wider text-muted-foreground">
                        {section.label}
                      </SelectLabel>
                      {section.presets.map((p) => (
                        <SelectItem key={p.id} value={p.id}>
                          {p.emoji} {p.label}
                          <span className="text-muted-foreground"> — {p.description}</span>
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-xs">Bind to vehicle (optional)</Label>
              <Select value={vehicleId} onValueChange={(v) => setVehicleId(v ?? "none")}>
                <SelectTrigger>
                  <SelectValue placeholder="No vehicle binding" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No vehicle binding</SelectItem>
                  {vehicles.slice(0, 50).map((v) => (
                    <SelectItem key={v.id} value={v.id}>
                      {v.year} {v.make} {v.model} {v.trim || ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Hero photo upload */}
          <div className="space-y-2">
            <Label className="text-xs">Hero photo</Label>
            {heroImageUrl ? (
              <div className="flex items-start gap-3">
                <div className="relative w-32 h-32 rounded-lg overflow-hidden border border-border bg-muted">
                  <img
                    src={heroImageUrl}
                    alt="Hero"
                    className="w-full h-full object-cover"
                  />
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setHeroImageUrl(null)}
                  disabled={isGenerating}
                >
                  <X className="h-3.5 w-3.5 mr-1.5" />
                  Replace
                </Button>
              </div>
            ) : (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-border rounded-lg p-8 text-center cursor-pointer hover:border-primary/40 hover:bg-muted/30 transition-colors"
              >
                {uploading ? (
                  <div className="flex flex-col items-center gap-2">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                    <p className="text-sm text-muted-foreground">Uploading…</p>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-2">
                    <Upload className="h-8 w-8 text-muted-foreground/60" />
                    <p className="text-sm font-medium">Click to upload hero photo</p>
                    <p className="text-xs text-muted-foreground">
                      JPG, PNG, or WebP. Ideally a clean 3/4 front shot of the vehicle.
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

          {/* Action buttons */}
          <div className="flex gap-2 pt-2">
            <Button
              onClick={handleGenerateAll}
              disabled={!heroImageUrl || isGenerating}
              className="gradient-primary text-white"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
                  Generating {completedCount}/{ANGLE_PROMPTS.length}…
                </>
              ) : (
                <>
                  <Wand2 className="h-4 w-4 mr-1.5" />
                  Generate 8 Angles
                </>
              )}
            </Button>

            {anyDone && !isGenerating && (
              <Button
                variant="outline"
                onClick={handleSaveGallery}
                disabled={!anyDone || !!savedGalleryId}
              >
                {savedGalleryId ? (
                  <>
                    <Sparkles className="h-4 w-4 mr-1.5 text-green-500" />
                    Saved
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-1.5" />
                    Save {completedCount} to Library
                  </>
                )}
              </Button>
            )}

            {(anyDone || heroImageUrl) && !isGenerating && (
              <Button variant="ghost" onClick={handleStartOver}>
                <X className="h-4 w-4 mr-1.5" />
                Start over
              </Button>
            )}

            {savedGalleryId && (
              <Button
                variant="ghost"
                onClick={() => router.push("/dashboard/library")}
              >
                <ImageIcon className="h-4 w-4 mr-1.5" />
                View in Library
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Angle grid */}
      <Card className="glass">
        <CardHeader>
          <CardTitle className="text-base flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Camera className="h-4 w-4" />
              Angles
            </span>
            {allDone && (
              <span className="text-xs font-normal text-green-600 dark:text-green-500">
                All 8 angles ready
              </span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <AngleGrid
            jobs={jobs}
            onRetry={!isGenerating ? handleRetry : undefined}
            onDownload={handleDownloadAngle}
          />
        </CardContent>
      </Card>
    </div>
  );
}
