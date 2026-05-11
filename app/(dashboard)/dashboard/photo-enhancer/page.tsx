"use client";

import { useEffect, useMemo, useState } from "react";
import { Wrench, Upload, Loader2, Download, Save, Check, Car } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAppStore } from "@/lib/store";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";

type EnhancementPreset = {
  id: string;
  label: string;
  emoji: string;
  description: string;
  prompt: string;
};

const PRESETS: EnhancementPreset[] = [
  {
    id: "pro-studio",
    label: "Pro Studio",
    emoji: "📸",
    description: "Lift to dealership-quality studio shot",
    prompt:
      "Remove the existing background. Place the vehicle on a clean seamless light-grey studio backdrop with a soft realistic shadow under the tires. Color-correct the vehicle to remove warm/cool casts, slightly increase contrast, sharpen the details. Professional automotive photography, magazine-quality. Keep the vehicle exactly as-is — do not alter shape, color, wheels, or stickers.",
  },
  {
    id: "showroom",
    label: "Showroom Floor",
    emoji: "🏢",
    description: "Place inside an upscale dealership showroom",
    prompt:
      "Remove the background and place the vehicle inside a modern luxury car dealership showroom with polished floors, dramatic spot lighting, and glass walls in the distance. Realistic floor reflection beneath the vehicle. Keep the vehicle unchanged.",
  },
  {
    id: "sunset-drive",
    label: "Sunset Drive",
    emoji: "🌅",
    description: "Cinematic golden-hour outdoor scene",
    prompt:
      "Replace the background with a wide, scenic open road at golden hour, mountains in the distance, warm sunlight on the vehicle, cinematic lifestyle photography. Subtle motion blur on the road only. Keep the vehicle exactly as photographed.",
  },
  {
    id: "urban",
    label: "Urban Street",
    emoji: "🏙️",
    description: "Modern city block backdrop",
    prompt:
      "Replace the background with a clean modern urban street with subtle reflections of city buildings on the vehicle. Soft overcast natural light. Keep the vehicle unchanged.",
  },
  {
    id: "deshadow",
    label: "De-shadow & Brighten",
    emoji: "💡",
    description: "Lift harsh shadows on the lot",
    prompt:
      "Keep the existing background but evenly light the vehicle: lift harsh shadows under fenders and around wheel wells, recover detail in shadowed panels, balance highlights, and remove any glare or hot spots on glass and paint. Photorealistic.",
  },
  {
    id: "snow-day",
    label: "Snowy Backdrop",
    emoji: "❄️",
    description: "Winter scene for seasonal merchandising",
    prompt:
      "Replace the background with a clean snowy scenic landscape, soft falling snowflakes, wintery natural light. Vehicle stays perfectly clean (no snow on it). Keep the vehicle unchanged.",
  },
  {
    id: "ready-to-deliver",
    label: "Ready-to-Deliver",
    emoji: "🎁",
    description: "Bow-on-roof delivery moment",
    prompt:
      "Place the vehicle in a clean dealership delivery bay with soft warm lighting. Add a tasteful large red ribbon and bow on the roof of the vehicle. Polished concrete floor with subtle reflection. Photorealistic. Keep the vehicle's colors and shape exactly as-is.",
  },
];

