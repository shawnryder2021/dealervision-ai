"use client";

import { useMemo, useState } from "react";
import { Columns3, Loader2, Sparkles, Download, X, Plus, Car } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAppStore } from "@/lib/store";
import type { Vehicle } from "@/lib/types";
import { toast } from "sonner";

const MAX = 3;

export default function ComparisonPage() {
  const { dealership, vehicles } = useAppStore();
  const [pickedIds, setPickedIds] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [generated, setGenerated] = useState<string>("");

  const picked = useMemo(
    () => pickedIds.map((id) => vehicles.find((v) => v.id === id)).filter(Boolean) as Vehicle[],
    [pickedIds, vehicles]
  );

  const add = (id: string) => {
    if (!id) return;
    if (pickedIds.includes(id)) return;
    if (pickedIds.length >= MAX) {
      toast.error(`Max ${MAX} vehicles per comparison`);
      return;
    }
    setPickedIds([...pickedIds, id]);
  };
  const remove = (id: string) => setPickedIds(pickedIds.filter((p) => p !== id));

  const buildComparisonPrompt = () => {
    const heads = picked
      .map((v) => `${v.year ?? ""} ${v.make ?? ""} ${v.model ?? ""} ${v.trim ?? ""}`.trim())
      .join(" vs. ");
    const cells = picked
      .map(
        (v, i) =>
          `Column ${i + 1}: "${v.year} ${v.make} ${v.model}${v.trim ? ` ${v.trim}` : ""}". Price: ${v.price ? `$${v.price.toLocaleString()}` : "Call"}. Mileage: ${v.mileage ? `${v.mileage.toLocaleString()} mi` : "—"}. Stock: ${v.stock_number || "—"}.`
      )
      .join(" ");
    return `Side-by-side automotive comparison social media graphic, square 1:1 format. Bold headline at top: "${heads}". ${cells} Render the comparison as a clean ${picked.length}-column grid with each vehicle's photo at the top of its column, followed by clearly typeset specs (Price, Mileage, Stock #), with subtle vertical dividers between columns. Dealership name and contact bar at the bottom. Style: modern, high-contrast, professional automotive marketing. ${dealership?.name ? `Dealership: ${dealership.name}.` : ""} ${dealership?.brand_colors ? `Brand colors: primary ${dealership.brand_colors.primary}, accent ${dealership.brand_colors.accent}.` : ""} All text crisp and legible.`;
  };

  const generate = async () => {
    if (picked.length < 2) {
      toast.error("Pick at least 2 vehicles");
      return;
    }
    setBusy(true);
    setGenerated("");
    try {
      const start = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content_type: "custom",
          channel: "instagram-post",
          custom_prompt: buildComparisonPrompt(),
          style: "Modern",
          campaign: "Vehicle Comparison",
        }),
      });
      if (!start.ok) {
        const err = await start.json().catch(() => ({}));
        throw new Error(err.error || "Failed to start");
      }
      const startData = await start.json();
      const taskId = startData.taskId;
      const model = startData.model || "kie-nano-banana";

      // Poll
      const deadline = Date.now() + 5 * 60 * 1000;
      while (Date.now() < deadline) {
        await new Promise((r) => setTimeout(r, 2500));
        const poll = await fetch(`/api/generate/${taskId}?model=${model}`);
        if (!poll.ok) continue;
        const data = await poll.json();
        if (data.status === "completed" && data.image_url) {
          setGenerated(data.image_url);
          toast.success("Comparison ready");
          return;
        }
        if (data.status === "failed") throw new Error(data.error || "Generation failed");
      }
      throw new Error("Timed out");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl">
      <div>
        <h1 className="font-heading text-2xl font-bold flex items-center gap-2">
          <Columns3 className="h-6 w-6 text-primary" />
          Vehicle Comparison Generator
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Pick up to 3 vehicles. We&apos;ll generate a side-by-side comparison graphic for social.
        </p>
      </div>

      <Card>
        <CardContent className="pt-6 space-y-4">
          <div>
            <Label>Add vehicle</Label>
            <Select value="" onValueChange={(v) => add(v ?? "")}>
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Pick a vehicle to add to the comparison" />
              </SelectTrigger>
              <SelectContent>
                {vehicles
                  .filter((v) => !pickedIds.includes(v.id))
                  .map((v) => (
                    <SelectItem key={v.id} value={v.id}>
                      {[v.year, v.make, v.model, v.trim].filter(Boolean).join(" ")}
                      {v.stock_number ? ` — #${v.stock_number}` : ""}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>

          {picked.length > 0 && (
            <div className={`grid gap-3 grid-cols-1 sm:grid-cols-${Math.min(picked.length, 3)}`}>
              {picked.map((v) => (
                <Card key={v.id} className="relative">
                  <CardContent className="pt-6">
                    <button
                      onClick={() => remove(v.id)}
                      className="absolute top-2 right-2 p-1 rounded hover:bg-muted"
                    >
                      <X className="h-4 w-4 text-muted-foreground" />
                    </button>
                    {v.photos?.[0] ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={v.photos[0]} alt="" className="w-full aspect-video object-cover rounded" />
                    ) : (
                      <div className="aspect-video bg-muted rounded flex items-center justify-center">
                        <Car className="h-8 w-8 text-muted-foreground" />
                      </div>
                    )}
                    <p className="font-semibold mt-2 text-sm">
                      {v.year} {v.make} {v.model}
                    </p>
                    <p className="text-xs text-muted-foreground">{v.trim}</p>
                    <div className="mt-2 text-xs space-y-0.5">
                      {v.price && <p>${v.price.toLocaleString()}</p>}
                      {v.mileage && <p>{v.mileage.toLocaleString()} mi</p>}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          <Button onClick={generate} disabled={busy || picked.length < 2} className="w-full sm:w-auto">
            {busy ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Sparkles className="h-4 w-4 mr-2" />}
            Generate Comparison Graphic
          </Button>
        </CardContent>
      </Card>

      {generated && (
        <Card>
          <CardContent className="pt-6 space-y-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={generated} alt="" className="w-full rounded border" />
            <a href={generated} download target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-sm text-primary hover:underline">
              <Download className="h-4 w-4" /> Download
            </a>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
