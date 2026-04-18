"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import {
  Sparkles, Play, CheckCircle2, XCircle, Loader2, Clock,
  ArrowLeft, ArrowRight, Image as ImageIcon, Library, ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { useAppStore } from "@/lib/store";
import { CAMPAIGN_PRESETS, PRESET_COLOR_MAP } from "@/lib/campaign-presets";
import { CHANNEL_PRESETS, STYLE_OPTIONS } from "@/lib/constants";
import { toast } from "sonner";
import Link from "next/link";
import type { Vehicle } from "@/lib/types";
import { createClient } from "@/lib/supabase/client";
import { isDemoMode } from "@/lib/demo-data";

interface CampaignJob {
  content_type: string;
  channel: string;
  channelName: string;
  status: "queued" | "generating" | "completed" | "failed";
  assetId?: string;
  imageUrl?: string;
}

const MAX_CONCURRENT = 3;

type Step = "pick" | "details" | "review" | "running" | "done";

export default function CampaignsPage() {
  const { dealership, vehicles: storeVehicles, adminActiveDealership } = useAppStore();
  const [step, setStep] = useState<Step>("pick");
  const [selectedPresetId, setSelectedPresetId] = useState<string | null>(null);
  const [campaignName, setCampaignName] = useState("");
  const [style, setStyle] = useState("photorealistic");
  const [vehicleId, setVehicleId] = useState<string>("");
  const [headline, setHeadline] = useState("");
  const [eventName, setEventName] = useState("");
  const [eventDates, setEventDates] = useState("");
  const [offerDetails, setOfferDetails] = useState("");
  const [serviceOffer, setServiceOffer] = useState("");
  const [serviceDetails, setServiceDetails] = useState("");
  const [jobs, setJobs] = useState<CampaignJob[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const jobsRef = useRef<CampaignJob[]>([]);

  const preset = CAMPAIGN_PRESETS.find((p) => p.id === selectedPresetId);

  useEffect(() => {
    if (isDemoMode()) { setVehicles(storeVehicles); return; }
    if (!dealership) return;
    const supabase = createClient();
    supabase.from("vehicles").select("*").eq("dealership_id", dealership.id)
      .order("created_at", { ascending: false })
      .then(({ data }: { data: Vehicle[] | null }) => { if (data) setVehicles(data); });
  }, [dealership, storeVehicles]);

  const updateJob = useCallback((idx: number, updates: Partial<CampaignJob>) => {
    setJobs((prev) => {
      const next = prev.map((j, i) => i === idx ? { ...j, ...updates } : j);
      jobsRef.current = next;
      return next;
    });
  }, []);

  function handlePickPreset(presetId: string) {
    const p = CAMPAIGN_PRESETS.find((x) => x.id === presetId)!;
    setSelectedPresetId(presetId);
    setHeadline(p.defaultHeadline || "");
    setCampaignName(p.name);
    setStep("details");
  }

  function buildJobList(): CampaignJob[] {
    if (!preset) return [];
    return preset.jobs.map((j) => ({
      content_type: j.content_type,
      channel: j.channel,
      channelName: CHANNEL_PRESETS.find((c) => c.id === j.channel)?.name || j.channel,
      status: "queued",
    }));
  }

  async function pollForResult(jobIdx: number, assetId: string) {
    let attempts = 0;
    const maxAttempts = 60;

    const poll = async () => {
      attempts++;
      try {
        const res = await fetch(`/api/generate/${assetId}`);
        if (!res.ok) {
          if (attempts < maxAttempts) return setTimeout(poll, 3000);
          updateJob(jobIdx, { status: "failed" });
          return;
        }
        const data = await res.json();
        if (data.status === "completed" && data.image_url) {
          updateJob(jobIdx, { status: "completed", imageUrl: data.image_url });
          return;
        }
        if (data.status === "failed") {
          updateJob(jobIdx, { status: "failed" });
          return;
        }
        if (attempts < maxAttempts) setTimeout(poll, 3000);
        else updateJob(jobIdx, { status: "failed" });
      } catch {
        if (attempts < maxAttempts) setTimeout(poll, 5000);
        else updateJob(jobIdx, { status: "failed" });
      }
    };
    setTimeout(poll, 3000);
  }

  async function processJob(job: CampaignJob, idx: number) {
    updateJob(idx, { status: "generating" });
    try {
      const body: Record<string, unknown> = {
        content_type: job.content_type,
        channel: job.channel,
        style,
        campaign: campaignName,
        headline: headline || undefined,
        event_name: eventName || undefined,
        event_dates: eventDates || undefined,
        offer_details: offerDetails || undefined,
        service_offer: serviceOffer || undefined,
        service_details: serviceDetails || undefined,
        vehicle_id: vehicleId || undefined,
      };

      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (adminActiveDealership) headers["X-Dealership-Id"] = adminActiveDealership.id;

      const res = await fetch("/api/generate", {
        method: "POST",
        headers,
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        toast.error(`Job failed (${job.channelName}): ${err.error || res.statusText}`);
        updateJob(idx, { status: "failed" });
        return;
      }

      const asset = await res.json();
      updateJob(idx, { assetId: asset.id });
      await pollForResult(idx, asset.id);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      toast.error(`Job error (${job.channelName}): ${msg}`);
      updateJob(idx, { status: "failed" });
    }
  }

  async function handleGenerate() {
    if (!dealership) { toast.error("No dealership found"); return; }

    const newJobs = buildJobList();
    setJobs(newJobs);
    jobsRef.current = newJobs;
    setStep("running");
    setIsRunning(true);

    let running = 0;
    let index = 0;
    let finished = 0;

    await new Promise<void>((resolve) => {
      function next() {
        while (running < MAX_CONCURRENT && index < newJobs.length) {
          running++;
          const i = index++;
          processJob(newJobs[i], i).finally(() => {
            running--;
            finished++;
            if (finished >= newJobs.length) resolve();
            else next();
          });
        }
      }
      next();
    });

    setIsRunning(false);
    setStep("done");
    const completedCount = jobsRef.current.filter((j) => j.status === "completed").length;
    toast.success(`Campaign complete! ${completedCount}/${newJobs.length} assets generated.`);
  }

  const completedCount = jobs.filter((j) => j.status === "completed").length;
  const failedCount = jobs.filter((j) => j.status === "failed").length;
  const progress = jobs.length > 0 ? ((completedCount + failedCount) / jobs.length) * 100 : 0;

  // ── Step: Pick preset ───────────────────────────────────────────────────────
  if (step === "pick") {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-heading font-bold tracking-tight flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-primary" />
            Campaign Bundles
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Generate a complete set of marketing assets across every channel in one go
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {CAMPAIGN_PRESETS.map((p) => {
            const colors = PRESET_COLOR_MAP[p.color];
            return (
              <button
                key={p.id}
                onClick={() => handlePickPreset(p.id)}
                className={`text-left rounded-xl border p-5 transition-all hover:shadow-md hover:-translate-y-0.5 ${colors.border} ${colors.bg}`}
              >
                <div className="text-3xl mb-3">{p.icon}</div>
                <h3 className={`font-semibold text-base mb-1 ${colors.text}`}>{p.name}</h3>
                <p className="text-sm text-muted-foreground mb-3 leading-snug">{p.description}</p>
                <div className="flex flex-wrap gap-1">
                  {p.jobs.map((j, i) => (
                    <span key={i} className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${colors.badge}`}>
                      {CHANNEL_PRESETS.find((c) => c.id === j.channel)?.name || j.channel}
                    </span>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground mt-3 flex items-center gap-1">
                  {p.jobs.length} assets <ChevronRight className="h-3 w-3" />
                </p>
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  // ── Step: Details ───────────────────────────────────────────────────────────
  if (step === "details" && preset) {
    const colors = PRESET_COLOR_MAP[preset.color];
    const showVehicle = preset.fields.includes("vehicle");
    const showEventName = preset.fields.includes("event_name");
    const showEventDates = preset.fields.includes("event_dates");
    const showOfferDetails = preset.fields.includes("offer_details");
    const showServiceOffer = preset.fields.includes("service_offer");
    const showServiceDetails = preset.fields.includes("service_details");

    return (
      <div className="space-y-6 max-w-2xl">
        <div className="flex items-center gap-3">
          <button onClick={() => setStep("pick")} className="text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-2xl font-heading font-bold tracking-tight flex items-center gap-2">
              <span className="text-2xl">{preset.icon}</span>
              {preset.name}
            </h1>
            <p className="text-muted-foreground text-sm mt-0.5">{preset.description}</p>
          </div>
        </div>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Campaign Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="campaign-name">Campaign Name *</Label>
              <Input
                id="campaign-name"
                value={campaignName}
                onChange={(e) => setCampaignName(e.target.value)}
                placeholder="e.g. End of Month Sale - April"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="headline">Headline</Label>
              <Input
                id="headline"
                value={headline}
                onChange={(e) => setHeadline(e.target.value)}
                placeholder={preset.defaultHeadline || "Main headline for the campaign"}
              />
            </div>

            {showEventName && (
              <div className="space-y-1.5">
                <Label htmlFor="event-name">Event Name</Label>
                <Input id="event-name" value={eventName} onChange={(e) => setEventName(e.target.value)} placeholder="e.g. Spring Sales Event" />
              </div>
            )}
            {showEventDates && (
              <div className="space-y-1.5">
                <Label htmlFor="event-dates">Event Dates</Label>
                <Input id="event-dates" value={eventDates} onChange={(e) => setEventDates(e.target.value)} placeholder="e.g. April 28–30" />
              </div>
            )}
            {showOfferDetails && (
              <div className="space-y-1.5">
                <Label htmlFor="offer">Offer Details</Label>
                <Input id="offer" value={offerDetails} onChange={(e) => setOfferDetails(e.target.value)} placeholder="e.g. Up to $5,000 off MSRP" />
              </div>
            )}
            {showServiceOffer && (
              <div className="space-y-1.5">
                <Label htmlFor="service-offer">Service Offer</Label>
                <Input id="service-offer" value={serviceOffer} onChange={(e) => setServiceOffer(e.target.value)} placeholder="e.g. Oil Change & Tire Rotation" />
              </div>
            )}
            {showServiceDetails && (
              <div className="space-y-1.5">
                <Label htmlFor="service-details">Service Details</Label>
                <Textarea id="service-details" value={serviceDetails} onChange={(e) => setServiceDetails(e.target.value)} placeholder="Additional service offer details..." rows={2} />
              </div>
            )}
            {showVehicle && vehicles.length > 0 && (
              <div className="space-y-1.5">
                <Label htmlFor="vehicle">Featured Vehicle (optional)</Label>
                <select
                  id="vehicle"
                  value={vehicleId}
                  onChange={(e) => setVehicleId(e.target.value)}
                  className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                >
                  <option value="">No specific vehicle</option>
                  {vehicles.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.year} {v.make} {v.model} {v.trim || ""}
                      {v.price ? ` — $${v.price.toLocaleString()}` : ""}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Visual Style</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {STYLE_OPTIONS.map((s) => (
                <button
                  key={s.id}
                  onClick={() => setStyle(s.id)}
                  className={`rounded-lg border px-3 py-2 text-xs font-medium transition-all ${
                    style === s.id ? "border-primary bg-primary/10 text-primary" : "hover:border-primary/30"
                  }`}
                >
                  {s.name}
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        <Button
          className="w-full gradient-primary text-white gap-2"
          onClick={() => setStep("review")}
          disabled={!campaignName.trim()}
        >
          Review Campaign
          <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
    );
  }

  // ── Step: Review ────────────────────────────────────────────────────────────
  if (step === "review" && preset) {
    const colors = PRESET_COLOR_MAP[preset.color];
    const reviewJobs = buildJobList();
    const selectedVehicle = vehicles.find((v) => v.id === vehicleId);

    return (
      <div className="space-y-6 max-w-2xl">
        <div className="flex items-center gap-3">
          <button onClick={() => setStep("details")} className="text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-2xl font-heading font-bold tracking-tight">Review Campaign</h1>
            <p className="text-muted-foreground text-sm">{campaignName}</p>
          </div>
        </div>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Campaign Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex justify-between"><span className="text-muted-foreground">Campaign Name</span><span className="font-medium">{campaignName}</span></div>
            {headline && <div className="flex justify-between"><span className="text-muted-foreground">Headline</span><span className="font-medium">{headline}</span></div>}
            {eventName && <div className="flex justify-between"><span className="text-muted-foreground">Event</span><span className="font-medium">{eventName}</span></div>}
            {eventDates && <div className="flex justify-between"><span className="text-muted-foreground">Dates</span><span className="font-medium">{eventDates}</span></div>}
            {offerDetails && <div className="flex justify-between"><span className="text-muted-foreground">Offer</span><span className="font-medium">{offerDetails}</span></div>}
            {selectedVehicle && <div className="flex justify-between"><span className="text-muted-foreground">Vehicle</span><span className="font-medium">{selectedVehicle.year} {selectedVehicle.make} {selectedVehicle.model}</span></div>}
            <div className="flex justify-between"><span className="text-muted-foreground">Style</span><span className="font-medium capitalize">{style.replace("-", " ")}</span></div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center justify-between">
              Assets to Generate
              <Badge variant="outline">{reviewJobs.length} total</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {reviewJobs.map((j, i) => (
                <div key={i} className="flex items-center justify-between py-1.5 border-b last:border-0 text-sm">
                  <span className="capitalize text-muted-foreground">{j.content_type.replace("-", " ")}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${PRESET_COLOR_MAP[preset.color].badge}`}>{j.channelName}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Button
          className="w-full gradient-primary text-white gap-2"
          onClick={handleGenerate}
        >
          <Play className="h-4 w-4" />
          Generate All {reviewJobs.length} Assets
        </Button>
      </div>
    );
  }

  // ── Step: Running / Done ────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-heading font-bold tracking-tight flex items-center gap-2">
            {isRunning ? <Loader2 className="h-6 w-6 text-primary animate-spin" /> : <CheckCircle2 className="h-6 w-6 text-green-500" />}
            {isRunning ? "Generating Campaign…" : "Campaign Complete!"}
          </h1>
          <p className="text-muted-foreground text-sm mt-1">{campaignName}</p>
        </div>
        {step === "done" && (
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => { setStep("pick"); setJobs([]); }}>
              New Campaign
            </Button>
            <Link
              href={`/dashboard/library?campaign=${encodeURIComponent(campaignName)}`}
              className="inline-flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium gradient-primary text-white"
            >
              <Library className="h-4 w-4" />
              View in Library
            </Link>
          </div>
        )}
      </div>

      {/* Progress */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium">
              {isRunning ? `Generating ${completedCount + failedCount + 1} of ${jobs.length}…` : `${completedCount} of ${jobs.length} completed`}
            </p>
            <div className="flex items-center gap-3 text-xs">
              <span className="flex items-center gap-1 text-green-600"><CheckCircle2 className="h-3 w-3" />{completedCount}</span>
              {failedCount > 0 && <span className="flex items-center gap-1 text-red-500"><XCircle className="h-3 w-3" />{failedCount}</span>}
              <span className="text-muted-foreground">{jobs.length} total</span>
            </div>
          </div>
          <Progress value={progress} className="h-2" />
        </CardContent>
      </Card>

      {/* Image grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3">
        {jobs.map((job, i) => (
          <div key={i} className={`rounded-xl border overflow-hidden transition-all ${
            job.status === "completed" ? "border-green-500/30" :
            job.status === "failed" ? "border-red-500/30" : "border-border"
          }`}>
            <div className="relative aspect-square bg-muted">
              {job.imageUrl ? (
                <img src={job.imageUrl} alt={job.channelName} className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full items-center justify-center">
                  {job.status === "generating" ? <Loader2 className="h-6 w-6 animate-spin text-primary/40" /> :
                   job.status === "queued" ? <Clock className="h-6 w-6 text-muted-foreground/30" /> :
                   job.status === "failed" ? <XCircle className="h-6 w-6 text-red-400/50" /> :
                   <ImageIcon className="h-6 w-6 text-muted-foreground/30" />}
                </div>
              )}
              <div className="absolute top-1.5 right-1.5">
                <Badge variant="secondary" className={`text-[9px] px-1.5 ${
                  job.status === "completed" ? "bg-green-500/20 text-green-600" :
                  job.status === "generating" ? "bg-blue-500/20 text-blue-600" :
                  job.status === "failed" ? "bg-red-500/20 text-red-600" : "bg-muted"
                }`}>
                  {job.status === "generating" && <Loader2 className="h-2 w-2 mr-0.5 animate-spin" />}
                  {job.status}
                </Badge>
              </div>
            </div>
            <div className="p-2">
              <p className="text-[10px] font-medium truncate text-muted-foreground">{job.channelName}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
