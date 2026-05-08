"use client";

import { useState } from "react";
import {
  ScanBarcode,
  Search,
  Loader2,
  Car,
  Wand2,
  Download,
  RotateCw,
  Fuel,
  Cog,
  Gauge,
  DoorOpen,
  Paintbrush,
  MapPin,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ChannelPicker } from "@/components/create/ChannelPicker";
import { StyleOptions } from "@/components/create/StyleOptions";
import { useAppStore } from "@/lib/store";
import { isDemoMode } from "@/lib/demo-data";
import { buildPrompt, getAspectRatioForChannel, getResolutionForChannel } from "@/lib/prompt-templates";
import { SCENE_PRESETS, SCENE_CATEGORIES } from "@/lib/scene-presets";
import type { DecodedVehicle } from "@/lib/vin-decoder";
import type { GeneratedAsset, Vehicle } from "@/lib/types";
import { toast } from "sonner";

const VEHICLE_COLORS = [
  { value: "Black", label: "Black", hex: "#1a1a1a" },
  { value: "White", label: "White", hex: "#f5f5f5" },
  { value: "Silver", label: "Silver", hex: "#c0c0c0" },
  { value: "Gray", label: "Gray", hex: "#808080" },
  { value: "Red", label: "Red", hex: "#cc0000" },
  { value: "Blue", label: "Blue", hex: "#003399" },
  { value: "Dark Blue", label: "Dark Blue", hex: "#001a4d" },
  { value: "Light Blue", label: "Light Blue", hex: "#5b9bd5" },
  { value: "Green", label: "Green", hex: "#2d6a2e" },
  { value: "Dark Green", label: "Dark Green", hex: "#1a4d1a" },
  { value: "Brown", label: "Brown", hex: "#6b3a2a" },
  { value: "Beige", label: "Beige", hex: "#d4c5a9" },
  { value: "Gold", label: "Gold", hex: "#b8860b" },
  { value: "Orange", label: "Orange", hex: "#e65c00" },
  { value: "Yellow", label: "Yellow", hex: "#e6c700" },
  { value: "Purple", label: "Purple", hex: "#5c2d91" },
  { value: "Burgundy", label: "Burgundy", hex: "#6b1c2a" },
  { value: "Champagne", label: "Champagne", hex: "#e8d5b7" },
  { value: "Pearl White", label: "Pearl White", hex: "#f0ead6" },
  { value: "Midnight Black", label: "Midnight Black", hex: "#0d0d0d" },
  { value: "Gunmetal Gray", label: "Gunmetal Gray", hex: "#53565a" },
  { value: "Ice Blue", label: "Ice Blue", hex: "#a0c4e8" },
  { value: "Racing Red", label: "Racing Red", hex: "#d50000" },
  { value: "Forest Green", label: "Forest Green", hex: "#254d25" },
  { value: "Sunset Orange", label: "Sunset Orange", hex: "#ff6f3c" },
];

