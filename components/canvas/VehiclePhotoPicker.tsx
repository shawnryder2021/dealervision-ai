"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import type { Vehicle } from "@/lib/types";

interface Props {
  open: boolean;
  onClose: () => void;
  vehicle: Vehicle | null;
  onPick: (url: string) => void;
}

export function VehiclePhotoPicker({ open, onClose, vehicle, onPick }: Props) {
  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>
            Photos of {[vehicle?.year, vehicle?.make, vehicle?.model].filter(Boolean).join(" ")}
          </DialogTitle>
        </DialogHeader>
        {vehicle && vehicle.photos.length > 0 ? (
          <div className="grid grid-cols-3 md:grid-cols-4 gap-2 max-h-[60vh] overflow-y-auto">
            {vehicle.photos.map((url, i) => (
              <button
                key={i}
                onClick={() => {
                  onPick(url);
                  onClose();
                }}
                className="aspect-square overflow-hidden rounded border hover:border-primary"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={url} alt="" className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">No photos on this vehicle yet.</p>
        )}
      </DialogContent>
    </Dialog>
  );
}
