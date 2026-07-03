"use client";

import { useEffect, useMemo, useState } from "react";
import { Car, Search, ArrowRight, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getVehicles } from "@/lib/db/vehicles";
import { useAppStore } from "@/lib/store";
import type { StarterTemplate, Vehicle } from "@/lib/types";
import { cn } from "@/lib/utils";

interface Props {
  template: StarterTemplate | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Called with the picked vehicle id (null = skip) — caller navigates. */
  onConfirm: (template: StarterTemplate, vehicleId: string | null) => void;
}

export function VehiclePickerModal({ template, open, onOpenChange, onConfirm }: Props) {
  const { dealership } = useAppStore();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(false);
  const [q, setQ] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    if (!open || !dealership) return;
    setLoading(true);
    setSelectedId(null);
    setQ("");
    getVehicles(dealership.id)
      .then((v) => setVehicles(v.filter((x) => x.status !== "sold")))
      .catch(() => setVehicles([]))
      .finally(() => setLoading(false));
  }, [open, dealership]);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return vehicles;
    return vehicles.filter((v) =>
      [v.year, v.make, v.model, v.trim, v.stock_number]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(needle)
    );
  }, [vehicles, q]);

  if (!template) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Car className="h-4 w-4 text-primary" />
            Pick a vehicle for &ldquo;{template.name}&rdquo;
          </DialogTitle>
          <DialogDescription>
            Your pick drops straight into the template and generation starts
            immediately — or skip to fill things in yourself.
          </DialogDescription>
        </DialogHeader>

        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search year, make, model, stock #…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="pl-8"
          />
        </div>

        <div className="max-h-64 overflow-y-auto space-y-1.5 pr-1">
          {loading ? (
            <div className="flex items-center justify-center py-8 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Loading inventory…
            </div>
          ) : filtered.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              {vehicles.length === 0 ? "No vehicles in inventory yet." : "No matches."}
            </p>
          ) : (
            filtered.map((v) => (
              <button
                key={v.id}
                type="button"
                onClick={() => setSelectedId(v.id === selectedId ? null : v.id)}
                className={cn(
                  "w-full text-left rounded-lg border px-3 py-2 text-sm transition-colors",
                  selectedId === v.id
                    ? "border-primary bg-primary/10"
                    : "border-border hover:bg-muted/50"
                )}
              >
                <span className="font-medium">
                  {[v.year, v.make, v.model, v.trim].filter(Boolean).join(" ")}
                </span>
                <span className="text-xs text-muted-foreground ml-2">
                  {v.price ? `$${Number(v.price).toLocaleString()}` : ""}
                  {v.stock_number ? ` · #${v.stock_number}` : ""}
                </span>
              </button>
            ))
          )}
        </div>

        <div className="flex items-center justify-between gap-2 pt-1">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => onConfirm(template, null)}
          >
            Skip — no vehicle
          </Button>
          <Button
            type="button"
            disabled={!selectedId}
            onClick={() => selectedId && onConfirm(template, selectedId)}
          >
            Generate now <ArrowRight className="h-3.5 w-3.5 ml-1.5" />
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
