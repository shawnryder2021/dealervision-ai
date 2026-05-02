"use client";

import { useMemo, useState } from "react";
import { Copy, MessageCircle, Sparkles, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { useAppStore } from "@/lib/store";
import { toast } from "sonner";

type ReplyTone = "excited" | "informative" | "closing";

const TONES: { value: ReplyTone; label: string; desc: string }[] = [
  { value: "excited", label: "Excited", desc: "Warm, mirror the customer's energy" },
  { value: "informative", label: "Informative", desc: "Helpful, factual, no hype" },
  { value: "closing", label: "Closing", desc: "Confident, propose a next step" },
];

export default function LeadReplyPage() {
  const { dealership, vehicles } = useAppStore();
  const [inquiry, setInquiry] = useState("");
  const [vehicleId, setVehicleId] = useState<string>("");
  const [salespersonName, setSalespersonName] = useState("");
  const [drafts, setDrafts] = useState<Record<ReplyTone, string>>({
    excited: "",
    informative: "",
    closing: "",
  });
  const [busy, setBusy] = useState<ReplyTone | "all" | null>(null);

  const vehicle = useMemo(() => vehicles.find((v) => v.id === vehicleId) || null, [vehicleId, vehicles]);

  const draftOne = async (tone: ReplyTone): Promise<string> => {
    const res = await fetch("/api/lead-reply", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        inquiry,
        tone,
        dealership,
        vehicle,
        salespersonName: salespersonName || undefined,
      }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || "Failed");
    }
    const data = await res.json();
    return data.reply as string;
  };

  const handleDraftAll = async () => {
    if (!inquiry.trim()) {
      toast.error("Paste the customer's inquiry first.");
      return;
    }
    setBusy("all");
    try {
      const results = await Promise.all(TONES.map((t) => draftOne(t.value).then((reply) => [t.value, reply] as const)));
      setDrafts({
        excited: "",
        informative: "",
        closing: "",
        ...Object.fromEntries(results),
      } as Record<ReplyTone, string>);
      toast.success("3 replies drafted");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to draft");
    } finally {
      setBusy(null);
    }
  };

  const handleRedraft = async (tone: ReplyTone) => {
    if (!inquiry.trim()) return;
    setBusy(tone);
    try {
      const reply = await draftOne(tone);
      setDrafts((d) => ({ ...d, [tone]: reply }));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed");
    } finally {
      setBusy(null);
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
          <MessageCircle className="h-6 w-6 text-primary" />
          Lead Reply Assistant
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Paste a customer inquiry from Cars.com, AutoTrader, Facebook Marketplace, or your website. Get 3 ready-to-send drafts in your dealership&apos;s voice.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Customer inquiry</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="inquiry">Paste the message</Label>
            <Textarea
              id="inquiry"
              rows={5}
              placeholder="Hi, is the 2022 RAV4 still available? What's the lowest you can do? Also do you take trades? Thanks — Sarah"
              value={inquiry}
              onChange={(e) => setInquiry(e.target.value)}
              className="mt-1"
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Vehicle they&apos;re asking about (optional)</Label>
              <Select value={vehicleId} onValueChange={(v) => setVehicleId(v ?? "")}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="No specific vehicle" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">No specific vehicle</SelectItem>
                  {vehicles.map((v) => (
                    <SelectItem key={v.id} value={v.id}>
                      {[v.year, v.make, v.model, v.trim].filter(Boolean).join(" ")}
                      {v.stock_number ? ` — #${v.stock_number}` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="sp">Sign as (optional)</Label>
              <Input
                id="sp"
                placeholder="e.g. Mike Rivera"
                value={salespersonName}
                onChange={(e) => setSalespersonName(e.target.value)}
                className="mt-1"
              />
            </div>
          </div>
          <Button onClick={handleDraftAll} disabled={busy !== null || !inquiry.trim()}>
            {busy === "all" ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Drafting 3 replies…
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4 mr-2" />
                Draft 3 replies
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {TONES.map((t) => (
          <Card key={t.value}>
            <CardHeader>
              <CardTitle className="text-sm flex items-center justify-between">
                {t.label}
                <Button
                  size="sm"
                  variant="ghost"
                  disabled={!drafts[t.value] || busy !== null}
                  onClick={() => copy(drafts[t.value])}
                >
                  <Copy className="h-3.5 w-3.5" />
                </Button>
              </CardTitle>
              <p className="text-xs text-muted-foreground">{t.desc}</p>
            </CardHeader>
            <CardContent className="space-y-3">
              <Textarea
                rows={10}
                value={drafts[t.value]}
                onChange={(e) => setDrafts((d) => ({ ...d, [t.value]: e.target.value }))}
                placeholder="Click 'Draft 3 replies' to fill this in…"
                className="text-sm"
              />
              <Button size="sm" variant="outline" className="w-full" onClick={() => handleRedraft(t.value)} disabled={busy !== null || !inquiry.trim()}>
                {busy === t.value ? <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" /> : <Sparkles className="h-3.5 w-3.5 mr-1" />}
                Re-draft
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