export default function VinDecoderPage() {
  const { dealership, addAsset, updateAsset } = useAppStore();

  const [vin, setVin] = useState("");
  const [decoded, setDecoded] = useState<DecodedVehicle | null>(null);
  const [isDecoding, setIsDecoding] = useState(false);

  const [channel, setChannel] = useState("instagram-post");
  const [style, setStyle] = useState("photorealistic");
  const [headline, setHeadline] = useState("");
  const [color, setColor] = useState("");
  const [sceneLocation, setSceneLocation] = useState<string>("");
  const [includePrice, setIncludePrice] = useState(false);
  const [includeMileage, setIncludeMileage] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedAsset, setGeneratedAsset] = useState<GeneratedAsset | null>(null);

  async function handleDecode() {
    if (!vin.trim()) {
      toast.error("Please enter a VIN");
      return;
    }

    setIsDecoding(true);
    setDecoded(null);
    setGeneratedAsset(null);
    setColor("");

    try {
      const res = await fetch(`/api/vin-decode?vin=${encodeURIComponent(vin.trim())}`);
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "VIN decode failed");
      }

      setDecoded(data);
      // Auto-fill headline
      const title = [data.year, data.make, data.model, data.trim].filter(Boolean).join(" ");
      setHeadline(title);
      toast.success(`Decoded: ${title}`);
    } catch (err) {
      const message = err instanceof Error ? err.message : "VIN decode failed";
      toast.error(message);
    } finally {
      setIsDecoding(false);
    }
  }

  function decodedToVehicle(d: DecodedVehicle): Vehicle {
    return {
      id: `vin-${d.vin}`,
      dealership_id: dealership?.id || "demo",
      year: d.year,
      make: d.make,
      model: d.model,
      trim: d.trim,
      price: null,
      mileage: null,
      vin: d.vin,
      stock_number: null,
      status: "available",
      photos: [],
      tags: [],
      details: {
        body_class: d.body_class,
        drive_type: d.drive_type,
        engine: d.engine,
        fuel_type: d.fuel_type,
        transmission: d.transmission,
        doors: d.doors,
        color: color || undefined,
      },
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
  }

  async function handleGenerate() {
    if (!decoded || !dealership) {
      toast.error("Please decode a VIN first");
      return;
    }

    setIsGenerating(true);
    setGeneratedAsset(null);

    try {
      const vehicle = decodedToVehicle(decoded);
      const basePrompt = buildPrompt({
        content_type: "vehicle-spotlight",
        channel,
        dealership,
        vehicle,
        headline,
        style,
        // Always include the year as visible text in the visual
        include_vehicle_year: decoded.year ? String(decoded.year) : undefined,
        scene_location: sceneLocation || undefined,
        include_price: includePrice,
        include_mileage: includeMileage,
      });
      // Strongly specify the paint color so the AI renders it accurately
      const colorBlock = color
        ? ` VEHICLE PAINT COLOR: The exterior paint is ${color}. Render the vehicle with precisely this ${color} paint finish — accurate paint color is critical to this image.`
        : "";
      const prompt = `${basePrompt}${colorBlock}`;

      const aspectRatio = getAspectRatioForChannel(channel);
      const resolution = getResolutionForChannel(channel);

      if (isDemoMode()) {
        const res = await fetch("/api/demo-generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ prompt, aspect_ratio: aspectRatio, resolution }),
        });
        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error || "Generation failed");
        }
        const { taskId } = await res.json();
        const demoAsset: GeneratedAsset = {
          id: `vin-${Date.now()}`,
          dealership_id: dealership.id,
          created_by: null,
          vehicle_id: null,
          content_type: "vehicle-spotlight",
          channel,
          prompt,
          image_url: null,
          storage_path: null,
          aspect_ratio: aspectRatio,
          resolution,
          kie_task_id: taskId,
          status: "processing",
          metadata: { vin: decoded.vin },
          is_favorite: false,
          campaign: `VIN: ${decoded.vin}`,
          created_at: new Date().toISOString(),
        };
        setGeneratedAsset(demoAsset);
        addAsset(demoAsset);
        pollResult(demoAsset, taskId);
        return;
      }

      // Production: pass the fully-built prompt so vehicle details are included
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content_type: "custom",
          channel,
          style,
          custom_prompt: prompt,
          campaign: `VIN: ${decoded.vin}`,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Generation failed");
      }

      const result = await res.json();

      // Poll by asset ID (not kie_task_id) — the poll route looks up by asset ID
      const asset: GeneratedAsset = result;
      setGeneratedAsset(asset);
      addAsset(asset);
      pollResult(asset, result.id);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Generation failed";
      toast.error(message);
      setIsGenerating(false);
    }
  }

  async function pollResult(asset: GeneratedAsset, id: string) {
    const maxAttempts = 60;
    let attempts = 0;

    const poll = async () => {
      attempts++;
      try {
        // Demo mode: id is a KIE task ID; production: id is the asset UUID
        const url = isDemoMode()
          ? `/api/demo-generate?taskId=${id}`
          : `/api/generate/${id}`;
        const res = await fetch(url);
        if (!res.ok) return;
        const data = await res.json();

        if (data.status === "completed" && (data.output?.image_url || data.image_url)) {
          const imageUrl = data.output?.image_url || data.image_url;
          const updated = { ...asset, status: "completed" as const, image_url: imageUrl };
          setGeneratedAsset(updated);
          updateAsset(asset.id, updated);
          setIsGenerating(false);
          toast.success("Visual generated!");
          return;
        }

        if (data.status === "failed") {
          setGeneratedAsset({ ...asset, status: "failed" });
          setIsGenerating(false);
          toast.error("Generation failed. Try again.");
          return;
        }

        if (attempts < maxAttempts) {
          setTimeout(poll, 3000);
        } else {
          setIsGenerating(false);
          toast.error("Generation timed out.");
        }
      } catch {
        if (attempts < maxAttempts) setTimeout(poll, 5000);
      }
    };

    setTimeout(poll, 3000);
  }

  const vehicleTitle = decoded
    ? [decoded.year, decoded.make, decoded.model, decoded.trim].filter(Boolean).join(" ")
    : null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold flex items-center gap-2">
          <ScanBarcode className="h-6 w-6 text-primary" />
          VIN Decoder
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Enter a VIN to decode vehicle details and generate a marketing visual
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column — form */}
        <div className="lg:col-span-2 space-y-6">
          {/* VIN Input */}
          <Card className="glass">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Search className="h-4 w-4" />
                Enter VIN
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-3">
                <div className="flex-1 space-y-2">
                  <Label>Vehicle Identification Number</Label>
                  <Input
                    value={vin}
                    onChange={(e) => setVin(e.target.value.toUpperCase())}
                    placeholder="e.g. 1VWSA7A32LC000001"
                    maxLength={17}
                    className="font-mono text-base tracking-wider"
                    onKeyDown={(e) => e.key === "Enter" && handleDecode()}
                  />
                </div>
                <div className="flex items-end">
                  <Button
                    onClick={handleDecode}
                    disabled={isDecoding || !vin.trim()}
                    className="gradient-primary text-white"
                  >
                    {isDecoding ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <Search className="h-4 w-4 mr-2" />
                    )}
                    Decode
                  </Button>
                </div>
              </div>

              <p className="text-xs text-muted-foreground">
                Uses the NHTSA Vehicle API to decode manufacturer, model, and specs from any 17-character VIN.
              </p>
            </CardContent>
          </Card>

          {/* Decoded Vehicle Info */}
          {decoded && (
            <Card className="glass">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Car className="h-4 w-4" />
                  {vehicleTitle}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {decoded.year && (
                    <InfoItem label="Year" value={String(decoded.year)} />
                  )}
                  {decoded.make && (
                    <InfoItem label="Make" value={decoded.make} />
                  )}
                  {decoded.model && (
                    <InfoItem label="Model" value={decoded.model} />
                  )}
                  {decoded.trim && (
                    <InfoItem label="Trim" value={decoded.trim} />
                  )}
                  {decoded.body_class && (
                    <InfoItem label="Body Style" value={decoded.body_class} icon={<Car className="h-3.5 w-3.5" />} />
                  )}
                  {decoded.engine && (
                    <InfoItem label="Engine" value={decoded.engine} icon={<Gauge className="h-3.5 w-3.5" />} />
                  )}
                  {decoded.drive_type && (
                    <InfoItem label="Drive Type" value={decoded.drive_type} icon={<Cog className="h-3.5 w-3.5" />} />
                  )}
                  {decoded.fuel_type && (
                    <InfoItem label="Fuel Type" value={decoded.fuel_type} icon={<Fuel className="h-3.5 w-3.5" />} />
                  )}
                  {decoded.transmission && (
                    <InfoItem label="Transmission" value={decoded.transmission} icon={<Cog className="h-3.5 w-3.5" />} />
                  )}
                  {decoded.doors && (
                    <InfoItem label="Doors" value={String(decoded.doors)} icon={<DoorOpen className="h-3.5 w-3.5" />} />
                  )}
                </div>

                <p className="text-xs text-muted-foreground mt-4 font-mono">
                  VIN: {decoded.vin}
                  {decoded.plant_city && decoded.plant_country && (
                    <span> · Built in {decoded.plant_city}, {decoded.plant_country}</span>
                  )}
                </p>
              </CardContent>
            </Card>
          )}

          {/* Vehicle Color & Channel & Style (shown after decode) */}
          {decoded && (
            <>
              <Card className="glass">
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Paintbrush className="h-4 w-4" />
                    Vehicle Color
                  </CardTitle>
                  <p className="text-xs text-muted-foreground">
                    VIN doesn&apos;t include paint color — select it here so the AI renders the correct color.
                  </p>
                </CardHeader>
                <CardContent className="space-y-3">
                  {/* Color swatch preview */}
                  {color && (() => {
                    const selected = VEHICLE_COLORS.find((c) => c.value === color);
                    return selected ? (
                      <div className="flex items-center gap-3 p-3 rounded-md border bg-muted/30">
                        <span
                          className="inline-block h-8 w-8 rounded-md border border-border shadow-sm flex-shrink-0"
                          style={{ backgroundColor: selected.hex }}
                        />
                        <div>
                          <p className="text-sm font-medium">{selected.label}</p>
                          <p className="text-xs text-muted-foreground font-mono">{selected.hex}</p>
                        </div>
                      </div>
                    ) : null;
                  })()}
                  <Select
                    value={color || "none"}
                    onValueChange={(v) => setColor(v === "none" || v == null ? "" : v)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select vehicle color..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">
                        <span className="text-muted-foreground">Select a color...</span>
                      </SelectItem>
                      {VEHICLE_COLORS.map((c) => (
                        <SelectItem key={c.value} value={c.value}>
                          <div className="flex items-center gap-2">
                            <span
                              className="inline-block h-3 w-3 rounded-full border border-border/50"
                              style={{ backgroundColor: c.hex }}
                            />
                            {c.label}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </CardContent>
              </Card>

              <Card className="glass">
                <CardHeader>
                  <CardTitle className="text-base">Channel & Style</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <ChannelPicker value={channel} onChange={setChannel} />
                  <Separator />
                  <StyleOptions value={style} onChange={setStyle} />
                </CardContent>
              </Card>

              <Card className="glass">
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    Background Location
                  </CardTitle>
                  <p className="text-xs text-muted-foreground">
                    Choose where the vehicle is photographed
                  </p>
                </CardHeader>
                <CardContent className="space-y-4">
                  {SCENE_CATEGORIES.map((category: string) => {
                    const scenesInCategory = SCENE_PRESETS.filter((s) => s.category === category);
                    if (scenesInCategory.length === 0) return null;

                    return (
                      <div key={category}>
                        <p className="text-xs font-semibold text-muted-foreground mb-2">{category}</p>
                        <div className="grid grid-cols-2 gap-2">
                          {scenesInCategory.map((scene) => (
                            <button
                              key={scene.id}
                              onClick={() => setSceneLocation(scene.id)}
                              className={`p-2 rounded-md text-xs text-left transition-colors ${
                                sceneLocation === scene.id
                                  ? "bg-primary text-primary-foreground"
                                  : "bg-muted hover:bg-muted/80"
                              }`}
                              title={scene.description}
                            >
                              <span className="mr-1">{scene.emoji}</span>
                              {scene.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </CardContent>
              </Card>

              <Card className="glass">
                <CardHeader>
                  <CardTitle className="text-base">Display Options</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="include-price"
                      checked={includePrice}
                      onCheckedChange={(checked: boolean | "indeterminate") => setIncludePrice(checked as boolean)}
                    />
                    <Label htmlFor="include-price" className="text-sm font-normal cursor-pointer">
                      Show price on image
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="include-mileage"
                      checked={includeMileage}
                      onCheckedChange={(checked: boolean | "indeterminate") => setIncludeMileage(checked as boolean)}
                    />
                    <Label htmlFor="include-mileage" className="text-sm font-normal cursor-pointer">
                      Show mileage on image
                    </Label>
                  </div>
                </CardContent>
              </Card>

              <Card className="glass">
                <CardHeader>
                  <CardTitle className="text-base">Headline</CardTitle>
                </CardHeader>
                <CardContent>
                  <Input
                    value={headline}
                    onChange={(e) => setHeadline(e.target.value)}
                    placeholder="Custom headline for the visual..."
                  />
                </CardContent>
              </Card>

              <Button
                className="gradient-primary text-white w-full"
                size="lg"
                onClick={handleGenerate}
                disabled={isGenerating}
              >
                {isGenerating ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Wand2 className="h-4 w-4 mr-2" />
                )}
                {isGenerating ? "Generating..." : "Generate Visual"}
              </Button>
            </>
          )}
        </div>

        {/* Right column — preview */}
        <div className="space-y-4">
          <h2 className="font-heading text-lg font-semibold">Preview</h2>
          <Card className="glass overflow-hidden">
            <CardContent className="p-0">
              {generatedAsset?.status === "completed" && generatedAsset.image_url ? (
                <img
                  src={generatedAsset.image_url}
                  alt={vehicleTitle || "Generated visual"}
                  className="w-full h-auto"
                />
              ) : isGenerating ? (
                <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
                  <Loader2 className="h-8 w-8 animate-spin text-primary mb-3" />
                  <p className="text-sm">Generating your visual...</p>
                </div>
              ) : decoded ? (
                <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
                  <Wand2 className="h-8 w-8 mb-3 opacity-30" />
                  <p className="text-sm">Select channel & style, then generate</p>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
                  <ScanBarcode className="h-8 w-8 mb-3 opacity-30" />
                  <p className="text-sm">Enter a VIN to get started</p>
                </div>
              )}
            </CardContent>
          </Card>

          {generatedAsset?.status === "completed" && generatedAsset.image_url && (
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                className="flex-1"
                onClick={() => window.open(generatedAsset.image_url!, "_blank")}
              >
                <Download className="h-4 w-4 mr-1.5" />
                Download
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="flex-1"
                onClick={handleGenerate}
              >
                <RotateCw className="h-4 w-4 mr-1.5" />
                Regenerate
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function InfoItem({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon?: React.ReactNode;
}) {
  return (
    <div className="space-y-1">
      <p className="text-xs text-muted-foreground flex items-center gap-1">
        {icon}
        {label}
      </p>
      <p className="text-sm font-medium">{value}</p>
    </div>
  );
}
