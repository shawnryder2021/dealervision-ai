"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, Wand2, Eye, Loader2, Download, BookmarkPlus, Plus, Minus, Trash2, AlertCircle } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ChannelPicker } from "@/components/create/ChannelPicker";
import { StyleOptions } from "@/components/create/StyleOptions";
import { VehicleSelector } from "@/components/create/VehicleSelector";
import { GenerationPreview } from "@/components/create/GenerationPreview";
import { AiSuggestButton } from "@/components/create/AiSuggestButton";
import { EditImageDialog } from "@/components/create/EditImageDialog";
import { TextOverlayEditor } from "@/components/create/TextOverlayEditor";
import { ImageUploader } from "@/components/shared/ImageUploader";
import { SaveTemplateDialog } from "@/components/create/TemplateGallery";
import { SceneLocationPicker } from "@/components/create/SceneLocationPicker";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAppStore } from "@/lib/store";
import { createClient } from "@/lib/supabase/client";
import { isDemoMode } from "@/lib/demo-data";
import { buildPrompt, getAspectRatioForChannel, getResolutionForChannel } from "@/lib/prompt-templates";
import { COMMON_VEHICLE_PRESETS, parseInlineVehicleId } from "@/lib/common-vehicle-presets";
import { MODELS_BY_MAKE } from "@/lib/vehicle-options";
import { CONTENT_TYPES, CHANNEL_PRESETS } from "@/lib/constants";
import type { Vehicle, GeneratedAsset } from "@/lib/types";
import { useWebhook } from "@/lib/use-webhook";
import { submitAndPollProd, submitAndPollDemo, runPool, QuotaError } from "@/lib/create/run-generation-job";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";

function parsePrice(s: string): number | undefined {
  const n = parseFloat((s ?? "").replace(/[^0-9.]/g, ""));
  return Number.isFinite(n) && n > 0 ? n : undefined;
}

