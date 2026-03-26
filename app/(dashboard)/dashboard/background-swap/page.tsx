"use client";

import { useState, useCallback } from "react";
import {
  ImageMinus,
  Upload,
  Loader2,
  Download,
  RotateCcw,
  X,
  Sparkles,
  Check,
  Save,
  ChevronDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useAppStore } from "@/lib/store";
import { createClient } from "@/lib/supabase/client";
import { isDemoMode } from "@/lib/demo-data";

const BACKGROUND_CATEGORIES = [
  { id: "studio", label: "Studio & Clean" },
  { id: "locations", label: "Locations" },
  { id: "seasonal", label: "Seasons" },
  { id: "holidays", label: "Holidays & Events" },
  { id: "mood", label: "Mood & Style" },
] as const;

const BACKGROUND_PRESETS = [
  // Studio & Clean
  {
    id: "white-studio",
    label: "White Studio",
    emoji: "⬜",
    category: "studio",
    prompt:
      "Remove the background and place the vehicle on a clean pure white studio background with soft shadow beneath, professional car photography style",
  },
  {
    id: "showroom",
    label: "Showroom Floor",
    emoji: "🏢",
    category: "studio",
    prompt:
      "Remove the background and place the vehicle inside a modern luxury car dealership showroom with polished floors, dramatic spotlights, and glass walls",
  },
  {
    id: "transparent",
    label: "Remove BG Only",
    emoji: "🔲",
    category: "studio",
    prompt:
      "Remove the entire background, isolate just the vehicle on a clean solid transparent-like light gray background with a subtle soft shadow",
  },
  {
    id: "gradient-studio",
    label: "Color Gradient",
    emoji: "🎨",
    category: "studio",
    prompt:
      "Remove the background and place the vehicle on a clean modern studio backdrop with a smooth gradient background transitioning from deep blue to vibrant purple, professional automotive photography lighting",
  },
  {
    id: "black-studio",
    label: "Black Studio",
    emoji: "⬛",
    category: "studio",
    prompt:
      "Remove the background and place the vehicle on a dramatic pure black studio background with professional rim lighting highlighting the vehicle contours and a subtle floor reflection",
  },
  // Locations
  {
    id: "city-street",
    label: "City Street",
    emoji: "🏙️",
    category: "locations",
    prompt:
      "Remove the background and place the vehicle on a sleek downtown city street at golden hour with modern buildings and warm ambient lighting",
  },
  {
    id: "mountain-road",
    label: "Mountain Road",
    emoji: "🏔️",
    category: "locations",
    prompt:
      "Remove the background and place the vehicle on a winding mountain road with dramatic mountain scenery, blue sky, and lush green trees",
  },
  {
    id: "beach-sunset",
    label: "Beach Sunset",
    emoji: "🌅",
    category: "locations",
    prompt:
      "Remove the background and place the vehicle on a coastal road at sunset with ocean waves, golden sky, and warm light reflecting off the paint",
  },
  {
    id: "forest-road",
    label: "Forest Road",
    emoji: "🌲",
    category: "locations",
    prompt:
      "Remove the background and place the vehicle on a scenic road through a lush forest with dappled sunlight filtering through tall trees",
  },
  {
    id: "desert-highway",
    label: "Desert Highway",
    emoji: "🏜️",
    category: "locations",
    prompt:
      "Remove the background and place the vehicle on a long straight desert highway with dramatic red rock formations and clear blue sky",
  },
  {
    id: "luxury-estate",
    label: "Luxury Estate",
    emoji: "🏛️",
    category: "locations",
    prompt:
      "Remove the background and place the vehicle parked in front of a luxury mansion estate with manicured gardens and elegant architecture",
  },
  {
    id: "parking-garage",
    label: "Parking Garage",
    emoji: "🅿️",
    category: "locations",
    prompt:
      "Remove the background and place the vehicle in a modern underground parking garage with dramatic concrete architecture and moody cinematic lighting",
  },
  {
    id: "racetrack",
    label: "Race Track",
    emoji: "🏁",
    category: "locations",
    prompt:
      "Remove the background and place the vehicle on a professional race track with clear sky, smooth asphalt, and speed-evoking atmosphere",
  },
  {
    id: "country-barn",
    label: "Country Barn",
    emoji: "🏚️",
    category: "locations",
    prompt:
      "Remove the background and place the vehicle in front of a rustic red barn in the countryside with rolling green hills, a dirt path, and warm golden hour light",
  },
  {
    id: "bridge-overlook",
    label: "Bridge Overlook",
    emoji: "🌉",
    category: "locations",
    prompt:
      "Remove the background and place the vehicle on a scenic bridge overlook with a dramatic suspension bridge, water below, and city skyline in the distance at twilight",
  },
  {
    id: "suburban-home",
    label: "Suburban Home",
    emoji: "🏡",
    category: "locations",
    prompt:
      "Remove the background and place the vehicle parked in the driveway of a beautiful suburban home with a well-manicured lawn, mature trees, and warm neighborhood setting",
  },
  // Seasons
  {
    id: "spring-bloom",
    label: "Spring Bloom",
    emoji: "🌸",
    category: "seasonal",
    prompt:
      "Remove the background and place the vehicle on a scenic road lined with cherry blossom trees in full bloom, pink petals floating in the air, lush green grass, and soft spring sunshine",
  },
  {
    id: "spring-rain",
    label: "Spring Rain",
    emoji: "🌦️",
    category: "seasonal",
    prompt:
      "Remove the background and place the vehicle on a fresh spring road just after rain with glistening wet pavement, bright green budding trees, raindrops on surfaces, and a rainbow in the clearing sky",
  },
  {
    id: "summer-tropical",
    label: "Tropical Summer",
    emoji: "🌴",
    category: "seasonal",
    prompt:
      "Remove the background and place the vehicle on a tropical coastal road with palm trees, turquoise ocean, bright sunshine, and vibrant tropical flowers",
  },
  {
    id: "summer-road-trip",
    label: "Summer Road Trip",
    emoji: "☀️",
    category: "seasonal",
    prompt:
      "Remove the background and place the vehicle on an open American highway in summer with clear blue skies, golden wheat fields on both sides, and warm sunshine creating a perfect road trip scene",
  },
  {
    id: "autumn-road",
    label: "Autumn Road",
    emoji: "🍂",
    category: "seasonal",
    prompt:
      "Remove the background and place the vehicle on a scenic road lined with vibrant autumn foliage in red, orange, and gold colors",
  },
  {
    id: "fall-harvest",
    label: "Fall Harvest",
    emoji: "🎃",
    category: "seasonal",
    prompt:
      "Remove the background and place the vehicle at a charming fall harvest scene with pumpkins, hay bales, warm golden light, and colorful autumn trees in the background",
  },
  {
    id: "winter-scene",
    label: "Winter Snow",
    emoji: "❄️",
    category: "seasonal",
    prompt:
      "Remove the background and place the vehicle in a beautiful winter landscape with fresh snow on the ground, snow-covered trees, and a crisp clear sky",
  },
  {
    id: "winter-cozy",
    label: "Cozy Winter",
    emoji: "🧣",
    category: "seasonal",
    prompt:
      "Remove the background and place the vehicle in a cozy winter town setting with warm glowing storefronts, light snowfall, string lights, and a charming small-town winter evening atmosphere",
  },
  // Holidays & Events
  {
    id: "holiday-christmas",
    label: "Christmas",
    emoji: "🎄",
    category: "holidays",
    prompt:
      "Remove the background and place the vehicle in a festive Christmas scene with snow, decorated Christmas trees with lights, warm holiday glow, and a cozy winter village backdrop",
  },
  {
    id: "new-years",
    label: "New Year's",
    emoji: "🎉",
    category: "holidays",
    prompt:
      "Remove the background and place the vehicle in a glamorous New Year's Eve celebration scene with gold confetti, champagne sparkles, midnight fireworks, and festive lights",
  },
  {
    id: "valentines",
    label: "Valentine's Day",
    emoji: "💝",
    category: "holidays",
    prompt:
      "Remove the background and place the vehicle in a romantic Valentine's Day setting with soft pink and red tones, scattered rose petals, heart-shaped bokeh lights, and an elegant evening atmosphere",
  },
  {
    id: "st-patricks",
    label: "St. Patrick's Day",
    emoji: "☘️",
    category: "holidays",
    prompt:
      "Remove the background and place the vehicle in a St. Patrick's Day themed scene with lush green rolling hills, shamrocks, a rainbow with a pot of gold, and festive green and gold decorations",
  },
  {
    id: "easter",
    label: "Easter / Spring",
    emoji: "🐣",
    category: "holidays",
    prompt:
      "Remove the background and place the vehicle in a bright Easter spring setting with pastel-colored decorations, spring flowers in bloom, soft sunshine, and a cheerful family-friendly atmosphere",
  },
  {
    id: "memorial-day",
    label: "Memorial Day",
    emoji: "🇺🇸",
    category: "holidays",
    prompt:
      "Remove the background and place the vehicle in an American patriotic setting with flags, bunting decorations, blue sky, and a respectful tribute atmosphere for Memorial Day weekend sales",
  },
  {
    id: "fourth-july",
    label: "4th of July",
    emoji: "🎆",
    category: "holidays",
    prompt:
      "Remove the background and place the vehicle at a patriotic 4th of July celebration with American flags, red white and blue decorations, fireworks bursting in the evening sky",
  },
  {
    id: "labor-day",
    label: "Labor Day",
    emoji: "🛠️",
    category: "holidays",
    prompt:
      "Remove the background and place the vehicle in a late summer Labor Day weekend scene with a barbecue setup, American flags, warm golden sunset, and end-of-summer vibes",
  },
  {
    id: "halloween",
    label: "Halloween",
    emoji: "🎃",
    category: "holidays",
    prompt:
      "Remove the background and place the vehicle in a spooky but fun Halloween scene with carved jack-o-lanterns, autumn leaves, fog, a full moon, and festive orange and purple lighting",
  },
  {
    id: "thanksgiving",
    label: "Thanksgiving",
    emoji: "🦃",
    category: "holidays",
    prompt:
      "Remove the background and place the vehicle in a warm Thanksgiving harvest setting with golden autumn colors, cornucopia decorations, rustic farmhouse backdrop, and warm family gathering atmosphere",
  },
  {
    id: "black-friday",
    label: "Black Friday",
    emoji: "🏷️",
    category: "holidays",
    prompt:
      "Remove the background and place the vehicle in a dramatic Black Friday sales setting with bold dark background, gold accents, spotlight lighting, and an exclusive deal atmosphere",
  },
  // Mood & Style
  {
    id: "night-city",
    label: "Night Cityscape",
    emoji: "🌃",
    category: "mood",
    prompt:
      "Remove the background and place the vehicle on a city street at night with neon lights, reflective wet pavement, and a dramatic urban atmosphere",
  },
  {
    id: "rainy-street",
    label: "Rainy Street",
    emoji: "🌧️",
    category: "mood",
    prompt:
      "Remove the background and place the vehicle on a moody rain-slicked city street with reflections, soft streetlamp glow, puddles, and a cinematic rainy atmosphere",
  },
  {
    id: "golden-hour",
    label: "Golden Hour",
    emoji: "🌤️",
    category: "mood",
    prompt:
      "Remove the background and place the vehicle in a stunning golden hour scene with warm amber sunlight, long shadows, lens flare, and a dreamy atmospheric glow highlighting the vehicle",
  },
  {
    id: "dramatic-clouds",
    label: "Dramatic Sky",
    emoji: "⛅",
    category: "mood",
    prompt:
      "Remove the background and place the vehicle under a dramatic cloud-filled sky with towering cumulus clouds, rays of light breaking through, and an epic cinematic landscape",
  },
  {
    id: "neon-cyberpunk",
    label: "Neon / Cyberpunk",
    emoji: "💜",
    category: "mood",
    prompt:
      "Remove the background and place the vehicle in a futuristic cyberpunk cityscape with vibrant neon signs in pink and blue, holographic displays, wet reflective streets, and a futuristic sci-fi atmosphere",
  },
  {
    id: "vintage-retro",
    label: "Vintage Retro",
    emoji: "📷",
    category: "mood",
    prompt:
      "Remove the background and place the vehicle in a vintage retro American setting with a classic 1950s diner, neon signs, warm film-like color grading, and nostalgic Americana vibes",
  },
];

