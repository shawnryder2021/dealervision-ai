"use client";

import { useState, useEffect } from "react";
import {
  FlaskConical,
  Loader2,
  Download,
  Save,
  RotateCcw,
  Sparkles,
  Check,
  Plus,
  X,
  Trophy,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { VehicleSelector } from "@/components/create/VehicleSelector";
import { ChannelPicker } from "@/components/create/ChannelPicker";
import { useAppStore } from "@/lib/store";
import { isDemoMode } from "@/lib/demo-data";
import { createClient } from "@/lib/supabase/client";
import {
  buildPrompt,
  getAspectRatioForChannel,
  getResolutionForChannel,
} from "@/lib/prompt-templates";
import { CHANNEL_PRESETS } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import type { Vehicle, GeneratedAsset } from "@/lib/types";

interface Variant {
  id: string;
  label: string;
  twist: string;
  status: "idle" | "generating" | "completed" | "failed";
  taskId?: string;
  imageUrl?: string;
  picked?: boolean;
}

const TWIST_PRESETS = [
  { label: "Dramatic lighting", twist: "Use dramatic cinematic lighting with bold contrast and rim lighting" },
  { label: "Soft & warm", twist: "Use soft warm golden hour lighting with a dreamy inviting atmosphere" },
  { label: "Clean & minimal", twist: "Use a clean minimal style with lots of white space and modern design" },
  { label: "Night scene", twist: "Set the scene at night with city lights, neon reflections, and moody atmosphere" },
  { label: "Action shot", twist: "Show the vehicle in motion with speed blur, dynamic angle, and sense of movement" },
  { label: "Overhead angle", twist: "Use a dramatic overhead bird's eye angle looking down at the vehicle" },
  { label: "Close-up detail", twist: "Focus on a close-up detail shot highlighting the grille, headlights, and front design" },
  { label: "Luxury feel", twist: "Style with a luxury premium feel — polished surfaces, elegant backdrop, prestige" },
  { label: "Bold colors", twist: "Use vivid bold saturated colors with high contrast for maximum eye-catching impact" },
  { label: "Vintage film", twist: "Apply a vintage film photography look with warm grain, faded tones, and retro charm" },
  { label: "Urban street", twist: "Place in a gritty urban street setting with graffiti walls, concrete, and raw atmosphere" },
  { label: "Nature backdrop", twist: "Place in lush natural scenery with mountains, trees, and scenic landscape" },
];

export default function ABTestPage() {
  const {
    dealership,
    vehicles: storeVehicles,
    addAsset,
    updateAsset,
  } = useAppStore();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [channel, setChannel] = useState("instagram-post");
  const [vehicleId, setVehicleId] = useState<string | undefined>();
  const [headline, setHeadline] = useState("");
  const [basePrompt, setBasePrompt] = useState("");
  const [variants, setVariants] = useState<Variant[]>([
    { id: "A", label: "Variant A", twist: "", status: "idle" },
    { id: "B", label: "Variant B", twist: "", status: "idle" },
  ]);
  const [isRunning, setIsRunning] = useState(false);

  useEffect(() => {
    if (isDemoMode()) {
      setVehicles(storeVehicles);
      return;
    }
    async function loadVehicles() {
      if (!dealership) return;
      const supabase = createClient();
      const { data } = await supabase
        .from("vehicles")
        .select("*")
        .eq("dealership_id", dealership.id)
        .order("created_at", { ascending: false });
      if (data) setVehicles(data);
    }
    loadVehicles();
  }, [dealership, storeVehicles]);

  function updateVariant(id: string, updates: Partial<Variant>) {
    setVariants((prev) =>
      prev.map((v) => (v.id === id ? { ...v, ...updates } : v))
    );
  }

  function addVariant() {
    if (variants.length >= 4) {
      toast.error("Maximum 4 variants");
      return;
    }
    const labels = ["A", "B", "C", "D"];
    const nextLabel = labels[variants.length];
    setVariants((prev) => [
      ...prev,
      {
        id: nextLabel,
        label: `Variant ${nextLabel}`,
        twist: "",
        status: "idle",
      },
    ]);
  }

  function removeVariant(id: string) {
    if (variants.length <= 2) {
      toast.error("Need at least 2 variants");
      return;
    }
    setVariants((prev) => prev.filter((v) => v.id !== id));
  }

  function applyPreset(variantId: string, twist: string) {
    updateVariant(variantId, { twist });
  }

  function buildVariantPrompt(twist: string): string {
    if (!dealership) return "";
    const vehicle = vehicleId
      ? vehicles.find((v) => v.id === vehicleId)
      : null;

    const prompt = buildPrompt({
      content_type: "vehicle-spotlight",
      channel,
      dealership,
      vehicle: vehicle || null,
      headline,
      subheadline: "",
      cta: "",
      style: "photorealistic",
      custom_prompt: basePrompt,
    });

    // Append the variant twist
    return `${prompt}\n\nSTYLE VARIATION: ${twist}`;
  }

  async function handleGenerate() {
    if (!dealership) {
      toast.error("Set up your dealership profile first");
      return;
    }

    const emptyTwists = variants.filter((v) => !v.twist.trim());
    if (emptyTwists.length > 0) {
      toast.error("Give each variant a style twist");
      return;
    }

    setIsRunning(true);

    // Reset all variants
    setVariants((prev) =>
      prev.map((v) => ({
        ...v,
        status: "generating",
        imageUrl: undefined,
        picked: false,
      }))
    );

    const aspectRatio = getAspectRatioForChannel(channel);
    const resolution = getResolutionForChannel(channel);

    // Fire all variants in parallel
    for (const variant of variants) {
      const prompt = buildVariantPrompt(variant.twist);

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
          updateVariant(variant.id, { status: "failed" });
          continue;
        }

        const { taskId } = await res.json();
        updateVariant(variant.id, { taskId });
        pollVariant(variant.id, taskId, aspectRatio);
      } catch {
        updateVariant(variant.id, { status: "failed" });
      }
    }
  }

  async function pollVariant(
    variantId: string,
    taskId: string,
    aspectRatio: string
  ) {
    const maxAttempts = 60;
    let attempts = 0;

    const poll = async () => {
      attempts++;
      try {
        const res = await fetch(`/api/demo-generate?taskId=${taskId}`);
        if (!res.ok) {
          if (attempts < maxAttempts) setTimeout(poll, 3000);
          return;
        }
        const data = await res.json();

        if (
          data.status === "completed" &&
          (data.output?.image_url || data.output?.url)
        ) {
          const imageUrl = data.output.image_url || data.output.url;
          updateVariant(variantId, { status: "completed", imageUrl });

          // Add to library
          const asset: GeneratedAsset = {
            id: `ab-${variantId}-${Date.now()}`,
            dealership_id: dealership!.id,
            created_by: null,
            vehicle_id: vehicleId || null,
            content_type: "ab-test",
            channel,
            prompt: "",
            image_url: imageUrl,
            storage_path: null,
            aspect_ratio: aspectRatio,
            resolution: "1K",
            kie_task_id: taskId,
            status: "completed",
            metadata: { variant: variantId },
            is_favorite: false,
            campaign: null,
            created_at: new Date().toISOString(),
          };
          addAsset(asset);

          // Check if all done
          checkAllDone();
          return;
        }

        if (data.status === "failed") {
          updateVariant(variantId, { status: "failed" });
          checkAllDone();
          return;
        }

        if (attempts < maxAttempts) {
          setTimeout(poll, 3000);
        } else {
          updateVariant(variantId, { status: "failed" });
          checkAllDone();
        }
      } catch {
        if (attempts < maxAttempts) setTimeout(poll, 5000);
      }
    };

    setTimeout(poll, 3000);
  }

  function checkAllDone() {
    setVariants((prev) => {
      const allDone = prev.every(
        (v) => v.status === "completed" || v.status === "failed"
      );
      if (allDone) {
        setIsRunning(false);
        toast.success("All variants generated!");
      }
      return prev;
    });
  }

  function pickWinner(id: string) {
    setVariants((prev) =>
      prev.map((v) => ({ ...v, picked: v.id === id }))
    );
    toast.success(`Variant ${id} selected as winner!`);
  }

  async function handleDownload(imageUrl: string, variantId: string) {
    try {
      const proxyUrl = `/api/download-proxy?url=${encodeURIComponent(imageUrl)}`;
      const res = await fetch(proxyUrl);
      if (!res.ok) throw new Error("Download failed");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `variant-${variantId}-${Date.now()}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success("Downloaded!");
    } catch {
      toast.error("Download failed");
    }
  }

  function handleReset() {
    setVariants((prev) =>
      prev.map((v) => ({
        ...v,
        status: "idle",
        imageUrl: undefined,
        picked: false,
      }))
    );
    setIsRunning(false);
  }

  const anyCompleted = variants.some((v) => v.status === "completed");
  const allIdle = variants.every((v) => v.status === "idle");

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="font-heading text-2xl font-bold flex items-center gap-2">
          <FlaskConical className="h-6 w-6 text-primary" />
          A/B Variant Generator
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Generate 2-4 variations of the same concept — compare and pick the
          best
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left — Setup */}
        <div className="space-y-5">
          {/* Base Settings */}
          <div className="rounded-xl border border-border bg-card p-4 space-y-4">
            <Label className="text-sm font-semibold">Base Settings</Label>

            <div className="space-y-2">
              <Label className="text-xs">Channel</Label>
              <ChannelPicker value={channel} onChange={setChannel} />
            </div>

            <div className="space-y-2">
              <Label className="text-xs">Vehicle (optional)</Label>
              <VehicleSelector
                vehicles={vehicles}
                value={vehicleId}
                onChange={setVehicleId}
              />
            </div>

            <div className="space-y-2">
              <Label className="text-xs">Headline (optional)</Label>
              <Input
                value={headline}
                onChange={(e) => setHeadline(e.target.value)}
                placeholder="e.g., Summer Sale"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-xs">Additional prompt (optional)</Label>
              <Textarea
                value={basePrompt}
                onChange={(e) => setBasePrompt(e.target.value)}
                placeholder="Extra details to include in all variants..."
                rows={2}
              />
            </div>
          </div>

          {/* Variant Twists */}
          <div className="rounded-xl border border-border bg-card p-4 space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-semibold">
                Variant Styles ({variants.length})
              </Label>
              {variants.length < 4 && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={addVariant}
                  className="h-7 text-xs"
                >
                  <Plus className="h-3 w-3 mr-1" />
                  Add
                </Button>
              )}
            </div>

            {variants.map((v, i) => (
              <div key={v.id} className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold flex items-center gap-1.5">
                    <span
                      className={cn(
                        "inline-flex items-center justify-center h-5 w-5 rounded-full text-[10px] font-bold",
                        v.picked
                          ? "bg-green-500 text-white"
                          : "bg-primary/10 text-primary"
                      )}
                    >
                      {v.id}
                    </span>
                    {v.label}
                  </span>
                  {variants.length > 2 && (
                    <button
                      onClick={() => removeVariant(v.id)}
                      className="text-muted-foreground hover:text-destructive"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  )}
                </div>
                <Textarea
                  value={v.twist}
                  onChange={(e) =>
                    updateVariant(v.id, { twist: e.target.value })
                  }
                  placeholder={`Style twist for Variant ${v.id}...`}
                  rows={2}
                  disabled={isRunning}
                  className="text-xs"
                />
              </div>
            ))}
          </div>

          {/* Quick Twist Presets */}
          <div className="rounded-xl border border-border bg-card p-4 space-y-3">
            <Label className="text-sm font-semibold">Quick Style Presets</Label>
            <p className="text-[10px] text-muted-foreground">
              Click a preset, then click a variant to apply it
            </p>
            <div className="flex flex-wrap gap-1.5">
              {TWIST_PRESETS.map((tp) => (
                <div key={tp.label} className="relative group">
                  <span className="px-2.5 py-1 text-[10px] rounded-full border border-border bg-muted/30 hover:bg-primary/10 hover:border-primary/30 transition-colors cursor-pointer inline-block">
                    {tp.label}
                  </span>
                  {/* Dropdown to pick which variant */}
                  <div className="absolute top-full left-0 mt-1 hidden group-hover:flex gap-1 z-10 bg-card border border-border rounded-md p-1 shadow-lg">
                    {variants.map((v) => (
                      <button
                        key={v.id}
                        onClick={() => applyPreset(v.id, tp.twist)}
                        className="px-2 py-1 text-[10px] font-bold rounded hover:bg-primary/10 text-primary"
                      >
                        {v.id}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Generate Button */}
          <Button
            onClick={allIdle ? handleGenerate : handleReset}
            disabled={isRunning}
            size="lg"
            className={cn(
              "w-full h-11",
              allIdle
                ? "gradient-primary text-white"
                : "bg-muted text-foreground"
            )}
          >
            {isRunning ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Generating {variants.length} Variants...
              </>
            ) : allIdle ? (
              <>
                <Sparkles className="h-4 w-4 mr-2" />
                Generate {variants.length} Variants
              </>
            ) : (
              <>
                <RotateCcw className="h-4 w-4 mr-2" />
                Reset & Start Over
              </>
            )}
          </Button>
        </div>

        {/* Right — Results Grid */}
        <div className="lg:col-span-2">
          {allIdle && !isRunning ? (
            <div className="rounded-xl border border-dashed border-border bg-muted/10 p-12 flex flex-col items-center justify-center text-center h-full min-h-[400px]">
              <FlaskConical className="h-16 w-16 text-muted-foreground/30 mb-4" />
              <h3 className="text-lg font-semibold mb-1">
                Set Up Your A/B Test
              </h3>
              <p className="text-sm text-muted-foreground max-w-md">
                Choose a vehicle and channel, give each variant a unique style
                twist, then generate them all at once. Compare side-by-side and
                pick the winner.
              </p>
              <p className="text-xs text-muted-foreground/60 mt-3">
                Uses 8 credits per variant
              </p>
            </div>
          ) : (
            <div
              className={cn(
                "grid gap-4",
                variants.length <= 2
                  ? "grid-cols-1 sm:grid-cols-2"
                  : "grid-cols-2"
              )}
            >
              {variants.map((v) => (
                <Card
                  key={v.id}
                  className={cn(
                    "overflow-hidden transition-all",
                    v.picked && "ring-2 ring-green-500 border-green-500"
                  )}
                >
                  {/* Image Area */}
                  <div className="relative aspect-square bg-muted/20 flex items-center justify-center">
                    {v.status === "generating" ? (
                      <div className="flex flex-col items-center gap-3">
                        <Loader2 className="h-10 w-10 animate-spin text-primary" />
                        <div className="text-center">
                          <p className="text-sm font-medium">
                            Generating {v.label}...
                          </p>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            15-30 seconds
                          </p>
                        </div>
                      </div>
                    ) : v.status === "completed" && v.imageUrl ? (
                      <>
                        <img
                          src={v.imageUrl}
                          alt={v.label}
                          className="w-full h-full object-cover"
                        />
                        {v.picked && (
                          <div className="absolute top-2 left-2">
                            <Badge className="bg-green-500 text-white border-0">
                              <Trophy className="h-3 w-3 mr-1" />
                              Winner
                            </Badge>
                          </div>
                        )}
                      </>
                    ) : v.status === "failed" ? (
                      <div className="text-center">
                        <p className="text-sm font-medium text-destructive">
                          Failed
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Try again
                        </p>
                      </div>
                    ) : null}
                  </div>

                  {/* Card Footer */}
                  <CardContent className="p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <span
                          className={cn(
                            "inline-flex items-center justify-center h-5 w-5 rounded-full text-[10px] font-bold",
                            v.picked
                              ? "bg-green-500 text-white"
                              : "bg-primary/10 text-primary"
                          )}
                        >
                          {v.id}
                        </span>
                        <span className="text-xs font-semibold">
                          {v.label}
                        </span>
                      </div>
                      {v.status === "completed" && (
                        <Badge
                          variant="secondary"
                          className="text-[10px] h-5"
                        >
                          <Check className="h-2.5 w-2.5 mr-0.5" /> Done
                        </Badge>
                      )}
                    </div>

                    <p className="text-[10px] text-muted-foreground line-clamp-2">
                      {v.twist || "No twist set"}
                    </p>

                    {v.status === "completed" && v.imageUrl && (
                      <div className="flex items-center gap-1.5 pt-1">
                        <Button
                          size="sm"
                          variant={v.picked ? "default" : "outline"}
                          onClick={() => pickWinner(v.id)}
                          className={cn(
                            "h-7 text-[11px] flex-1",
                            v.picked &&
                              "bg-green-500 hover:bg-green-600 text-white"
                          )}
                        >
                          <Trophy className="h-3 w-3 mr-1" />
                          {v.picked ? "Winner!" : "Pick"}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() =>
                            handleDownload(v.imageUrl!, v.id)
                          }
                          className="h-7 text-[11px]"
                        >
                          <Download className="h-3 w-3" />
                        </Button>
                      </div>
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