export default function PhotoEnhancerPage() {
  const { dealership, vehicles } = useAppStore();
  const [vehicleId, setVehicleId] = useState<string>("");
  const [sourceUrl, setSourceUrl] = useState<string>("");
  const [uploading, setUploading] = useState(false);
  const [presetId, setPresetId] = useState<string>(PRESETS[0].id);
  const [busy, setBusy] = useState(false);
  const [resultUrl, setResultUrl] = useState<string>("");
  const [saving, setSaving] = useState(false);

  const vehicle = useMemo(() => vehicles.find((v) => v.id === vehicleId) || null, [vehicleId, vehicles]);
  const preset = PRESETS.find((p) => p.id === presetId)!;

  // when vehicle changes, default to first photo
  useEffect(() => {
    if (vehicle?.photos?.[0]) setSourceUrl(vehicle.photos[0]);
  }, [vehicle]);

  const handleUpload = async (file: File) => {
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      if (!res.ok) throw new Error("Upload failed");
      const data = await res.json();
      setSourceUrl(data.url);
      setResultUrl("");
      toast.success("Photo uploaded");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const enhance = async () => {
    if (!sourceUrl) {
      toast.error("Pick or upload a vehicle photo first");
      return;
    }
    setBusy(true);
    setResultUrl("");
    try {
      const start = await fetch("/api/edit-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: preset.prompt,
          image_url: sourceUrl,
          image_size: "16:9",
          // Image editing is KIE.ai-only — OpenAI gpt-image-2 only supports generation
          model: "kie-nano-banana",
        }),
      });
      if (!start.ok) throw new Error((await start.json()).error || "Failed to start");
      const { taskId, model } = await start.json();

      // Poll
      const deadline = Date.now() + 5 * 60 * 1000;
      while (Date.now() < deadline) {
        await new Promise((r) => setTimeout(r, 2500));
        const poll = await fetch(`/api/edit-image?taskId=${taskId}&model=${model}`);
        if (!poll.ok) continue;
        const data = await poll.json();
        if (data.status === "completed" && data.output?.image_url) {
          setResultUrl(data.output.image_url);
          toast.success("Photo enhanced");
          return;
        }
        if (data.status === "failed") throw new Error(data.error || "Provider failed");
      }
      throw new Error("Timed out");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Enhance failed");
    } finally {
      setBusy(false);
    }
  };

  const saveToVehicle = async () => {
    if (!resultUrl || !vehicleId || !vehicle) return;
    setSaving(true);
    try {
      const supabase = createClient();
      const newPhotos = [resultUrl, ...(vehicle.photos || [])];
      const { error } = await supabase.from("vehicles").update({ photos: newPhotos, updated_at: new Date().toISOString() }).eq("id", vehicleId);
      if (error) throw error;
      toast.success("Saved as primary photo");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-6xl">
      <div>
        <h1 className="font-heading text-2xl font-bold flex items-center gap-2">
          <Wrench className="h-6 w-6 text-primary" />
          Photo Enhancer
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Lift iPhone lot photos into dealership-quality merchandising shots. Swap backgrounds, fix lighting, de-shadow.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-1">
          <CardContent className="pt-6 space-y-4">
            <div>
              <Label>Source photo</Label>
              <div className="mt-1 flex gap-2">
                <Select value={vehicleId} onValueChange={(v) => setVehicleId(v ?? "")}>
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="Pick from inventory" />
                  </SelectTrigger>
                  <SelectContent>
                    {vehicles.filter((v) => v.photos?.length).map((v) => (
                      <SelectItem key={v.id} value={v.id}>
                        {[v.year, v.make, v.model].filter(Boolean).join(" ")}
                        {v.stock_number ? ` — #${v.stock_number}` : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <label className="mt-2 flex items-center justify-center gap-2 px-3 py-2 border-2 border-dashed rounded-md cursor-pointer text-sm text-muted-foreground hover:border-primary hover:text-primary transition-colors">
                {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                Or upload from phone/camera
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => e.target.files?.[0] && handleUpload(e.target.files[0])}
                />
              </label>
            </div>

            {sourceUrl && (
              <div>
                <Label>Original</Label>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={sourceUrl} alt="" className="mt-1 w-full aspect-video object-cover rounded border" />
              </div>
            )}

            <div>
              <Label>Enhancement preset</Label>
              <div className="mt-2 grid grid-cols-1 gap-1.5 max-h-72 overflow-y-auto">
                {PRESETS.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => setPresetId(p.id)}
                    className={cn(
                      "flex items-start gap-2 p-2 text-left rounded border text-sm transition-colors",
                      p.id === presetId ? "border-primary bg-primary/5" : "border-transparent hover:bg-muted"
                    )}
                  >
                    <span className="text-lg leading-none">{p.emoji}</span>
                    <div className="flex-1">
                      <p className="font-medium">{p.label}</p>
                      <p className="text-xs text-muted-foreground">{p.description}</p>
                    </div>
                    {p.id === presetId && <Check className="h-4 w-4 text-primary mt-0.5" />}
                  </button>
                ))}
              </div>
            </div>

            <Button onClick={enhance} disabled={busy || !sourceUrl} className="w-full">
              {busy ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Enhancing…
                </>
              ) : (
                <>
                  <Wrench className="h-4 w-4 mr-2" /> Enhance Photo
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardContent className="pt-6">
            <Label>Enhanced result</Label>
            {resultUrl ? (
              <>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={resultUrl} alt="" className="mt-2 w-full rounded border" />
                <div className="mt-3 flex gap-2">
                  <a href={resultUrl} download target="_blank" rel="noreferrer" className={buttonVariants({ variant: "outline" })}>
                    <Download className="h-4 w-4 mr-1" /> Download
                  </a>
                  {vehicleId && (
                    <Button onClick={saveToVehicle} disabled={saving}>
                      {saving ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Save className="h-4 w-4 mr-1" />}
                      Save as primary photo
                    </Button>
                  )}
                </div>
              </>
            ) : (
              <div className="mt-2 aspect-video flex flex-col items-center justify-center text-sm text-muted-foreground border-2 border-dashed rounded">
                <Car className="h-12 w-12 opacity-30 mb-2" />
                Pick a source photo + preset, then click Enhance.
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