const ASPECT_RATIOS = [
  { id: "1:1", label: "Square (1:1)" },
  { id: "16:9", label: "Wide (16:9)" },
  { id: "4:3", label: "Landscape (4:3)" },
  { id: "9:16", label: "Portrait (9:16)" },
  { id: "4:5", label: "Social (4:5)" },
];

export default function BackgroundSwapPage() {
  const { addAsset, dealership } = useAppStore();
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [selectedPreset, setSelectedPreset] = useState<string | null>(null);
  const [customPrompt, setCustomPrompt] = useState("");
  const [aspectRatio, setAspectRatio] = useState("1:1");
  const [isProcessing, setIsProcessing] = useState(false);
  const [resultImageUrl, setResultImageUrl] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [openCategory, setOpenCategory] = useState<string | null>("studio");

  const uploadFile = async (file: File): Promise<string | null> => {
    const formData = new FormData();
    formData.append("file", file);

    const res = await fetch("/api/upload", {
      method: "POST",
      body: formData,
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || "Upload failed");
    }

    const data = await res.json();
    return data.url;
  };

  const handleFiles = useCallback(async (files: File[]) => {
    const imageFile = files.find((f) => f.type.startsWith("image/"));
    if (!imageFile) {
      toast.error("Please upload an image file");
      return;
    }

    setIsUploading(true);
    setResultImageUrl(null);
    setSelectedPreset(null);
    setCustomPrompt("");

    try {
      const url = await uploadFile(imageFile);
      if (url) {
        setUploadedImageUrl(url);
        toast.success("Photo uploaded!");
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Upload failed";
      toast.error(msg);
    } finally {
      setIsUploading(false);
    }
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      handleFiles(Array.from(e.dataTransfer.files));
    },
    [handleFiles]
  );

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      handleFiles(Array.from(e.target.files || []));
      e.target.value = "";
    },
    [handleFiles]
  );

  const getPrompt = (): string => {
    if (customPrompt.trim()) return customPrompt.trim();
    const preset = BACKGROUND_PRESETS.find((p) => p.id === selectedPreset);
    return preset?.prompt || "";
  };

  async function handleSwap() {
    const prompt = getPrompt();
    if (!prompt) {
      toast.error("Select a background or describe a custom one");
      return;
    }
    if (!uploadedImageUrl) {
      toast.error("Upload a vehicle photo first");
      return;
    }

    setIsProcessing(true);
    setResultImageUrl(null);

    try {
      const res = await fetch("/api/edit-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt,
          image_url: uploadedImageUrl,
          image_size: aspectRatio,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Background swap failed");
      }

      const { taskId } = await res.json();
      await pollForResult(taskId);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Background swap failed";
      toast.error(msg);
      setIsProcessing(false);
    }
  }

  async function pollForResult(taskId: string) {
    const maxAttempts = 60;
    let attempts = 0;

    const poll = async () => {
      attempts++;
      try {
        const res = await fetch(`/api/edit-image?taskId=${taskId}`);
        if (!res.ok) return;
        const data = await res.json();

        if (data.status === "completed" && data.output?.image_url) {
          setResultImageUrl(data.output.image_url);
          setIsProcessing(false);
          toast.success("Background swapped!");
          return;
        }

        if (data.status === "failed") {
          setIsProcessing(false);
          toast.error(data.error || "Swap failed. Try again.");
          return;
        }

        if (attempts < maxAttempts) {
          setTimeout(poll, 3000);
        } else {
          setIsProcessing(false);
          toast.error("Processing timed out.");
        }
      } catch {
        if (attempts < maxAttempts) setTimeout(poll, 5000);
      }
    };

    setTimeout(poll, 3000);
  }

  async function handleDownload() {
    if (!resultImageUrl) return;
    try {
      // Proxy through our server to avoid CORS issues
      const proxyUrl = `/api/download-proxy?url=${encodeURIComponent(resultImageUrl)}`;
      const res = await fetch(proxyUrl);
      if (!res.ok) throw new Error("Download failed");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `bg-swap-${Date.now()}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success("Image downloaded!");
    } catch {
      toast.error("Download failed");
    }
  }

  async function handleSaveToLibrary() {
    if (!resultImageUrl || !dealership) return;
    setIsSaving(true);
    try {
      const assetData = {
        dealership_id: dealership.id,
        created_by: null,
        vehicle_id: null,
        content_type: "background-swap",
        channel: "general",
        prompt: getPrompt(),
        image_url: resultImageUrl,
        storage_path: null,
        aspect_ratio: aspectRatio,
        resolution: "1K",
        kie_task_id: null,
        status: "completed" as const,
        metadata: { source_image: uploadedImageUrl },
        is_favorite: false,
        campaign: null,
      };

      if (isDemoMode()) {
        addAsset({ id: `bg-swap-${Date.now()}`, ...assetData, created_at: new Date().toISOString() });
      } else {
        const supabase = createClient();
        const { data, error } = await supabase
          .from("generated_assets")
          .insert(assetData)
          .select()
          .single();
        if (error) throw error;
        addAsset(data);
      }

      toast.success("Saved to library!");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to save";
      toast.error(msg);
    } finally {
      setIsSaving(false);
    }
  }

  function handleReset() {
    setUploadedImageUrl(null);
    setResultImageUrl(null);
    setSelectedPreset(null);
    setCustomPrompt("");
    setIsProcessing(false);
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="font-heading text-2xl font-bold flex items-center gap-2">
          <ImageMinus className="h-6 w-6 text-primary" />
          Background Removal & Swap
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Upload a vehicle photo, remove or replace the background with
          professional settings
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column — Upload & Controls */}
        <div className="lg:col-span-1 space-y-5">
          {/* Upload Area */}
          <div className="rounded-xl border border-border bg-card p-4 space-y-4">
            <Label className="text-sm font-semibold">Vehicle Photo</Label>

            {uploadedImageUrl ? (
              <div className="relative group">
                <div className="rounded-lg overflow-hidden border border-border">
                  <img
                    src={uploadedImageUrl}
                    alt="Uploaded vehicle"
                    className="w-full object-cover"
                  />
                </div>
                <button
                  onClick={handleReset}
                  className="absolute top-2 right-2 h-7 w-7 rounded-full bg-black/70 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="h-3.5 w-3.5 text-white" />
                </button>
              </div>
            ) : (
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragging(true);
                }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
                className={cn(
                  "flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-8 transition-colors cursor-pointer",
                  isDragging
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-primary/50"
                )}
              >
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileSelect}
                  className="hidden"
                  id="bg-swap-upload"
                  disabled={isUploading}
                />
                <label
                  htmlFor="bg-swap-upload"
                  className="cursor-pointer text-center"
                >
                  {isUploading ? (
                    <>
                      <Loader2 className="h-10 w-10 text-primary mx-auto mb-3 animate-spin" />
                      <p className="text-sm font-medium">Uploading...</p>
                    </>
                  ) : (
                    <>
                      <Upload className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                      <p className="text-sm font-medium">
                        Drop a photo or click to upload
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        JPG, PNG up to 10MB
                      </p>
                    </>
                  )}
                </label>
              </div>
            )}
          </div>

          {/* Aspect Ratio */}
          {uploadedImageUrl && (
            <div className="rounded-xl border border-border bg-card p-4 space-y-3">
              <Label className="text-sm font-semibold">Output Size</Label>
              <div className="grid grid-cols-2 gap-2">
                {ASPECT_RATIOS.map((ar) => (
                  <button
                    key={ar.id}
                    onClick={() => setAspectRatio(ar.id)}
                    className={cn(
                      "px-3 py-2 text-xs rounded-lg border transition-all text-left",
                      aspectRatio === ar.id
                        ? "border-primary bg-primary/10 text-primary font-medium"
                        : "border-border hover:border-primary/30 text-muted-foreground"
                    )}
                  >
                    {ar.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Custom Prompt */}
          {uploadedImageUrl && (
            <div className="rounded-xl border border-border bg-card p-4 space-y-3">
              <Label className="text-sm font-semibold">
                Custom Background (optional)
              </Label>
              <Textarea
                placeholder='e.g., "Place the vehicle in front of a modern glass office building at sunset"'
                value={customPrompt}
                onChange={(e) => {
                  setCustomPrompt(e.target.value);
                  if (e.target.value.trim()) setSelectedPreset(null);
                }}
                rows={3}
                disabled={isProcessing}
              />
              <p className="text-[11px] text-muted-foreground">
                Type a custom description or choose a preset below
              </p>
            </div>
          )}

          {/* Swap Button */}
          {uploadedImageUrl && (
            <Button
              onClick={handleSwap}
              disabled={
                isProcessing || (!selectedPreset && !customPrompt.trim())
              }
              className="w-full gradient-primary text-white h-11"
              size="lg"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Swapping Background...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 mr-2" />
                  Swap Background
                </>
              )}
            </Button>
          )}
        </div>

        {/* Right Column — Presets & Result */}
        <div className="lg:col-span-2 space-y-5">
          {/* Background Presets — Accordion by Category */}
          {uploadedImageUrl && (
            <div className="rounded-xl border border-border bg-card p-4 space-y-1.5">
              <Label className="text-sm font-semibold mb-2 block">Choose Background</Label>

              {/* Selected preset chip (shows what's picked without needing to open) */}
              {selectedPreset && (
                <div className="flex items-center gap-2 mb-2 px-1">
                  <span className="text-xs text-muted-foreground">Selected:</span>
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary/10 border border-primary/30 text-xs font-medium text-primary">
                    <span>{BACKGROUND_PRESETS.find((p) => p.id === selectedPreset)?.emoji}</span>
                    {BACKGROUND_PRESETS.find((p) => p.id === selectedPreset)?.label}
                    <button
                      onClick={() => setSelectedPreset(null)}
                      className="ml-0.5 hover:text-destructive"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                </div>
              )}

              {BACKGROUND_CATEGORIES.map((cat) => {
                const presets = BACKGROUND_PRESETS.filter(
                  (p) => p.category === cat.id
                );
                if (presets.length === 0) return null;
                const isOpen = openCategory === cat.id;
                const hasSelected = presets.some((p) => p.id === selectedPreset);

                return (
                  <div
                    key={cat.id}
                    className={cn(
                      "rounded-lg border transition-colors",
                      isOpen ? "border-border bg-muted/20" : "border-transparent hover:bg-muted/10",
                      hasSelected && !isOpen && "border-primary/20 bg-primary/5"
                    )}
                  >
                    <button
                      onClick={() =>
                        setOpenCategory(isOpen ? null : cat.id)
                      }
                      className="flex items-center justify-between w-full px-3 py-2.5 text-left"
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold">{cat.label}</span>
                        <span className="text-[10px] text-muted-foreground">
                          {presets.length} options
                        </span>
                        {hasSelected && !isOpen && (
                          <span className="text-[10px] text-primary font-medium">
                            • selected
                          </span>
                        )}
                      </div>
                      <ChevronDown
                        className={cn(
                          "h-3.5 w-3.5 text-muted-foreground transition-transform",
                          isOpen && "rotate-180"
                        )}
                      />
                    </button>
                    {isOpen && (
                      <div className="px-2.5 pb-2.5">
                        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-1.5">
                          {presets.map((preset) => (
                            <button
                              key={preset.id}
                              onClick={() => {
                                setSelectedPreset(preset.id);
                                setCustomPrompt("");
                              }}
                              disabled={isProcessing}
                              className={cn(
                                "relative flex flex-col items-center gap-1 rounded-lg border p-2 transition-all text-center",
                                selectedPreset === preset.id
                                  ? "border-primary bg-primary/10 ring-1 ring-primary/30"
                                  : "border-border hover:border-primary/30 hover:bg-muted/30",
                                isProcessing && "opacity-50 cursor-not-allowed"
                              )}
                            >
                              {selectedPreset === preset.id && (
                                <div className="absolute top-1 right-1">
                                  <Check className="h-3 w-3 text-primary" />
                                </div>
                              )}
                              <span className="text-lg">{preset.emoji}</span>
                              <span className="text-[10px] font-medium leading-tight">
                                {preset.label}
                              </span>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Result Preview */}
          {(isProcessing || resultImageUrl) && (
            <div className="rounded-xl border border-border bg-card p-4 space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-semibold">Result</Label>
                {resultImageUrl && (
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleSaveToLibrary}
                      disabled={isSaving}
                      className="h-8 text-xs"
                    >
                      {isSaving ? (
                        <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                      ) : (
                        <Save className="h-3.5 w-3.5 mr-1.5" />
                      )}
                      Save to Library
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleDownload}
                      className="h-8 text-xs"
                    >
                      <Download className="h-3.5 w-3.5 mr-1.5" />
                      Download
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setResultImageUrl(null);
                        setSelectedPreset(null);
                        setCustomPrompt("");
                      }}
                      className="h-8 text-xs"
                    >
                      <RotateCcw className="h-3.5 w-3.5 mr-1.5" />
                      Try Another
                    </Button>
                  </div>
                )}
              </div>

              {/* Before / After */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
                    Original
                  </p>
                  <div className="rounded-lg overflow-hidden border border-border">
                    <img
                      src={uploadedImageUrl!}
                      alt="Original"
                      className="w-full object-cover"
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
                    {isProcessing ? "Processing..." : "New Background"}
                  </p>
                  <div className="rounded-lg overflow-hidden border border-border bg-muted/20 flex items-center justify-center min-h-[200px]">
                    {isProcessing ? (
                      <div className="flex flex-col items-center gap-3 py-12">
                        <Loader2 className="h-10 w-10 animate-spin text-primary" />
                        <div className="text-center">
                          <p className="text-sm font-medium">
                            Swapping background...
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            This takes 15-30 seconds
                          </p>
                        </div>
                      </div>
                    ) : resultImageUrl ? (
                      <img
                        src={resultImageUrl}
                        alt="Result"
                        className="w-full object-cover"
                      />
                    ) : null}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Empty State */}
          {!uploadedImageUrl && (
            <div className="rounded-xl border border-dashed border-border bg-muted/10 p-12 flex flex-col items-center justify-center text-center">
              <ImageMinus className="h-16 w-16 text-muted-foreground/30 mb-4" />
              <h3 className="text-lg font-semibold mb-1">
                Upload a Vehicle Photo
              </h3>
              <p className="text-sm text-muted-foreground max-w-md">
                Upload a photo of any vehicle and instantly swap the background
                — place it in a showroom, on a mountain road, city street, or
                any scene you describe.
              </p>
              <p className="text-xs text-muted-foreground/60 mt-3">
                Uses 4 credits per swap • Powered by AI editing
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
