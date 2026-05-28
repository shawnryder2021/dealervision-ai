"use client";

import { useState } from "react";
import { Sparkles, Loader2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import type { Dealership, Vehicle } from "@/lib/types";
import { toast } from "sonner";

type CopyKind = "headline" | "subheadline" | "cta";

interface Props {
  kind: CopyKind;
  dealership: Dealership | null;
  /** Resolved vehicle (inventory row or inline) for context, may be null. */
  vehicle: Partial<Vehicle> | null;
  /** Short description of the content type, used as the generation goal. */
  goal?: string;
  onPick: (text: string) => void;
}

const LABELS: Record<CopyKind, string> = {
  headline: "headline",
  subheadline: "subheadline",
  cta: "CTA",
};

export function AiSuggestButton({ kind, dealership, vehicle, goal, onPick }: Props) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [options, setOptions] = useState<string[]>([]);

  const fetchOptions = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/canvas/headline", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          kind,
          goal: goal || "Promote this vehicle",
          dealership,
          vehicle,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");
      const list: string[] = Array.isArray(data.headlines) ? data.headlines : [];
      setOptions(list);
      if (list.length === 0) toast.error("No suggestions returned — try again");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to get suggestions");
    } finally {
      setLoading(false);
    }
  };

  const handleOpenChange = (next: boolean) => {
    setOpen(next);
    if (next && options.length === 0 && !loading) fetchOptions();
  };

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger
        type="button"
        className="inline-flex h-6 items-center gap-1 rounded-md px-2 text-xs font-medium text-primary hover:bg-primary/10 transition-colors"
      >
        <Sparkles className="h-3.5 w-3.5" />
        Suggest
      </PopoverTrigger>
      <PopoverContent align="end" className="w-72 p-2">
        <div className="flex items-center justify-between px-1 pb-1.5">
          <span className="text-xs font-medium text-muted-foreground">
            AI {LABELS[kind]} ideas
          </span>
          <Button
            type="button"
            size="sm"
            variant="ghost"
            className="h-6 px-1.5 text-xs"
            onClick={fetchOptions}
            disabled={loading}
          >
            {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
          </Button>
        </div>
        {loading && options.length === 0 ? (
          <div className="flex items-center justify-center py-6 text-xs text-muted-foreground">
            <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Thinking…
          </div>
        ) : (
          <div className="space-y-1">
            {options.map((opt, i) => (
              <button
                key={i}
                type="button"
                onClick={() => {
                  onPick(opt);
                  setOpen(false);
                }}
                className="w-full text-left text-sm rounded-md px-2 py-1.5 hover:bg-muted transition-colors"
              >
                {opt}
              </button>
            ))}
            {options.length === 0 && !loading && (
              <p className="px-2 py-3 text-xs text-muted-foreground text-center">
                No ideas yet — tap refresh.
              </p>
            )}
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
