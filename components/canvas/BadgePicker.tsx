"use client";

import { useEffect, useState } from "react";
import { Trash2, Sparkles } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { BADGE_PRESETS } from "@/lib/canvas/badge-presets";
import type { CanvasElement } from "@/lib/canvas/types";
import type { Dealership, Vehicle } from "@/lib/types";
import { newId } from "@/lib/canvas/types";
import { toast } from "sonner";

interface Props {
  open: boolean;
  onClose: () => void;
  dealership: Dealership | null;
  vehicle: Vehicle | null;
  canvasWidth: number;
  canvasHeight: number;
  onAdd: (els: CanvasElement[]) => void;
}

interface CustomBadge {
  id: string;
  name: string;
  elements: CanvasElement[];
  thumbnail_url: string | null;
}

export function BadgePicker({ open, onClose, dealership, vehicle, canvasWidth, canvasHeight, onAdd }: Props) {
  const [custom, setCustom] = useState<CustomBadge[]>([]);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/canvas-templates?kind=badge");
      if (res.ok) {
        const data = await res.json();
        setCustom(
          (data.designs || []).map((d: { id: string; name: string; elements: CanvasElement[]; thumbnail_url: string | null }) => ({
            id: d.id,
            name: d.name,
            elements: d.elements || [],
            thumbnail_url: d.thumbnail_url,
          }))
        );
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open) load();
  }, [open]);

  const addCustom = (b: CustomBadge) => {
    // Translate stored elements to drop at the canvas center by computing
    // the centroid of the saved set and offsetting to the current center.
    if (b.elements.length === 0) return;
    const minX = Math.min(...b.elements.map((e) => e.x));
    const minY = Math.min(...b.elements.map((e) => e.y));
    const maxX = Math.max(...b.elements.map((e) => e.x + e.width));
    const maxY = Math.max(...b.elements.map((e) => e.y + e.height));
    const groupCx = (minX + maxX) / 2;
    const groupCy = (minY + maxY) / 2;
    const dx = canvasWidth / 2 - groupCx;
    const dy = canvasHeight / 2 - groupCy;
    onAdd(
      b.elements.map((el) => ({
        ...el,
        id: newId(),
        x: el.x + dx,
        y: el.y + dy,
      }))
    );
    onClose();
  };

  const remove = async (id: string) => {
    if (!confirm("Delete this saved badge?")) return;
    const res = await fetch(`/api/canvas-templates/${id}`, { method: "DELETE" });
    if (res.ok) {
      toast.success("Deleted");
      load();
    } else {
      toast.error("Failed");
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" /> Badge Library
          </DialogTitle>
        </DialogHeader>
        <Tabs defaultValue="builtin">
          <TabsList>
            <TabsTrigger value="builtin">Built-in (12)</TabsTrigger>
            <TabsTrigger value="custom">Saved ({custom.length})</TabsTrigger>
          </TabsList>
          <TabsContent value="builtin" className="mt-3">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {BADGE_PRESETS.map((p) => (
                <button
                  key={p.id}
                  onClick={() => {
                    onAdd(p.build({ dealership, vehicle, cx: canvasWidth / 2, cy: canvasHeight / 2 }));
                    onClose();
                  }}
                  className="text-left p-3 rounded border hover:border-primary hover:bg-primary/5 transition-colors"
                >
                  <div className="text-2xl mb-1">{p.emoji}</div>
                  <div className="font-medium text-sm">{p.label}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">{p.description}</div>
                </button>
              ))}
            </div>
          </TabsContent>
          <TabsContent value="custom" className="mt-3">
            {loading ? (
              <p className="text-sm text-muted-foreground">Loading…</p>
            ) : custom.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No custom badges yet. Select one or more elements in the editor and click <strong>Save as badge</strong>.
              </p>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {custom.map((b) => (
                  <div
                    key={b.id}
                    className="group relative p-3 rounded border hover:border-primary hover:bg-primary/5"
                  >
                    <button onClick={() => addCustom(b)} className="text-left w-full">
                      <div className="aspect-square bg-muted rounded mb-2 overflow-hidden">
                        {b.thumbnail_url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={b.thumbnail_url} alt="" className="w-full h-full object-cover" />
                        ) : null}
                      </div>
                      <div className="font-medium text-sm truncate">{b.name}</div>
                    </button>
                    <button
                      onClick={() => remove(b.id)}
                      className="absolute top-1 right-1 p-1 rounded bg-background/80 text-destructive opacity-0 group-hover:opacity-100"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
