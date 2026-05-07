"use client";

import { Car, Sparkles } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Vehicle } from "@/lib/types";
import {
  COMMON_VEHICLE_PRESETS,
  PRESET_SEGMENTS,
  type CommonVehiclePreset,
} from "@/lib/common-vehicle-presets";

interface VehicleSelectorProps {
  vehicles: Vehicle[];
  value?: string;
  onChange: (vehicleId: string | undefined) => void;
}

export function VehicleSelector({
  vehicles,
  value,
  onChange,
}: VehicleSelectorProps) {
  const hasInventory = vehicles.length > 0;

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">Select Vehicle (Optional)</label>
      {!hasInventory && (
        <p className="text-xs text-muted-foreground">
          No inventory loaded — pick a popular model below to use as the visual reference.
        </p>
      )}
      <Select
        value={value || "none"}
        onValueChange={(v) => onChange(v === "none" || v == null ? undefined : v)}
      >
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Choose a vehicle..." />
        </SelectTrigger>
        <SelectContent
          alignItemWithTrigger={false}
          className="!w-auto min-w-[340px] max-w-[480px]"
        >
          <SelectItem value="none">
            <span className="text-muted-foreground">No specific vehicle</span>
          </SelectItem>

          {/* Real inventory first */}
          {hasInventory && (
            <SelectGroup>
              <SelectLabel>Your Inventory</SelectLabel>
              {vehicles.map((v) => (
                <SelectItem key={v.id} value={v.id}>
                  <div className="flex items-center gap-2">
                    <Car className="h-3 w-3" />
                    <span>
                      {v.year} {v.make} {v.model} {v.trim}
                    </span>
                    {v.price && (
                      <span className="text-muted-foreground text-xs">
                        ${v.price.toLocaleString()}
                      </span>
                    )}
                  </div>
                </SelectItem>
              ))}
            </SelectGroup>
          )}

          {/* Common presets, grouped by segment */}
          {PRESET_SEGMENTS.map((segment) => {
            const presets = COMMON_VEHICLE_PRESETS.filter((p) => p.segment === segment);
            if (presets.length === 0) return null;
            return (
              <SelectGroup key={segment}>
                <SelectLabel className="flex items-center gap-1.5">
                  <Sparkles className="h-3 w-3 opacity-60" />
                  Common {segment}
                </SelectLabel>
                {presets.map((p: CommonVehiclePreset) => (
                  <SelectItem key={p.id} value={p.id}>
                    <div className="flex items-center gap-2">
                      <Car className="h-3 w-3 opacity-60" />
                      <span>
                        {p.year} {p.make} {p.model}
                        {p.trim ? ` ${p.trim}` : ""}
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectGroup>
            );
          })}
        </SelectContent>
      </Select>
    </div>
  );
}
