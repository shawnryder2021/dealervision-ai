"use client";

import { useState } from "react";
import { Sparkles, Loader2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Dealership, Vehicle } from "@/lib/types";
import { toast } from "sonner";

interface Props {
  open: boolean;
  onClose: () => void;
  dealership: Dealership | null;
  vehicle: Vehicle | null;
  onPick: (headline: string) => void;
}

const TONES = [
  { value: "any", label: "Any (mix of styles)" },
  { value: "excited", label: "Excited & punchy" },
  { value: "value", label: "Value / price-focused" },
  { value: "urgency", label: "Urgent (today only)" },
  { value: "premium", label: "Premium / luxury" },
  { value: "family", label: "Family-friendly" },
];

export function AIHeadlineDialog({ open, onClose, dealership, vehicle, onPick }: Props) {
  const [goal, setGoal] = useState("");
  const [tone, setTone] = useState("any");
  const [busy, setBusy] = useState(false);
  const [results, setResults] = useState<string[]>([]);

  const generate = async () => {
    setBusy(true);
    setResults([]);
    try {
      const res = await fetch("/api/canvas/headline", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          goal: goal || (vehicle ? "Promote this vehicle" : "Promote our dealership"),
          tone,
          dealership,
          vehicle,
        }),
      });
      if (!res.ok) throw new Error((await res.json()).error || "Failed");
      const data = await res.json();
      setResults(data.headlines || []);
      if (!data.headlines?.length) toast.error("No headlines returned");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" /> AI Headlines
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <Label className="text-xs">Goal (optional)</Label>
            <Input
              value={goal}
              onChange={(e) => setGoal(e.target.value)}
              placeholder={vehicle ? "e.g. Memorial Day Sale, financing focus" : "What is this design for?"}
              className="mt-1"
            />
          </div>
          <div>
            <Label className="text-xs">Tone</Label>
            <Select value={tone} onValueChange={(v) => v && setTone(v)}>
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TONES.map((t) => (
                  <SelectItem key={t.value} value={t.value}>
                    {t.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button onClick={generate} disabled={busy} className="w-full">
            {busy ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Writing 5 headlines…
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4 mr-2" /> Generate
              </>
            )}
          </Button>
          {results.length > 0 && (
            <div className="space-y-1.5 mt-2">
              <Label className="text-xs">Click to insert as a text element:</Label>
              {results.map((h, i) => (
                <button
                  key={i}
                  onClick={() => {
                    onPick(h);
                    onClose();
                  }}
                  className="w-full text-left p-2 rounded border hover:border-primary hover:bg-primary/5 text-sm flex items-start gap-2"
                >
                  <Plus className="h-3.5 w-3.5 mt-1 shrink-0 text-primary" />
                  <span>{h}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
