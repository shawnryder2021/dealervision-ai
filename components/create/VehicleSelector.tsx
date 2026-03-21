"use client";

import { Car } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Vehicle } from "@/lib/types";

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
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">Select Vehicle (Optional)</label>
      <Select
        value={value || "none"}
        onValueChange={(v) => onChange(v === "none" || v == null ? undefined : v)}
      >
        <SelectTrigger>
          <SelectValue placeholder="Choose a vehicle..." />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="none">
            <span className="text-muted-foreground">No specific vehicle</span>
          </SelectItem>
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
        </SelectContent>
      </Select>
    </div>
  );
}
