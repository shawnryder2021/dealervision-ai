"use client";

import { useState, useRef, useCallback } from "react";
import {
  Layers,
  Play,
  CheckCircle2,
  XCircle,
  Loader2,
  Clock,
  Download,
  CheckSquare,
  Square,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useAppStore } from "@/lib/store";
import { isDemoMode } from "@/lib/demo-data";
import {
  buildPrompt,
  getAspectRatioForChannel,
  getResolutionForChannel,
} from "@/lib/prompt-templates";
import {
  CONTENT_TYPES,
  CHANNEL_PRESETS,
  STYLE_OPTIONS,
} from "@/lib/constants";
import { addActivityEvent } from "@/lib/activity";
import type { GeneratedAsset } from "@/lib/types";
import { toast } from "sonner";

interface BatchJob {
  vehicleId: string;
  vehicleName: string;
  status: "queued" | "generating" | "completed" | "failed";
  taskId?: string;
  imageUrl?: string;
  assetId?: string;
}

const MAX_CONCURRENT = 3;

export default function BatchGeneratePage() {
  const { dealership, vehicles, addAsset, updateAsset } = useAppStore();
  const [contentType, setContentType] = useState("vehicle-spotlight");
  const [channel, setChannel] = useState("instagram-post");
  const [style, setStyle] = useState("photorealistic");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(
    new Set(vehicles.map((v) => v.id))
  );
  const [jobs, setJobs] = useState<BatchJob[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const jobsRef = useRef<BatchJob[]>([]);

  const toggleVehicle = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectAll = () => setSelectedIds(new Set(vehicles.map((v) => v.id)));
  const deselectAll = () => setSelectedIds(new Set());

  const updateJob = useCallback(
    (vehicleId: string, updates: Partial<BatchJob>) => {
      setJobs((prev) => {
        const next = prev.map((j) =>
          j.vehicleId === vehicleId ? { ...j, ...updates } : j
        );
        jobsRef.current = next;
        return next;
      });
    },
    []
  );

  async function pollJob(job: BatchJob, taskId: string) {
    let attempts = 0;
    const maxAttempts = 60;

    const poll = async () => {
      attempts++;
      try {
        const res = await fetch(`/api/demo-generate?taskId=${taskId}`);
        if (!res.ok) {
          if (attempts < maxAttempts) return setTimeout(poll, 3000);
          return;
        }
        const data = await res.json();

        if (
          data.status === "completed" &&
          (data.output?.image_url || data.output?.url)
        ) {
          const imageUrl = data.output.image_url || data.output.url;
          updateJob(job.vehicleId, { status: "completed", imageUrl });

          const asset: GeneratedAsset = {
            id: `batch-${Date.now()}-${job.vehicleId}`,
            dealership_id: dealership!.id,
            created_by: null,
            vehicle_id: job.vehicleId,
            content_type: contentType,
            channel,
            prompt: "",
            image_url: imageUrl,
            storage_path: null,
            aspect_ratio: getAspectRatioForChannel(channel),
            resolution: getResolutionForChannel(channel),
            kie_task_id: taskId,
            status: "completed",
            metadata: { batch: true },
            is_favorite: false,
            campaign: "Batch Generate",
            created_at: new Date().toISOString(),
          };
          addAsset(asset);
          return;
        }

        if (data.status === "failed") {
          updateJob(job.vehicleId, { status: "failed" });
          return;
        }

        if (attempts < maxAttempts) {
          setTimeout(poll, 3000);
        } else {
          updateJob(job.vehicleId, { status: "failed" });
        }
      } catch {
        if (attempts < maxAttempts) setTimeout(poll, 5000);
        else updateJob(job.vehicleId, { status: "failed" });
      }
    };

    setTimeout(poll, 3000);
  }

  async function processJob(job: BatchJob) {
    if (!dealership) return;

    updateJob(job.vehicleId, { status: "generating" });

    const vehicle = vehicles.find((v) => v.id === job.vehicleId) || null;
    const prompt = buildPrompt({
      content_type: contentType,
      channel,
      dealership,
      vehicle,
      style,
    });

    const aspectRatio = getAspectRatioForChannel(channel);
    const resolution = getResolutionForChannel(channel);

    try {
      const res = await fetch("/api/demo-generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt,
          aspect_ratio: aspectRatio,
          resolution,
        }),
      });

      if (!res.ok) {
        updateJob(job.vehicleId, { status: "failed" });
        return;
      }

      const { taskId } = await res.json();
      updateJob(job.vehicleId, { taskId });
      await pollJob(job, taskId);
    } catch {
      updateJob(job.vehicleId, { status: "failed" });
    }
  }

  async function handleGenerate() {
    if (!dealership || selectedIds.size === 0) return;

    const newJobs: BatchJob[] = vehicles
      .filter((v) => selectedIds.has(v.id))
      .map((v) => ({
        vehicleId: v.id,
        vehicleName: `${v.year} ${v.make} ${v.model} ${v.trim || ""}`.trim(),
        status: "queued" as const,
      }));

    setJobs(newJobs);
    jobsRef.current = newJobs;
    setIsRunning(true);

    // Concurrency-limited queue
    let running = 0;
    let index = 0;
    let completed = 0;

    await new Promise<void>((resolve) => {
      function next() {
        while (running < MAX_CONCURRENT && index < newJobs.length) {
          running++;
          const job = newJobs[index++];
          processJob(job).finally(() => {
            running--;
            completed++;
            if (completed >= newJobs.length) resolve();
            else next();
          });
        }
      }
      next();
    });

    setIsRunning(false);

    const completedCount = jobsRef.current.filter(
      (j) => j.status === "completed"
    ).length;

    addActivityEvent({
      dealership_id: dealership.id,
      user_id: "demo-user-001",
      user_name: "Demo User",
      action: "generated_image",
      entity_type: "asset",
      details: {
        content_type: contentType,
        channel,
        batch_size: newJobs.length,
        completed: completedCount,
      },
    });

    toast.success(
      `Batch complete! ${completedCount}/${newJobs.length} images generated.`
    );
  }

  async function handleDownload(imageUrl: string, name: string) {
    try {
      const res = await fetch(
        `/api/download-proxy?url=${encodeURIComponent(imageUrl)}`
      );
      if (!res.ok) throw new Error();
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${name.replace(/\s+/g, "-").toLowerCase()}-${Date.now()}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch {
      toast.error("Download failed");
    }
  }

  const completedCount = jobs.filter((j) => j.status === "completed").length;
  const failedCount = jobs.filter((j) => j.status === "failed").length;
  const progress =
    jobs.length > 0
      ? ((completedCount + failedCount) / jobs.length) * 100
      : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-heading font-bold tracking-tight flex items-center gap-2">
          <Layers className="h-6 w-6 text-primary" />
          Batch Generate
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          Generate marketing visuals for multiple vehicles at once
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Settings */}
        <div className="space-y-4">
          {/* Content Type */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Content Type</CardTitle>
            </CardHeader>
            <CardContent>
              <select
                value={contentType}
                onChange={(e) => setContentType(e.target.value)}
                className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                disabled={isRunning}
              >
                {CONTENT_TYPES.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </CardContent>
          </Card>

          {/* Channel */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Channel</CardTitle>
            </CardHeader>
            <CardContent>
              <select
                value={channel}
                onChange={(e) => setChannel(e.target.value)}
                className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                disabled={isRunning}
              >
                {CHANNEL_PRESETS.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.aspectRatio})
                  </option>
                ))}
              </select>
            </CardContent>
          </Card>

          {/* Style */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Style</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-2">
                {STYLE_OPTIONS.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => !isRunning && setStyle(s.id)}
                    className={`rounded-lg border px-3 py-2 text-xs font-medium transition-all ${
                      style === s.id
                        ? "border-primary bg-primary/10 text-primary"
                        : "hover:border-primary/30"
                    }`}
                    disabled={isRunning}
                  >
                    {s.name}
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Vehicle Selection */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm">
                  Vehicles ({selectedIds.size}/{vehicles.length})
                </CardTitle>
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 text-[10px] px-2"
                    onClick={selectAll}
                    disabled={isRunning}
                  >
                    All
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 text-[10px] px-2"
                    onClick={deselectAll}
                    disabled={isRunning}
                  >
                    None
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-1.5 max-h-60 overflow-y-auto">
                {vehicles.map((v) => {
                  const name =
                    `${v.year} ${v.make} ${v.model} ${v.trim || ""}`.trim();
                  const checked = selectedIds.has(v.id);
                  return (
                    <button
                      key={v.id}
                      onClick={() => !isRunning && toggleVehicle(v.id)}
                      className={`flex items-center gap-2 w-full rounded-md px-2 py-1.5 text-sm transition-colors ${
                        checked
                          ? "bg-primary/10"
                          : "hover:bg-muted"
                      }`}
                      disabled={isRunning}
                    >
                      {checked ? (
                        <CheckSquare className="h-3.5 w-3.5 text-primary shrink-0" />
                      ) : (
                        <Square className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                      )}
                      <span className="truncate text-left">{name}</span>
                      {v.price && (
                        <span className="text-xs text-muted-foreground ml-auto shrink-0">
                          ${v.price.toLocaleString()}
                        </span>
                      )}
                    </button>
                  );
                })}
                {vehicles.length === 0 && (
                  <p className="text-xs text-muted-foreground text-center py-4">
                    No vehicles in inventory
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Generate Button */}
          <Button
            className="w-full gradient-primary text-white gap-2"
            onClick={handleGenerate}
            disabled={isRunning || selectedIds.size === 0 || !dealership}
          >
            {isRunning ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Play className="h-4 w-4" />
                Generate All ({selectedIds.size} vehicles)
              </>
            )}
          </Button>
        </div>

        {/* Right: Results */}
        <div className="lg:col-span-2 space-y-4">
          {/* Progress bar */}
          {jobs.length > 0 && (
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-medium">
                    {isRunning ? "Generating..." : "Complete"}
                  </p>
                  <div className="flex items-center gap-3 text-xs">
                    <span className="flex items-center gap-1 text-green-600">
                      <CheckCircle2 className="h-3 w-3" />
                      {completedCount}
                    </span>
                    {failedCount > 0 && (
                      <span className="flex items-center gap-1 text-red-500">
                        <XCircle className="h-3 w-3" />
                        {failedCount}
                      </span>
                    )}
                    <span className="text-muted-foreground">
                      {completedCount + failedCount}/{jobs.length}
                    </span>
                  </div>
                </div>
                <Progress value={progress} className="h-2" />
              </CardContent>
            </Card>
          )}

          {/* Job cards */}
          {jobs.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <Layers className="h-12 w-12 text-muted-foreground/20 mx-auto mb-4" />
                <h3 className="font-semibold mb-1">
                  Select vehicles and click Generate
                </h3>
                <p className="text-sm text-muted-foreground">
                  Each vehicle will get a{" "}
                  {CONTENT_TYPES.find((t) => t.id === contentType)?.name.toLowerCase() ||
                    "visual"}{" "}
                  for{" "}
                  {CHANNEL_PRESETS.find((c) => c.id === channel)?.name || channel}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
              {jobs.map((job) => (
                <Card
                  key={job.vehicleId}
                  className={`overflow-hidden transition-all ${
                    job.status === "completed"
                      ? "border-green-500/30"
                      : job.status === "failed"
                      ? "border-red-500/30"
                      : ""
                  }`}
                >
                  {/* Image area */}
                  <div className="relative aspect-square bg-muted">
                    {job.imageUrl ? (
                      <img
                        src={job.imageUrl}
                        alt={job.vehicleName}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center">
                        {job.status === "generating" ? (
                          <Loader2 className="h-8 w-8 animate-spin text-primary/40" />
                        ) : job.status === "queued" ? (
                          <Clock className="h-8 w-8 text-muted-foreground/30" />
                        ) : (
                          <XCircle className="h-8 w-8 text-red-400/50" />
                        )}
                      </div>
                    )}
                    {/* Status badge */}
                    <div className="absolute top-2 right-2">
                      <Badge
                        variant="secondary"
                        className={`text-[10px] ${
                          job.status === "completed"
                            ? "bg-green-500/20 text-green-600"
                            : job.status === "generating"
                            ? "bg-blue-500/20 text-blue-600"
                            : job.status === "failed"
                            ? "bg-red-500/20 text-red-600"
                            : "bg-muted"
                        }`}
                      >
                        {job.status === "generating" && (
                          <Loader2 className="h-2.5 w-2.5 mr-1 animate-spin" />
                        )}
                        {job.status}
                      </Badge>
                    </div>
                  </div>
                  <CardContent className="p-3">
                    <p className="text-xs font-medium truncate">
                      {job.vehicleName}
                    </p>
                    {job.status === "completed" && job.imageUrl && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 text-[10px] px-2 mt-1 gap-1"
                        onClick={() =>
                          handleDownload(job.imageUrl!, job.vehicleName)
                        }
                      >
                        <Download className="h-2.5 w-2.5" />
                        Download
                      </Button>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
