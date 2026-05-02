"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { STARTER_TEMPLATES, type StarterTemplate } from "@/lib/canvas/starter-templates";
import type { Dealership } from "@/lib/types";

interface Props {
  open: boolean;
  onClose: () => void;
  dealership: Dealership | null;
  onPick: (template: StarterTemplate) => void;
}

export function StarterTemplatesDialog({ open, onClose, onPick }: Props) {
  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Starter Templates</DialogTitle>
        </DialogHeader>
        <p className="text-xs text-muted-foreground -mt-2">
          Pick a starter to replace the current design. Brand colors and merge tags are pre-applied.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {STARTER_TEMPLATES.map((t) => (
            <button
              key={t.id}
              onClick={() => {
                onPick(t);
                onClose();
              }}
              className="text-left p-3 rounded border hover:border-primary hover:bg-primary/5 transition-colors flex items-start gap-3"
            >
              <div className="text-2xl">{t.emoji}</div>
              <div className="flex-1">
                <div className="font-medium text-sm">{t.label}</div>
                <div className="text-xs text-muted-foreground mt-0.5">{t.description}</div>
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground mt-1">
                  {t.canvasSize} · {t.canvasWidth}×{t.canvasHeight}
                </div>
              </div>
            </button>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
