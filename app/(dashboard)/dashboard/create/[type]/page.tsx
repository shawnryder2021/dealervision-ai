"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, Wand2, Eye, Loader2, Download, BookmarkPlus } from "lucide-react";
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
import { EditImageDialog } from "@/components/create/EditImageDialog";
import { TextOverlayEditor } from "@/components/create/TextOverlayEditor";
import { ImageUploader } from "@/components/shared/ImageUploader";
import { SaveTemplateDialog } from "@/components/create/TemplateGallery";
import { Switch } from "@/components/ui/switch";
import { useAppStore } from "@/lib/store";
import { createClient } from "@/lib/supabase/client";
import { isDemoMode } from "@/lib/demo-data";
import { buildPrompt, getAspectRatioForChannel, getResolutionForChannel } from "@/lib/prompt-templates";
import { CONTENT_TYPES, CHANNEL_PRESETS } from "@/lib/constants";
import type { Vehicle, GeneratedAsset } from "@/lib/types";
import { useWebhook } from "@/lib/use-webhook";
import { toast } from "sonner";

export default function GenerateTypePage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const contentType = params.type as string;
  const { dealership, vehicles: storeVehicles, addAsset, updateAsset } = useAppStore();
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
  const [serviceOffer, setServiceOffer] = useState("");
  const [serviceDetails, setServiceDetails] = useState("");
  const [testimonialText, setTestimonialText] = useState("");
  const [testimonialAuthor, setTestimonialAuthor] = useState("");
  const [rating, setRating] = useState(5);
  const [customPrompt, setCustomPrompt] = useState("");
  const [campaign, setCampaign] = useState("");
  const [referencePhotos, setReferencePhotos] = useState<{ url: string; display_url: string; thumbnail_url: string }[]>([]);
  const [watermarkEnabled, setWatermarkEnabled] = useState(true);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedAsset, setGeneratedAsset] = useState<GeneratedAsset | null>(null);
  const [previewPrompt, setPreviewPrompt] = useState("");
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [textEditorOpen, setTextEditorOpen] = useState(false);
  const [saveTemplateOpen, setSaveTemplateOpen] = useState(false);

  // Pre-fill from template or seasonal suggestion URL params
  useEffect(() => {
    if (searchParams.get("channel")) setChannel(searchParams.get("channel")!);
    if (searchParams.get("style")) setStyle(searchParams.get("style")!);
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
  }, [searchParams]);

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

  const handlePreviewPrompt = useCallback(async () => {
    if (isDemoMode() && dealership) {
      const vehicle = vehicleId ? vehicles.find((v) => v.id === vehicleId) : null;
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
      });
      setPreviewPrompt(prompt);
      return;
    }

    try {
      const res = await fetch("/api/generate/preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content_type: contentType, channel, vehicle_id: vehicleId,
          headline, subheadline, cta, style,
          event_name: eventName, event_dates: eventDates,
          offer_details: offerDetails, service_offer: serviceOffer,
          service_details: serviceDetails, testimonial_text: testimonialText,
          testimonial_author: testimonialAuthor, rating, custom_prompt: customPrompt,
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
  ]);

  async function handleGenerate() {
    if (!dealership) {
      toast.error("Please set up your dealership profile first");
      return;
    }

    setIsGenerating(true);
    setGeneratedAsset(null);

    try {
      if (isDemoMode()) {
        // Build prompt client-side and call demo API
        const vehicle = vehicleId ? vehicles.find((v) => v.id === vehicleId) : null;
        const prompt = buildPrompt({
          content_type: contentType, channel, dealership,
          vehicle: vehicle || null, headline, subheadline, cta, style,
          event_name: eventName, event_dates: eventDates,
          offer_details: offerDetails, service_offer: serviceOffer,
          service_details: serviceDetails, testimonial_text: testimonialText,
          testimonial_author: testimonialAuthor, rating, custom_prompt: customPrompt,
        });

        const aspectRatio = getAspectRatioForChannel(channel);
        const resolution = getResolutionForChannel(channel);

        const imageInput = referencePhotos.map((p) => p.url);

        const res = await fetch("/api/demo-generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            prompt,
            aspect_ratio: aspectRatio,
            resolution,
            image_input: imageInput.length > 0 ? imageInput : undefined,
          }),
        });

        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error || "Generation failed");
        }

        const { taskId } = await res.json();
        const demoAsset: GeneratedAsset = {
          id: `demo-${Date.now()}`,
          dealership_id: dealership.id,
          created_by: null,
          vehicle_id: vehicleId || null,
          content_type: contentType,
          channel,
          prompt,
          image_url: null,
          storage_path: null,
          aspect_ratio: aspectRatio,
          resolution,
          kie_task_id: taskId,
          status: "processing",
          metadata: {},
          is_favorite: false,
          campaign: campaign || null,
          created_at: new Date().toISOString(),
        };
        setGeneratedAsset(demoAsset);
        addAsset(demoAsset);
        pollDemoResult(demoAsset, taskId);
        return;
      }

      const prodImageInput = referencePhotos.map((p) => p.url);

      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content_type: contentType, channel, vehicle_id: vehicleId,
          headline, subheadline, cta, style,
          event_name: eventName, event_dates: eventDates,
          offer_details: offerDetails, service_offer: serviceOffer,
          service_details: serviceDetails, testimonial_text: testimonialText,
          testimonial_author: testimonialAuthor, rating, custom_prompt: customPrompt,
          campaign,
          image_input: prodImageInput.length > 0 ? prodImageInput : undefined,
          watermark: watermarkEnabled,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Generation failed");
      }

      const asset: GeneratedAsset = await res.json();
      setGeneratedAsset(asset);
      addAsset(asset);
      pollForResult(asset.id);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Generation failed";
      toast.error(message);
      setIsGenerating(false);
    }
  }

  async function pollDemoResult(asset: GeneratedAsset, taskId: string) {
    const maxAttempts = 60;
    let attempts = 0;

    const poll = async () => {
      attempts++;
      try {
        const res = await fetch(`/api/demo-generate?taskId=${taskId}`);
        if (!res.ok) return;
        const data = await res.json();

        if (data.status === "completed" && (data.output?.image_url || data.output?.url)) {
          const imageUrl = data.output.image_url || data.output.url;
          const updated = { ...asset, status: "completed" as const, image_url: imageUrl };
          setGeneratedAsset(updated);
          updateAsset(asset.id, updated);
          setIsGenerating(false);
          toast.success("Visual generated successfully!");
          fireWebhook(updated);
          return;
        }

        if (data.status === "failed") {
          setGeneratedAsset({ ...asset, status: "failed" });
          setIsGenerating(false);
          toast.error("Generation failed. Please try again.");
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

  async function pollForResult(assetId: string) {
    const maxAttempts = 60;
    let attempts = 0;

    const poll = async () => {
      attempts++;
      try {
        const res = await fetch(`/api/generate/${assetId}`);
        if (!res.ok) return;

        const data = await res.json();

        if (data.status === "completed" && data.image_url) {
          setGeneratedAsset(data);
          updateAsset(assetId, data);
          setIsGenerating(false);
          toast.success("Visual generated successfully!");
          fireWebhook(data);
          return;
        }

        if (data.status === "failed") {
          setGeneratedAsset(data);
          updateAsset(assetId, data);
          setIsGenerating(false);
          toast.error("Generation failed. Please try again.");
          return;
        }

        if (attempts < maxAttempts) {
          setTimeout(poll, 3000);
        } else {
          setIsGenerating(false);
          toast.error("Generation timed out. Check your library later.");
        }
      } catch {
        if (attempts < maxAttempts) {
          setTimeout(poll, 5000);
        }
      }
    };

    setTimeout(poll, 3000);
  }

  async function handleDownload() {
    if (!generatedAsset?.image_url) return;

    try {
      // Proxy through server to avoid CORS issues
      const proxyUrl = `/api/download-proxy?url=${encodeURIComponent(generatedAsset.image_url)}`;
      const res = await fetch(proxyUrl);
      if (!res.ok) throw new Error("Download failed");
      const imageBlob = await res.blob();

      // If watermark enabled and logo exists, overlay it via canvas
      if (watermarkEnabled && dealership?.logo_url) {
        try {
          const blobUrl = URL.createObjectURL(imageBlob);
          const img = new Image();
          img.src = blobUrl;
          await new Promise<void>((resolve, reject) => {
            img.onload = () => resolve();
            img.onerror = () => reject(new Error("Failed to load image"));
          });
          URL.revokeObjectURL(blobUrl);

          const canvas = document.createElement("canvas");
          canvas.width = img.width;
          canvas.height = img.height;
          const ctx = canvas.getContext("2d");
          if (!ctx) throw new Error("Canvas not supported");

          ctx.drawImage(img, 0, 0);

          // Overlay dealership logo in bottom-right corner
          const logoProxyUrl = `/api/download-proxy?url=${encodeURIComponent(dealership.logo_url)}`;
          const logoRes = await fetch(logoProxyUrl);
          if (logoRes.ok) {
            const logoBlob = await logoRes.blob();
            const logoBlobUrl = URL.createObjectURL(logoBlob);
            const logo = new Image();
            logo.src = logoBlobUrl;
            await new Promise<void>((resolve) => {
              logo.onload = () => resolve();
              logo.onerror = () => resolve();
            });
            URL.revokeObjectURL(logoBlobUrl);

            if (logo.width > 0) {
              const logoHeight = Math.max(30, Math.floor(img.height / 12));
              const logoWidth = (logo.width / logo.height) * logoHeight;
              const padding = Math.floor(img.width / 40);
              const logoX = canvas.width - padding - logoWidth;
              const logoY = canvas.height - padding - logoHeight;
              ctx.globalAlpha = 0.5;
              ctx.drawImage(logo, logoX, logoY, logoWidth, logoHeight);
              ctx.globalAlpha = 1;
            }
          }

          canvas.toBlob((blob) => {
            if (!blob) return;
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `${contentType}-${channel}-${Date.now()}.png`;
            a.click();
            URL.revokeObjectURL(url);
          }, "image/png");
          return;
        } catch {
          // Fallback to direct blob download
        }
      }

      // Direct download (no logo overlay needed)
      const url = URL.createObjectURL(imageBlob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${contentType}-${channel}-${Date.now()}.png`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      // Last resort: open in new tab
      window.open(generatedAsset.image_url, "_blank");
    }
  }

  const showVehicleSelector = [
    "vehicle-spotlight",
    "new-arrival",
    "price-drop",
    "sales-event",
    "financing",
  ].includes(contentType);

  const showEventFields = contentType === "sales-event";
  const showServiceFields = contentType === "service-promo";
  const showTestimonialFields = contentType === "testimonial";
  const showCustomPrompt = contentType === "custom";

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
                <VehicleSelector
                  vehicles={vehicles}
                  value={vehicleId}
                  onChange={setVehicleId}
                />
              )}

              <div className="space-y-2">
                <Label>Headline</Label>
                <Input
                  placeholder="Enter your main headline..."
                  value={headline}
                  onChange={(e) => setHeadline(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label>Subheadline</Label>
                <Input
                  placeholder="Supporting text..."
                  value={subheadline}
                  onChange={(e) => setSubheadline(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label>Call to Action</Label>
                <Input
                  placeholder='e.g., "Visit Today", "Call Now"'
                  value={cta}
                  onChange={(e) => setCta(e.target.value)}
                />
              </div>

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

              {/* Reference Photo Upload */}
              <ImageUploader
                value={referencePhotos}
                onChange={setReferencePhotos}
                maxFiles={3}
                label="Reference Photos (Optional)"
              />
              <p className="text-xs text-muted-foreground -mt-2">
                Upload actual vehicle photos as reference for AI generation
              </p>

              <Separator />

              {/* Watermark Toggle */}
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Logo Watermark</Label>
                  <p className="text-xs text-muted-foreground">
                    Overlay your dealership logo on downloaded images
                  </p>
                </div>
                <Switch
                  checked={watermarkEnabled}
                  onCheckedChange={setWatermarkEnabled}
                />
              </div>
            </CardContent>
          </Card>

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
                  Generate Visual
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
        </div>

        {/* Preview Sidebar */}
        <div className="space-y-4">
          <h3 className="font-heading font-semibold text-sm">Preview</h3>
          {(isGenerating || generatedAsset) && (
            <GenerationPreview
              asset={generatedAsset}
              isGenerating={isGenerating}
              onRegenerate={handleGenerate}
              onDownload={handleDownload}
              onEdit={() => setEditDialogOpen(true)}
              onAddText={() => setTextEditorOpen(true)}
            />
          )}

          {!isGenerating && !generatedAsset && (
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
      {generatedAsset?.image_url && (
        <EditImageDialog
          open={editDialogOpen}
          onOpenChange={setEditDialogOpen}
          imageUrl={generatedAsset.image_url}
          aspectRatio={generatedAsset.aspect_ratio || "1:1"}
          onEditComplete={(newUrl) => {
            const updated = { ...generatedAsset, image_url: newUrl };
            setGeneratedAsset(updated);
            updateAsset(generatedAsset.id, updated);
            toast.success("Image updated with edits!");
            fireWebhook(updated, "image.edited");
          }}
        />
      )}

      {/* Text Overlay Editor */}
      {generatedAsset?.image_url && (
        <TextOverlayEditor
          open={textEditorOpen}
          onOpenChange={setTextEditorOpen}
          imageUrl={generatedAsset.image_url}
          onSave={(dataUrl) => {
            const updated = { ...generatedAsset, image_url: dataUrl };
            setGeneratedAsset(updated);
            updateAsset(generatedAsset.id, updated);
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
