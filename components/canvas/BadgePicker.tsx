"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { BADGE_PRESETS } from "@/lib/canvas/badge-presets";
import type { CanvasElement } from "@/lib/canvas/types";
import type { Dealership, Vehicle } from "@/lib/types";

interface Props {
  open: boolean;
  onClose: () => void;
  dealership: Dealership | null;
  vehicle: Vehicle | null;
  canvasWidth: number;
  canvasHeight: number;
  onAdd: (els: CanvasElement[]) => void;
}

export function BadgePicker({ open, onClose, dealership, vehicle, canvasWidth, canvasHeight, onAdd }: Props) {
  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Dealership Badge Library</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
          {BADGE_PRESETS.map((p) => (
            <button
              key={p.id}
              onClick={() => {
                const els = p.build({
                  dealership,
                  vehicle,
                  cx: canvasWidth / 2,
                  cy: canvasHeight / 2,
                });
                onAdd(els);
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
        <p className="text-xs text-muted-foreground mt-2">
          Badges drop in the center of the canvas using your dealership&apos;s brand colors. Bind a vehicle to fill any{" "}
          <code className="font-mono">{`{{price}}`}</code>, <code className="font-mono">{`{{stock_number}}`}</code> placeholders.
        </p>
      </DialogContent>
    </Dialog>
  );
}