export default function GenerateTypePage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const contentType = params.type as string;
  const { dealership, vehicles: storeVehicles, addAsset, updateAsset, adminActiveDealership } = useAppStore();
  const { fireWebhook } = useWebhook();

  const typeInfo = CONTENT_TYPES.find((t) => t.id === contentType);

  const [channel, setChannel] = useState("instagram-post");
  const [style, setStyle] = useState("photorealistic");
  const [vehicleId, setVehicleId] = useState<string | undefined>();
  const [headline, setHeadline] = useState("");
  const [subheadline, setSubheadline] = useState("");
  const [cta, setCta] = useState("");
  const [eventName, setEventName] = useState("");
  const [eventDates, setEventDates] = useState("");
  const [offerDetails, setOfferDetails] = useState("");
  const [previousPrice, setPreviousPrice] = useState("");
  const [currentPrice, setCurrentPrice] = useState("");
  const [vehicleVin, setVehicleVin] = useState("");
  const [vehicleColor, setVehicleColor] = useState("");
  const [vinDecoding, setVinDecoding] = useState(false);
  const [serviceOffer, setServiceOffer] = useState("");
  const [serviceDetails, setServiceDetails] = useState("");
  const [testimonialText, setTestimonialText] = useState("");
  const [testimonialAuthor, setTestimonialAuthor] = useState("");
  const [rating, setRating] = useState(5);
  const [customPrompt, setCustomPrompt] = useState("");
  const [campaign, setCampaign] = useState("");
  const [referencePhotos, setReferencePhotos] = useState<{ url: string; display_url: string; thumbnail_url: string }[]>([]);
  // A single uploaded base photo to build the piece ON (edit pipeline preserves it + overlays marketing).
  const [baseImage, setBaseImage] = useState<{ url: string; display_url: string; thumbnail_url: string }[]>([]);
  const [includeVehicleYear, setIncludeVehicleYear] = useState<string | undefined>();
  const [includeVehicleModel, setIncludeVehicleModel] = useState<string | undefined>();
  const [sceneLocation, setSceneLocation] = useState<string | undefined>();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  // All generations from this session (the "attempt strip"); the active one drives the dialogs.
  const [results, setResults] = useState<GeneratedAsset[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  // How many options to produce per channel, and which extra channels to also generate for.
  const [variations, setVariations] = useState(1);
  const [extraChannels, setExtraChannels] = useState<string[]>([]);
  const [previewPrompt, setPreviewPrompt] = useState("");
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [textEditorOpen, setTextEditorOpen] = useState(false);
  const [saveTemplateOpen, setSaveTemplateOpen] = useState(false);

  // Pre-fill from template or seasonal suggestion URL params
  useEffect(() => {
    if (searchParams.get("channel")) setChannel(searchParams.get("channel")!);
    if (searchParams.get("style")) setStyle(searchParams.get("style")!);
    if (searchParams.get("scene")) setSceneLocation(searchParams.get("scene")!);
    if (searchParams.get("headline")) setHeadline(searchParams.get("headline")!);
    if (searchParams.get("subheadline")) setSubheadline(searchParams.get("subheadline")!);
    if (searchParams.get("cta")) setCta(searchParams.get("cta")!);
    if (searchParams.get("eventName")) setEventName(searchParams.get("eventName")!);
    if (searchParams.get("eventDates")) setEventDates(searchParams.get("eventDates")!);
    if (searchParams.get("offerDetails")) setOfferDetails(searchParams.get("offerDetails")!);
    if (searchParams.get("serviceOffer")) setServiceOffer(searchParams.get("serviceOffer")!);
    if (searchParams.get("serviceDetails")) setServiceDetails(searchParams.get("serviceDetails")!);
    if (searchParams.get("customPrompt")) setCustomPrompt(searchParams.get("customPrompt")!);
    if (searchParams.get("campaign")) setCampaign(searchParams.get("campaign")!);
    if (searchParams.get("vehicleId")) setVehicleId(searchParams.get("vehicleId")!);
    if (searchParams.get("previousPrice")) setPreviousPrice(searchParams.get("previousPrice")!);
    if (searchParams.get("currentPrice")) setCurrentPrice(searchParams.get("currentPrice")!);
    if (searchParams.get("vin")) setVehicleVin(searchParams.get("vin")!);
    if (searchParams.get("color")) setVehicleColor(searchParams.get("color")!);
  }, [searchParams]);

  // Auto-fill Now-price and VIN from the picked inventory vehicle, but only
  // if the user hasn't already typed them in.
  useEffect(() => {
    if (contentType !== "price-drop") return;
    if (!vehicleId) return;
    const v = vehicles.find((x) => x.id === vehicleId);
    if (!v) return;
    if (!currentPrice && v.price) setCurrentPrice(String(v.price));
    if (!vehicleVin && v.vin) setVehicleVin(v.vin);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [vehicleId, vehicles, contentType]);

  async function handleDecodeVin() {
    const vin = vehicleVin.trim();
    if (vin.length < 11) {
      toast.error("Enter a full VIN to decode (17 characters)");
      return;
    }
    setVinDecoding(true);
    try {
      const res = await fetch(`/api/vin-decode?vin=${encodeURIComponent(vin)}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Decode failed");
      const { year, make, model } = data as { year: number | null; make: string | null; model: string | null };
      if (!make || !model) {
        toast.error("Couldn't read make/model from this VIN");
        return;
      }
      const id = `manual:${year ?? ""}|${make}|${model}`;
      setVehicleId(id);
      toast.success(`Decoded: ${year ?? "—"} ${make} ${model}`);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Decode failed";
      toast.error(message);
    } finally {
      setVinDecoding(false);
    }
  }

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

  const availableYears = useMemo(() => {
    const fromInventory = vehicles
      .map((v) => v.year)
      .filter((y): y is number => y != null);
    const fromPresets = COMMON_VEHICLE_PRESETS.map((p) => p.year);
    // Always include the current year ± a couple so the picker is usable
    const now = new Date().getFullYear();
    const evergreen = [now + 1, now, now - 1, now - 2];
    return Array.from(new Set([...fromInventory, ...fromPresets, ...evergreen]))
      .sort((a, b) => b - a)
      .map(String);
  }, [vehicles]);

  const availableModels = useMemo(() => {
    const fromInventory = vehicles
      .map((v) => v.model?.trim())
      .filter((m): m is string => Boolean(m));
    const fromCatalog = Object.values(MODELS_BY_MAKE).flat();
    return Array.from(new Set([...fromInventory, ...fromCatalog])).sort((a, b) =>
      a.localeCompare(b)
    );
  }, [vehicles]);

  const handlePreviewPrompt = useCallback(async () => {
    if (isDemoMode() && dealership) {
      let vehicle: Vehicle | null = vehicleId
        ? vehicles.find((v) => v.id === vehicleId) ?? null
        : null;
      if (!vehicle && vehicleId) {
        const iv = parseInlineVehicleId(vehicleId);
        if (iv) {
          vehicle = {
            id: vehicleId, dealership_id: dealership.id,
            year: iv.year ?? null, make: iv.make, model: iv.model,
            trim: iv.trim ?? null, price: null, mileage: null,
            vin: null, stock_number: null, status: "available",
            photos: [], tags: [], details: {},
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          } as Vehicle;
        }
      }
      const prompt = buildPrompt({
        content_type: contentType,
        channel,
        dealership,
        vehicle: vehicle || null,
        headline, subheadline, cta, style,
        event_name: eventName, event_dates: eventDates,
        offer_details: offerDetails, service_offer: serviceOffer,
        service_details: serviceDetails, testimonial_text: testimonialText,
        testimonial_author: testimonialAuthor, rating, custom_prompt: customPrompt,
        previous_price: parsePrice(previousPrice),
        current_price: parsePrice(currentPrice),
        vehicle_vin: vehicleVin || undefined,
        vehicle_color: vehicleColor || undefined,
        include_vehicle_year: includeVehicleYear,
        include_vehicle_model: includeVehicleModel,
          scene_location: sceneLocation,
      });
      setPreviewPrompt(prompt);
      return;
    }

    try {
      // A "manual:" / "preset:" id isn't a real DB row — send it as inline data.
      const inlineVehicle = vehicleId ? parseInlineVehicleId(vehicleId) ?? undefined : undefined;

      const res = await fetch("/api/generate/preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content_type: contentType, channel,
          vehicle_id: inlineVehicle ? undefined : vehicleId,
          inline_vehicle: inlineVehicle,
          headline, subheadline, cta, style,
          event_name: eventName, event_dates: eventDates,
          offer_details: offerDetails, service_offer: serviceOffer,
          service_details: serviceDetails, testimonial_text: testimonialText,
          testimonial_author: testimonialAuthor, rating, custom_prompt: customPrompt,
          previous_price: parsePrice(previousPrice),
          current_price: parsePrice(currentPrice),
          vehicle_vin: vehicleVin || undefined,
          vehicle_color: vehicleColor || undefined,
          include_vehicle_year: includeVehicleYear,
          include_vehicle_model: includeVehicleModel,
          scene_location: sceneLocation,
        }),
      });
      if (!res.ok) {
        const body = await res.text().catch(() => "");
        toast.error(`Couldn't build prompt preview: ${body || res.statusText}`);
        return;
      }
      const data = await res.json();
      setPreviewPrompt(data.prompt);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      toast.error(`Prompt preview failed: ${message}`);
    }
  }, [
    contentType, channel, vehicleId, headline, subheadline, cta, style,
    eventName, eventDates, offerDetails, serviceOffer, serviceDetails,
    testimonialText, testimonialAuthor, rating, customPrompt, dealership, vehicles,
    previousPrice, currentPrice, vehicleVin, vehicleColor,
    includeVehicleYear, includeVehicleModel, sceneLocation,
  ]);

  // Upsert a result into the session strip (insert if new, replace if it exists).
  const upsertResult = useCallback((asset: GeneratedAsset) => {
    setResults((prev) => {
      const i = prev.findIndex((r) => r.id === asset.id);
      if (i === -1) return [...prev, asset];
      const next = [...prev];
      next[i] = asset;
      return next;
    });
  }, []);

  const activeAsset = useMemo<GeneratedAsset | null>(
    () => results.find((r) => r.id === activeId) ?? results[results.length - 1] ?? null,
    [results, activeId]
  );

  // Resolve the selected vehicle (inventory row, or a synthetic from a preset/manual id).
  const resolveVehicle = useCallback((): Vehicle | null => {
    if (!vehicleId) return null;
    const inv = vehicles.find((v) => v.id === vehicleId);
    if (inv) return inv;
    const iv = parseInlineVehicleId(vehicleId);
    if (!iv) return null;
    return {
      id: vehicleId,
      dealership_id: dealership?.id || "demo",
      year: iv.year ?? null,
      make: iv.make,
      model: iv.model,
      trim: iv.trim ?? null,
      price: null, mileage: null, vin: null, stock_number: null,
      status: "available", photos: [], tags: [], details: {},
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    } as Vehicle;
  }, [vehicleId, vehicles, dealership?.id]);

  // Run a single generation job for one channel. Appends a card, polls, and
  // updates it in place. Errors are surfaced via toast; quota stops are signalled.
  async function runSingleJob(
    jobChannel: string,
    setActiveOnce: (id: string) => void,
    onQuota?: (msg: string) => void
  ) {
    try {
      if (isDemoMode()) {
        const vehicle = resolveVehicle();
        const prompt = buildPrompt({
          content_type: contentType, channel: jobChannel, dealership: dealership!,
          vehicle: vehicle || null, headline, subheadline, cta, style,
          event_name: eventName, event_dates: eventDates,
          offer_details: offerDetails, service_offer: serviceOffer,
          service_details: serviceDetails, testimonial_text: testimonialText,
          testimonial_author: testimonialAuthor, rating, custom_prompt: customPrompt,
          previous_price: parsePrice(previousPrice),
          current_price: parsePrice(currentPrice),
          vehicle_vin: vehicleVin || undefined,
          vehicle_color: vehicleColor || undefined,
          include_vehicle_year: includeVehicleYear,
          include_vehicle_model: includeVehicleModel,
          scene_location: sceneLocation,
        });
        const aspectRatio = getAspectRatioForChannel(jobChannel);
        const resolution = getResolutionForChannel(jobChannel);
        const imageInput = [...baseImage.map((p) => p.url), ...referencePhotos.map((p) => p.url)];
        const baseAsset: GeneratedAsset = {
          id: `demo-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          dealership_id: dealership!.id, created_by: null, vehicle_id: vehicleId || null,
          content_type: contentType, channel: jobChannel, prompt, image_url: null,
          storage_path: null, aspect_ratio: aspectRatio, resolution, kie_task_id: null,
          status: "processing", metadata: {}, is_favorite: false, campaign: campaign || null,
          created_at: new Date().toISOString(),
        };
        const final = await submitAndPollDemo({
          payload: { prompt, aspect_ratio: aspectRatio, resolution, image_input: imageInput.length > 0 ? imageInput : undefined },
          baseAsset,
          onCreated: (a) => { upsertResult(a); addAsset(a); setActiveOnce(a.id); },
        });
        upsertResult(final);
        updateAsset(final.id, final);
        if (final.status === "completed") fireWebhook(final);
        return;
      }

      const inlineVehicle = vehicleId ? parseInlineVehicleId(vehicleId) ?? undefined : undefined;
      const prodImageInput = referencePhotos.map((p) => p.url);
      const final = await submitAndPollProd({
        headers: adminActiveDealership ? { "X-Dealership-Id": adminActiveDealership.id } : undefined,
        body: {
          content_type: contentType, channel: jobChannel,
          vehicle_id: inlineVehicle ? undefined : vehicleId,
          inline_vehicle: inlineVehicle,
          headline, subheadline, cta, style,
          event_name: eventName, event_dates: eventDates,
          offer_details: offerDetails, service_offer: serviceOffer,
          service_details: serviceDetails, testimonial_text: testimonialText,
          testimonial_author: testimonialAuthor, rating, custom_prompt: customPrompt,
          previous_price: parsePrice(previousPrice),
          current_price: parsePrice(currentPrice),
          vehicle_vin: vehicleVin || undefined,
          vehicle_color: vehicleColor || undefined,
          campaign,
          include_vehicle_year: includeVehicleYear,
          include_vehicle_model: includeVehicleModel,
          scene_location: sceneLocation,
          image_input: prodImageInput.length > 0 ? prodImageInput : undefined,
          source_image_url: baseImage[0]?.url || undefined,
        },
        onCreated: (a) => { upsertResult(a); addAsset(a); setActiveOnce(a.id); },
      });
      upsertResult(final);
      updateAsset(final.id, final);
      if (final.status === "completed") fireWebhook(final);
    } catch (err) {
      if (err instanceof QuotaError) {
        onQuota?.(err.message);
      } else {
        toast.error(err instanceof Error ? err.message : "Generation failed");
      }
    }
  }

  async function handleGenerate() {
    if (!dealership) {
      toast.error("Please set up your dealership profile first");
      return;
    }

    const effectiveChannels = Array.from(new Set([channel, ...extraChannels]));
    const jobs: string[] = [];
    for (const ch of effectiveChannels) {
      for (let i = 0; i < variations; i++) jobs.push(ch);
    }
    if (jobs.length === 0) return;

    setIsGenerating(true);
    let firstId: string | null = null;
    const setActiveOnce = (id: string) => {
      if (!firstId) { firstId = id; setActiveId(id); }
    };
    let quotaHit = false;
    const onQuota = (msg: string) => {
      if (!quotaHit) { quotaHit = true; toast.error(msg); }
    };

    await runPool(jobs, 3, async (jobChannel) => {
      if (quotaHit) return;
      await runSingleJob(jobChannel, setActiveOnce, onQuota);
    });

    setIsGenerating(false);
    if (!quotaHit) toast.success(jobs.length > 1 ? `Generated ${jobs.length} visuals` : "Visual generated successfully!");
  }

  // Regenerate adds one more option for the active card's channel (keeps prior attempts).
  async function handleRegenerate() {
    if (!dealership) return;
    const ch = activeAsset?.channel || channel;
    setIsGenerating(true);
    await runSingleJob(ch, (id) => setActiveId(id), (msg) => toast.error(msg));
    setIsGenerating(false);
  }

  const clearResults = () => {
    setResults([]);
    setActiveId(null);
  };

  const totalJobs = Array.from(new Set([channel, ...extraChannels])).length * variations;

  async function handleDownload() {
    if (!activeAsset?.image_url) return;

    try {
      // The server-side composite already baked the dealership logo into the
      // image_url — download it as-is, no canvas manipulation needed.
      const proxyUrl = `/api/download-proxy?url=${encodeURIComponent(activeAsset.image_url)}`;
      const res = await fetch(proxyUrl);
      if (!res.ok) throw new Error("Download failed");
      const imageBlob = await res.blob();

      const url = URL.createObjectURL(imageBlob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${contentType}-${channel}-${Date.now()}.png`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      // Last resort: open in new tab
      window.open(activeAsset.image_url, "_blank");
    }
  }

  const showVehicleSelector = [
    "vehicle-spotlight",
    "new-arrival",
    "blueprint-infographic",
    "price-drop",
    "sales-event",
    "financing",
  ].includes(contentType);

  const showEventFields = contentType === "sales-event";
  const showServiceFields = contentType === "service-promo";
  const showTestimonialFields = contentType === "testimonial";
  const showCustomPrompt = contentType === "custom";
  const showPriceDropFields = contentType === "price-drop";

  if (!typeInfo) {
    return (
      <div className="text-center py-20">
        <p className="text-muted-foreground">Content type not found</p>
        <Link href="/dashboard/create" className="text-primary hover:underline text-sm mt-2 block">
          Back to content types
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/dashboard/create">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="font-heading text-2xl font-bold">{typeInfo.name}</h1>
          <p className="text-sm text-muted-foreground">{typeInfo.description}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Form */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="glass">
            <CardHeader>
              <CardTitle className="text-base">Channel & Style</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <ChannelPicker value={channel} onChange={setChannel} />

              {/* Also create for — extra channels */}
              <div className="space-y-2">
                <Label className="text-sm">Also create for (optional)</Label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                  {CHANNEL_PRESETS.filter((c) => c.id !== channel).map((c) => {
                    const checked = extraChannels.includes(c.id);
                    return (
                      <label
                        key={c.id}
                        className="flex items-center gap-2 rounded-md border px-2 py-1.5 text-xs cursor-pointer hover:bg-muted/50"
                      >
                        <Checkbox
                          checked={checked}
                          onCheckedChange={(v) =>
                            setExtraChannels((prev) =>
                              v ? [...prev, c.id] : prev.filter((id) => id !== c.id)
                            )
                          }
                        />
                        <span className="truncate">{c.name}</span>
                      </label>
                    );
                  })}
                </div>
                {/* clear extras when the primary changes to avoid a stale dup is handled by the filter above */}
              </div>

              {/* Variations */}
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-sm">Variations per channel</Label>
                  <p className="text-xs text-muted-foreground">Generate several options to choose from.</p>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    type="button" size="icon" variant="outline" className="h-7 w-7"
                    onClick={() => setVariations((v) => Math.max(1, v - 1))}
                    disabled={variations <= 1}
                  >
                    <Minus className="h-3.5 w-3.5" />
                  </Button>
                  <span className="w-6 text-center text-sm font-medium">{variations}</span>
                  <Button
                    type="button" size="icon" variant="outline" className="h-7 w-7"
                    onClick={() => setVariations((v) => Math.min(4, v + 1))}
                    disabled={variations >= 4}
                  >
                    <Plus className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>

              <Separator />
              <StyleOptions value={style} onChange={setStyle} />
            </CardContent>
          </Card>

          <Card className="glass">
            <CardHeader>
              <CardTitle className="text-base">Content Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {showVehicleSelector && (
                <>
                  <VehicleSelector
                    vehicles={vehicles}
                    value={vehicleId}
                    onChange={setVehicleId}
                  />
                  {!showPriceDropFields && (
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Include Vehicle Year in Image (Optional)</Label>
                      <Select
                        value={includeVehicleYear || "none"}
                        onValueChange={(value) =>
                          setIncludeVehicleYear(value && value !== "none" ? value : undefined)
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Choose a year..." />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">
                            <span className="text-muted-foreground">Don&apos;t force a year</span>
                          </SelectItem>
                          {availableYears.map((year) => (
                            <SelectItem key={year} value={year}>
                              {year}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Include Vehicle Model in Image (Optional)</Label>
                      <Select
                        value={includeVehicleModel || "none"}
                        onValueChange={(value) =>
                          setIncludeVehicleModel(value && value !== "none" ? value : undefined)
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Choose a model..." />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">
                            <span className="text-muted-foreground">Don&apos;t force a model</span>
                          </SelectItem>
                          {availableModels.map((model) => (
                            <SelectItem key={model} value={model}>
                              {model}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  )}
                  {!showPriceDropFields && (
                  <p className="text-xs text-muted-foreground">
                    Leave these blank unless you want the AI to intentionally show specific year/model details in the graphic.
                  </p>
                  )}
                </>
              )}

              {showPriceDropFields ? (
                <div className="space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="was-price">Was Price</Label>
                      <Input
                        id="was-price"
                        inputMode="decimal"
                        placeholder="e.g., 32,995"
                        value={previousPrice}
                        onChange={(e) => setPreviousPrice(e.target.value)}
                      />
                      <p className="text-[11px] text-muted-foreground">
                        Shown with a red strikethrough.
                      </p>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="now-price">Now Price</Label>
                      <Input
                        id="now-price"
                        inputMode="decimal"
                        placeholder="e.g., 28,995"
                        value={currentPrice}
                        onChange={(e) => setCurrentPrice(e.target.value)}
                      />
                      <p className="text-[11px] text-muted-foreground">
                        Shown big and bold as the new price.
                      </p>
                    </div>
                    {(() => {
                      const was = parsePrice(previousPrice);
                      const now = parsePrice(currentPrice);
                      if (was && now && was > now) {
                        const savings = was - now;
                        const pct = Math.round((savings / was) * 100);
                        return (
                          <p className="sm:col-span-2 text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                            Savings: ${savings.toLocaleString()} ({pct}% off)
                          </p>
                        );
                      }
                      return null;
                    })()}
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="price-drop-vin">VIN (Optional)</Label>
                      <div className="flex gap-2">
                        <Input
                          id="price-drop-vin"
                          placeholder="17-character VIN"
                          maxLength={17}
                          value={vehicleVin}
                          onChange={(e) => setVehicleVin(e.target.value.toUpperCase())}
                          className="font-mono uppercase"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          disabled={vinDecoding || !vehicleVin.trim()}
                          onClick={handleDecodeVin}
                        >
                          {vinDecoding ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            "Decode"
                          )}
                        </Button>
                      </div>
                      <p className="text-[11px] text-muted-foreground">
                        Decode to auto-fill the year, make, and model.
                      </p>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="price-drop-color">Vehicle Color (Optional)</Label>
                      <Input
                        id="price-drop-color"
                        placeholder="e.g., Pearl White, Midnight Black, Silver"
                        value={vehicleColor}
                        onChange={(e) => setVehicleColor(e.target.value)}
                      />
                      <p className="text-[11px] text-muted-foreground">
                        Forces the AI to render the body paint in this colour.
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label>Headline</Label>
                      <AiSuggestButton
                        kind="headline"
                        dealership={dealership}
                        vehicle={resolveVehicle()}
                        goal={typeInfo?.name || "Promote this vehicle"}
                        onPick={setHeadline}
                      />
                    </div>
                    <Input
                      placeholder="Enter your main headline..."
                      value={headline}
                      onChange={(e) => setHeadline(e.target.value)}
                    />
                    {headline && (
                      <p className="text-[11px] text-muted-foreground text-right">{headline.length} chars</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label>Subheadline</Label>
                      <AiSuggestButton
                        kind="subheadline"
                        dealership={dealership}
                        vehicle={resolveVehicle()}
                        goal={typeInfo?.name || "Promote this vehicle"}
                        onPick={setSubheadline}
                      />
                    </div>
                    <Input
                      placeholder="Supporting text..."
                      value={subheadline}
                      onChange={(e) => setSubheadline(e.target.value)}
                    />
                    {subheadline && (
                      <p className="text-[11px] text-muted-foreground text-right">{subheadline.length} chars</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label>Call to Action</Label>
                      <AiSuggestButton
                        kind="cta"
                        dealership={dealership}
                        vehicle={resolveVehicle()}
                        goal={typeInfo?.name || "Promote this vehicle"}
                        onPick={setCta}
                      />
                    </div>
                    <Input
                      placeholder='e.g., "Visit Today", "Call Now"'
                      value={cta}
                      onChange={(e) => setCta(e.target.value)}
                    />
                    {cta && (
                      <p className="text-[11px] text-muted-foreground text-right">{cta.length} chars</p>
                    )}
                  </div>
                </>
              )}

              {showEventFields && (
                <>
                  <Separator />
                  <div className="space-y-2">
                    <Label>Event Name</Label>
                    <Input
                      placeholder="e.g., Memorial Day Blowout"
                      value={eventName}
                      onChange={(e) => setEventName(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Event Dates</Label>
                    <Input
                      placeholder="e.g., May 22–27"
                      value={eventDates}
                      onChange={(e) => setEventDates(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Offer Details</Label>
                    <Input
                      placeholder="e.g., UP TO $10,000 OFF SELECT MODELS"
                      value={offerDetails}
                      onChange={(e) => setOfferDetails(e.target.value)}
                    />
                  </div>
                </>
              )}

              {showServiceFields && (
                <>
                  <Separator />
                  <div className="space-y-2">
                    <Label>Service Offer</Label>
                    <Input
                      placeholder="e.g., Oil Change Special — $29.99"
                      value={serviceOffer}
                      onChange={(e) => setServiceOffer(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Service Details</Label>
                    <Textarea
                      placeholder="Additional details about the service offer..."
                      value={serviceDetails}
                      onChange={(e) => setServiceDetails(e.target.value)}
                    />
                  </div>
                </>
              )}

              {showTestimonialFields && (
                <>
                  <Separator />
                  <div className="space-y-2">
                    <Label>Customer Quote</Label>
                    <Textarea
                      placeholder="Enter the customer testimonial..."
                      value={testimonialText}
                      onChange={(e) => setTestimonialText(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Customer Name</Label>
                    <Input
                      placeholder="e.g., John D."
                      value={testimonialAuthor}
                      onChange={(e) => setTestimonialAuthor(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Rating (1–5)</Label>
                    <Input
                      type="number"
                      min={1}
                      max={5}
                      value={rating}
                      onChange={(e) => setRating(Number(e.target.value))}
                    />
                  </div>
                </>
              )}

              {showCustomPrompt && (
                <>
                  <Separator />
                  <div className="space-y-2">
                    <Label>Custom Prompt</Label>
                    <Textarea
                      placeholder="Describe your ideal marketing visual in detail..."
                      value={customPrompt}
                      onChange={(e) => setCustomPrompt(e.target.value)}
                      rows={4}
                    />
                  </div>
                </>
              )}

              <div className="space-y-2">
                <Label>Campaign (Optional)</Label>
                <Input
                  placeholder="e.g., Spring Sale 2026"
                  value={campaign}
                  onChange={(e) => setCampaign(e.target.value)}
                />
              </div>

              <Separator />

              {/* Base Image — build the piece ON the uploaded photo (edit pipeline) */}
              <ImageUploader
                value={baseImage}
                onChange={setBaseImage}
                maxFiles={1}
                label="Use Your Own Image (Optional)"
              />
              <p className="text-xs text-muted-foreground -mt-2">
                {baseImage.length > 0
                  ? "Your photo will be kept as the base — we'll overlay the marketing text, branding, and styling on top of it."
                  : "Upload a photo to build this piece on. We'll keep your actual photo and overlay marketing text & branding — instead of generating a new image from scratch."}
              </p>

              <Separator />

              {/* Reference Photo Upload */}
              <ImageUploader
                value={referencePhotos}
                onChange={setReferencePhotos}
                maxFiles={3}
                label="Reference Photos (Optional)"
              />
              <p className="text-xs text-muted-foreground -mt-2">
                Guide a from-scratch generation — the AI recreates the vehicle using these as a visual reference.
              </p>

              <Separator />

            </CardContent>
          </Card>

          {/* Scene & Location */}
          {style === "photorealistic" && (
            <Card className="glass">
              <CardHeader>
                <CardTitle className="text-base">Scene & Location</CardTitle>
                <p className="text-xs text-muted-foreground">
                  Choose where the vehicle is placed in the image. Only applies to photorealistic style.
                </p>
              </CardHeader>
              <CardContent>
                <SceneLocationPicker
                  value={sceneLocation}
                  onChange={setSceneLocation}
                  hasLocalLandmark={!!(
                    dealership?.local_context &&
                    typeof dealership.local_context === "object" &&
                    (dealership.local_context as Record<string, unknown>).landmarks
                  )}
                />
              </CardContent>
            </Card>
          )}

          {/* Prompt Preview */}
          <Card className="glass">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">Prompt Preview</CardTitle>
              <Button size="sm" variant="outline" onClick={handlePreviewPrompt}>
                <Eye className="h-3.5 w-3.5 mr-1.5" />
                Preview
              </Button>
            </CardHeader>
            {previewPrompt && (
              <CardContent>
                <p className="text-xs text-muted-foreground whitespace-pre-wrap bg-muted/50 rounded-lg p-3 font-mono">
                  {previewPrompt}
                </p>
              </CardContent>
            )}
          </Card>

          <div className="space-y-1.5">
            <div className="flex gap-2">
              <Button
                size="lg"
                className="flex-1 gradient-primary text-white text-base"
                onClick={handleGenerate}
                disabled={isGenerating}
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Wand2 className="h-5 w-5 mr-2" />
                    {totalJobs > 1 ? `Generate ${totalJobs} Visuals` : "Generate Visual"}
                  </>
                )}
              </Button>
              <Button
                size="lg"
                variant="outline"
                onClick={() => setSaveTemplateOpen(true)}
                title="Save as template"
              >
                <BookmarkPlus className="h-5 w-5" />
              </Button>
            </div>
            {totalJobs > 1 && (
              <p className="text-[11px] text-muted-foreground text-center">
                Creates {totalJobs} images · uses {totalJobs} generations
              </p>
            )}
          </div>
        </div>

        {/* Preview Sidebar */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-heading font-semibold text-sm">
              Preview {results.length > 0 && <span className="text-muted-foreground font-normal">({results.length})</span>}
            </h3>
            {results.length > 0 && (
              <Button size="sm" variant="ghost" className="h-6 px-2 text-xs text-muted-foreground" onClick={clearResults}>
                <Trash2 className="h-3.5 w-3.5 mr-1" /> Clear
              </Button>
            )}
          </div>

          {/* Attempt strip — click a thumbnail to make it active */}
          {results.length > 1 && (
            <div className="grid grid-cols-4 gap-2">
              {results.map((r) => (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => setActiveId(r.id)}
                  className={`relative aspect-square rounded-md overflow-hidden border-2 transition-colors ${
                    r.id === (activeAsset?.id) ? "border-primary" : "border-transparent hover:border-border"
                  }`}
                  title={r.channel.replace(/-/g, " ")}
                >
                  {r.image_url ? (
                    <img src={r.image_url} alt="" className="h-full w-full object-cover" />
                  ) : r.status === "failed" ? (
                    <div className="flex h-full w-full items-center justify-center bg-muted">
                      <AlertCircle className="h-4 w-4 text-destructive" />
                    </div>
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-muted">
                      <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                    </div>
                  )}
                </button>
              ))}
            </div>
          )}

          {(isGenerating || activeAsset) && (
            <GenerationPreview
              asset={activeAsset}
              isGenerating={isGenerating && results.length === 0}
              onRegenerate={handleRegenerate}
              onDownload={handleDownload}
              onEdit={() => setEditDialogOpen(true)}
              onAddText={() => setTextEditorOpen(true)}
            />
          )}

          {!isGenerating && results.length === 0 && (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Wand2 className="h-10 w-10 text-muted-foreground/30 mb-3" />
                <p className="text-sm text-muted-foreground text-center">
                  Fill in the details and click Generate to create your visual
                </p>
              </CardContent>
            </Card>
          )}

          {/* Channel Info */}
          <Card className="glass">
            <CardContent className="p-4 space-y-2">
              <p className="text-xs font-medium text-muted-foreground">
                Selected Channel
              </p>
              {(() => {
                const ch = CHANNEL_PRESETS.find((c) => c.id === channel);
                return ch ? (
                  <div className="text-sm">
                    <p className="font-medium">{ch.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {ch.aspectRatio} · {ch.resolution}
                    </p>
                  </div>
                ) : null;
              })()}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Edit Image Dialog */}
      {activeAsset?.image_url && (
        <EditImageDialog
          open={editDialogOpen}
          onOpenChange={setEditDialogOpen}
          imageUrl={activeAsset.image_url}
          aspectRatio={activeAsset.aspect_ratio || "1:1"}
          onEditComplete={(newUrl) => {
            const updated = { ...activeAsset, image_url: newUrl };
            upsertResult(updated);
            updateAsset(activeAsset.id, updated);
            toast.success("Image updated with edits!");
            fireWebhook(updated, "image.edited");
          }}
        />
      )}

      {/* Text Overlay Editor */}
      {activeAsset?.image_url && (
        <TextOverlayEditor
          open={textEditorOpen}
          onOpenChange={setTextEditorOpen}
          imageUrl={activeAsset.image_url}
          onSave={(dataUrl) => {
            const updated = { ...activeAsset, image_url: dataUrl };
            upsertResult(updated);
            updateAsset(activeAsset.id, updated);
            toast.success("Text overlay applied!");
          }}
        />
      )}

      <SaveTemplateDialog
        open={saveTemplateOpen}
        onOpenChange={setSaveTemplateOpen}
        defaults={{
          contentType,
          channel,
          style,
          headline: headline || undefined,
          subheadline: subheadline || undefined,
          cta: cta || undefined,
          eventName: eventName || undefined,
          eventDates: eventDates || undefined,
          offerDetails: offerDetails || undefined,
          serviceOffer: serviceOffer || undefined,
          serviceDetails: serviceDetails || undefined,
          customPrompt: customPrompt || undefined,
          campaign: campaign || undefined,
        }}
      />
    </div>
  );
}
