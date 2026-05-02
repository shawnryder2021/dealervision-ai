"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Video, Loader2, Sparkles, Play, Pause, Volume2, VolumeX, Camera } from "lucide-react";
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
import { toast } from "sonner";

interface ScriptBeat {
  label: string;
  voiceover: string;
  duration_sec: number;
}
interface WalkaroundScript {
  title: string;
  hook: string;
  beats: ScriptBeat[];
  cta_overlay: string;
}

export default function WalkaroundVideoPage() {
  const { dealership, vehicles } = useAppStore();
  const [vehicleId, setVehicleId] = useState("");
  const [script, setScript] = useState<WalkaroundScript | null>(null);
  const [busy, setBusy] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(false);
  const [beatIndex, setBeatIndex] = useState(0);
  const stageRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const vehicle = useMemo(() => vehicles.find((v) => v.id === vehicleId) || null, [vehicleId, vehicles]);
  const photos = vehicle?.photos || [];

  const generate = async () => {
    if (!vehicle) {
      toast.error("Pick a vehicle");
      return;
    }
    setBusy(true);
    setScript(null);
    setPlaying(false);
    try {
      const res = await fetch("/api/walkaround/script", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ vehicle, dealership }),
      });
      if (!res.ok) throw new Error((await res.json()).error || "Failed");
      const data = await res.json();
      setScript(data.script as WalkaroundScript);
      toast.success("Script ready — hit play");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed");
    } finally {
      setBusy(false);
    }
  };

  // Speech + photo cycling driven by beat index
  useEffect(() => {
    if (!playing || !script) return;
    if (beatIndex >= script.beats.length) {
      setPlaying(false);
      setBeatIndex(0);
      window.speechSynthesis.cancel();
      return;
    }
    const beat = script.beats[beatIndex];
    if (!muted && typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      const utter = new SpeechSynthesisUtterance(beat.voiceover);
      utter.rate = 1.05;
      utter.pitch = 1.0;
      window.speechSynthesis.speak(utter);
    }
    timerRef.current = setTimeout(() => setBeatIndex((i) => i + 1), beat.duration_sec * 1000);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [playing, beatIndex, script, muted]);

  const togglePlay = () => {
    if (!script) return;
    if (playing) {
      setPlaying(false);
      window.speechSynthesis.cancel();
      if (timerRef.current) clearTimeout(timerRef.current);
    } else {
      setBeatIndex(0);
      setPlaying(true);
    }
  };

  const currentPhoto = photos[beatIndex % Math.max(photos.length, 1)] || "";
  const totalDuration = script?.beats.reduce((a, b) => a + b.duration_sec, 0) || 0;
  const beatProgress = script ? ((beatIndex + 1) / script.beats.length) * 100 : 0;

  return (
    <div className="space-y-6 max-w-6xl">
      <div>
        <h1 className="font-heading text-2xl font-bold flex items-center gap-2">
          <Video className="h-6 w-6 text-primary" />
          Walkaround Video
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Pick a vehicle. We script a 25-second vertical reel with narration synced to your photos. Screen-record the playback and post it to Reels, Shorts, or TikTok.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <Card className="lg:col-span-2">
          <CardContent className="pt-6 space-y-4">
            <div>
              <Label>Vehicle</Label>
              <Select value={vehicleId} onValueChange={(v) => setVehicleId(v ?? "")}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Pick a vehicle" />
                </SelectTrigger>
                <SelectContent>
                  {vehicles.filter((v) => v.photos?.length).map((v) => (
                    <SelectItem key={v.id} value={v.id}>
                      {[v.year, v.make, v.model, v.trim].filter(Boolean).join(" ")}
                      {v.stock_number ? ` — #${v.stock_number}` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground mt-1">
                Vehicle must have at least one photo. Add more for richer cuts.
              </p>
            </div>

            <Button onClick={generate} disabled={busy || !vehicle} className="w-full">
              {busy ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Writing script…
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 mr-2" /> Generate script
                </>
              )}
            </Button>

            {script && (
              <div className="space-y-3 mt-4 text-sm">
                <div>
                  <p className="font-semibold">{script.title}</p>
                  <p className="text-xs text-muted-foreground italic mt-0.5">&ldquo;{script.hook}&rdquo;</p>
                </div>
                <ol className="space-y-2">
                  {script.beats.map((b, i) => (
                    <li
                      key={i}
                      className={`text-xs p-2 rounded border ${
                        i === beatIndex && playing ? "border-primary bg-primary/10" : "border-transparent"
                      }`}
                    >
                      <span className="font-semibold">
                        {b.label} ({b.duration_sec}s)
                      </span>
                      <p className="text-muted-foreground">{b.voiceover}</p>
                    </li>
                  ))}
                </ol>
                <p className="text-xs text-muted-foreground">
                  Total runtime: {totalDuration}s · CTA overlay: <strong>{script.cta_overlay}</strong>
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-3">
          <CardContent className="pt-6 space-y-3">
            <div
              ref={stageRef}
              className="relative w-full aspect-[9/16] max-w-sm mx-auto bg-black rounded-lg overflow-hidden"
            >
              {currentPhoto ? (
                <>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    key={beatIndex}
                    src={currentPhoto}
                    alt=""
                    className="absolute inset-0 w-full h-full object-cover"
                    style={{
                      animation: playing ? "kenburns 6s ease-out forwards" : "none",
                    }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/30" />
                  {script && playing && (
                    <>
                      <div className="absolute top-4 left-4 right-4 text-white">
                        <p className="text-xs uppercase tracking-widest opacity-70">{script.beats[beatIndex]?.label}</p>
                        <p className="text-lg font-bold leading-tight mt-1">{script.title}</p>
                      </div>
                      <div className="absolute bottom-20 left-4 right-4 text-white">
                        <p className="text-base font-medium leading-snug">{script.beats[beatIndex]?.voiceover}</p>
                      </div>
                      <div className="absolute bottom-6 left-4 right-4">
                        <div className="bg-white text-black text-center font-bold py-2 rounded-md">
                          {script.cta_overlay}
                        </div>
                      </div>
                      <div className="absolute bottom-1 left-0 right-0 h-1 bg-white/20">
                        <div className="h-full bg-white transition-all duration-300" style={{ width: `${beatProgress}%` }} />
                      </div>
                    </>
                  )}
                  {!playing && script && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                      <Play className="h-16 w-16 text-white opacity-90" />
                    </div>
                  )}
                </>
              ) : (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-white/60 text-sm">
                  <Camera className="h-12 w-12 mb-2 opacity-40" />
                  Pick a vehicle with photos
                </div>
              )}
            </div>

            <div className="flex justify-center gap-2">
              <Button onClick={togglePlay} disabled={!script}>
                {playing ? <Pause className="h-4 w-4 mr-1" /> : <Play className="h-4 w-4 mr-1" />}
                {playing ? "Pause" : script ? "Play preview" : "Generate first"}
              </Button>
              <Button variant="outline" onClick={() => setMuted((m) => !m)}>
                {muted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
              </Button>
            </div>

            <p className="text-xs text-muted-foreground text-center">
              Tip: use your phone&apos;s screen recorder while the preview plays full-screen, then upload to Reels/Shorts/TikTok.
            </p>
          </CardContent>
        </Card>
      </div>

      <style jsx>{`
        @keyframes kenburns {
          0% { transform: scale(1.0) translate(0, 0); }
          100% { transform: scale(1.15) translate(-2%, -2%); }
        }
      `}</style>
    </div>
  );
}
