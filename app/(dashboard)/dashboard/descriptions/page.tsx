"use client";

import { useMemo, useState } from "react";
import { FileText, Sparkles, Copy, Loader2, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { VehicleSelector } from "@/components/create/VehicleSelector";
import { useAppStore } from "@/lib/store";
import { parseInlineVehicleId } from "@/lib/common-vehicle-presets";
import type { Vehicle } from "@/lib/types";
import { toast } from "sonner";

type DescFormat = "website" | "marketplace" | "social";
type DescLength = "short" | "standard" | "detailed";
type DescTone = "professional" | "friendly" | "luxury" | "energetic";
type Platform = "facebook" | "instagram" | "x";

const FORMATS: { value: DescFormat; label: string; desc: string }[] = [
  { value: "website", label: "Website / VDP", desc: "Polished detail-page copy" },
  { value: "marketplace", label: "Marketplace", desc: "Cars.com / AutoTrader style" },
  { value: "social", label: "Social blurb", desc: "Short, scroll-stopping" },
];
const LENGTHS: { value: DescLength; label: string }[] = [
  { value: "short", label: "Short" },
  { value: "standard", label: "Standard" },
  { value: "detailed", label: "Detailed" },
];
const TONES: { value: DescTone; label: string }[] = [
  { value: "professional", label: "Professional" },
  { value: "friendly", label: "Friendly" },
  { value: "luxury", label: "Luxury" },
  { value: "energetic", label: "Energetic" },
];
const PLATFORMS: { value: Platform; label: string }[] = [
  { value: "facebook", label: "Facebook" },
  { value: "instagram", label: "Instagram" },
  { value: "x", label: "X / Twitter" },
];

export default function DescriptionsPage() {
  const { dealership, vehicles } = useAppStore();

  // vehicle selection
  const [vehicleId, setVehicleId] = useState<string | undefined>(undefined);

  // description options
  const [format, setFormat] = useState<DescFormat>("website");
  const [length, setLength] = useState<DescLength>("standard");
  const [tone, setTone] = useState<DescTone>("professional");
  const [highlights, setHighlights] = useState("");
  const [includePrice, setIncludePrice] = useState(false);

  // results
  const [description, setDescription] = useState("");
  const [descBusy, setDescBusy] = useState(false);

  // social
  const [platform, setPlatform] = useState<Platform>("instagram");
  const [includeHashtags, setIncludeHashtags] = useState(true);
  const [includeEmoji, setIncludeEmoji] = useState(true);
  const [caption, setCaption] = useState("");
  const [capBusy, setCapBusy] = useState(false);

  // Resolve the selected id to a vehicle-like object (inventory row OR manual entry).
  const vehicle = useMemo<Partial<Vehicle> | null>(() => {
    if (!vehicleId) return null;
    const inv = vehicles.find((v) => v.id === vehicleId);
    if (inv) return inv;
    const parsed = parseInlineVehicleId(vehicleId);
    return parsed ? { year: parsed.year ?? null, make: parsed.make, model: parsed.model, trim: parsed.trim ?? null } : null;
  }, [vehicleId, vehicles]);

  const vehicleLabel = vehicle
    ? [vehicle.year, vehicle.make, vehicle.model, vehicle.trim].filter(Boolean).join(" ")
    : "";

  const generateDescription = async () => {
    if (!vehicle || !(vehicle.make || vehicle.model)) {
      toast.error("Pick or build a vehicle first.");
      return;
    }
    setDescBusy(true);
    try {
      const res = await fetch("/api/vehicle-description", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ vehicle, dealership, format, length, tone, highlights, includePrice }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");
      setDescription(data.description);
      toast.success("Description generated");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to generate");
    } finally {
      setDescBusy(false);
    }
  };

  const generateCaption = async () => {
    if (!description.trim()) {
      toast.error("Generate a description first.");
      return;
    }
    setCapBusy(true);
    try {
      const res = await fetch("/api/social-caption", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ description, dealership, vehicle, platform, includeHashtags, includeEmoji }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");
      setCaption(data.caption);
      toast.success("Social post generated");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to generate");
    } finally {
      setCapBusy(false);
    }
  };

  const copy = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard");
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="font-heading text-2xl font-bold flex items-center gap-2">
          <FileText className="h-6 w-6 text-primary" />
          Vehicle Descriptions
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Generate listing copy for your website or marketplaces — then turn it into a ready-to-post social caption.
        </p>
      </div>

      {/* Step 1 — description */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">1. Describe the vehicle</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <VehicleSelector vehicles={vehicles} value={vehicleId} onChange={setVehicleId} />

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <Label className="text-xs">Format</Label>
              <Select value={format} onValueChange={(v) => setFormat(v as DescFormat)}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {FORMATS.map((f) => (
                    <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Length</Label>
              <Select value={length} onValueChange={(v) => setLength(v as DescLength)}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {LENGTHS.map((l) => (
                    <SelectItem key={l.value} value={l.value}>{l.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Tone</Label>
              <Select value={tone} onValueChange={(v) => setTone(v as DescTone)}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {TONES.map((t) => (
                    <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label htmlFor="highlights" className="text-xs">Highlights to emphasize (optional)</Label>
            <Textarea
              id="highlights"
              rows={2}
              className="mt-1"
              placeholder="e.g. one owner, heated leather seats, towing package, just serviced, remaining factory warranty"
              value={highlights}
              onChange={(e) => setHighlights(e.target.value)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label className="text-sm">Include price</Label>
              <p className="text-xs text-muted-foreground">Mention the listed price in the copy.</p>
            </div>
            <Switch checked={includePrice} onCheckedChange={setIncludePrice} />
          </div>

          <Button onClick={generateDescription} disabled={descBusy}>
            {descBusy ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Sparkles className="h-4 w-4 mr-2" />}
            Generate description
          </Button>
        </CardContent>
      </Card>

      {/* Description output */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm flex items-center justify-between">
            Description {vehicleLabel && <span className="font-normal text-muted-foreground">· {vehicleLabel}</span>}
            <Button size="sm" variant="ghost" disabled={!description} onClick={() => copy(description)}>
              <Copy className="h-3.5 w-3.5" />
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            rows={9}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Your generated description appears here — edit freely before copying."
            className="text-sm"
          />
        </CardContent>
      </Card>

      {/* Step 2 — social post from description */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Share2 className="h-4 w-4 text-primary" />
            2. Create a social post
          </CardTitle>
          <p className="text-xs text-muted-foreground">Built from the description above.</p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <Label className="text-xs">Platform</Label>
              <Select value={platform} onValueChange={(v) => setPlatform(v as Platform)}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {PLATFORMS.map((p) => (
                    <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center justify-between rounded-md border px-3">
              <Label className="text-sm">Hashtags</Label>
              <Switch checked={includeHashtags} onCheckedChange={setIncludeHashtags} />
            </div>
            <div className="flex items-center justify-between rounded-md border px-3">
              <Label className="text-sm">Emoji</Label>
              <Switch checked={includeEmoji} onCheckedChange={setIncludeEmoji} />
            </div>
          </div>

          <Button onClick={generateCaption} disabled={capBusy || !description.trim()} variant="default">
            {capBusy ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Sparkles className="h-4 w-4 mr-2" />}
            Generate social post
          </Button>

          <div className="relative">
            <Textarea
              rows={7}
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="Your social caption appears here — edit freely before posting."
              className="text-sm"
            />
            {caption && (
              <Button
                size="sm"
                variant="ghost"
                className="absolute top-2 right-2"
                onClick={() => copy(caption)}
              >
                <Copy className="h-3.5 w-3.5" />
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
