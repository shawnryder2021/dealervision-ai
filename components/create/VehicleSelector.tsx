"use client";

import { useEffect, useMemo, useState } from "react";
import { Car } from "lucide-react";
import { Input } from "@/components/ui/input";
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
import { buildManualVehicleId, parseInlineVehicleId } from "@/lib/common-vehicle-presets";
import { VEHICLE_MAKES, MODELS_BY_MAKE } from "@/lib/vehicle-options";

interface VehicleSelectorProps {
  vehicles: Vehicle[];
  value?: string;
  onChange: (vehicleId: string | undefined) => void;
}

const NONE = "none";
const CUSTOM_MODEL = "__custom_model__";

export function VehicleSelector({ vehicles, value, onChange }: VehicleSelectorProps) {
  const hasInventory = vehicles.length > 0;

  // Years: current year + 1 down to 2008, plus any years from real inventory.
  const years = useMemo(() => {
    const now = new Date().getFullYear();
    const base: number[] = [];
    for (let y = now + 1; y >= 2008; y--) base.push(y);
    const inv = vehicles.map((v) => v.year).filter((y): y is number => y != null);
    return Array.from(new Set([...inv, ...base])).sort((a, b) => b - a);
  }, [vehicles]);

  // Makes: common makes plus any makes from real inventory.
  const makes = useMemo(() => {
    const inv = vehicles.map((v) => v.make?.trim()).filter((m): m is string => !!m);
    return Array.from(new Set([...VEHICLE_MAKES, ...inv])).sort((a, b) => a.localeCompare(b));
  }, [vehicles]);

  // Is the current value pointing at a real inventory vehicle?
  const inventoryMatch = value ? vehicles.find((v) => v.id === value) : undefined;

  // Local state for the manual Year / Make / Model picker.
  const initial = inventoryMatch ? null : parseInlineVehicleId(value);
  const [year, setYear] = useState<string>(initial?.year ? String(initial.year) : "");
  const [make, setMake] = useState<string>(initial?.make ?? "");
  const [model, setModel] = useState<string>(initial?.model ?? "");
  const [customModelMode, setCustomModelMode] = useState<boolean>(() => {
    if (!initial?.model) return false;
    const known = initial.make ? MODELS_BY_MAKE[initial.make] : undefined;
    return !known || !known.includes(initial.model);
  });

  // Re-sync if the parent value changes from the outside (e.g. URL params).
  useEffect(() => {
    if (value && vehicles.find((v) => v.id === value)) {
      setYear("");
      setMake("");
      setModel("");
      setCustomModelMode(false);
      return;
    }
    const parsed = parseInlineVehicleId(value);
    if (parsed) {
      setYear(parsed.year ? String(parsed.year) : "");
      setMake(parsed.make);
      setModel(parsed.model);
      const known = parsed.make ? MODELS_BY_MAKE[parsed.make] : undefined;
      setCustomModelMode(!known || !known.includes(parsed.model));
    } else if (!value) {
      setYear("");
      setMake("");
      setModel("");
      setCustomModelMode(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  const modelsForMake = make ? MODELS_BY_MAKE[make] : undefined;

  function emitManual(nextYear: string, nextMake: string, nextModel: string) {
    if (nextMake.trim() && nextModel.trim()) {
      onChange(buildManualVehicleId(nextYear, nextMake.trim(), nextModel.trim()));
    } else {
      onChange(undefined);
    }
  }

  function handleYear(v: string | null) {
    const next = !v || v === NONE ? "" : v;
    setYear(next);
    emitManual(next, make, model);
  }

  function handleMake(v: string | null) {
    const next = !v || v === NONE ? "" : v;
    setMake(next);
    setModel("");
    setCustomModelMode(false);
    emitManual(year, next, "");
  }

  function handleModelSelect(v: string | null) {
    if (!v || v === NONE) {
      setCustomModelMode(false);
      setModel("");
      emitManual(year, make, "");
      return;
    }
    if (v === CUSTOM_MODEL) {
      setCustomModelMode(true);
      setModel("");
      emitManual(year, make, "");
      return;
    }
    setCustomModelMode(false);
    setModel(v);
    emitManual(year, make, v);
  }

  function handleModelInput(v: string) {
    setModel(v);
    emitManual(year, make, v);
  }

  function handleInventory(v: string | null) {
    onChange(!v || v === NONE ? undefined : v);
  }

  return (
    <div className="space-y-3">
      <label className="text-sm font-medium">Vehicle (Optional)</label>

      {hasInventory && (
        <div className="space-y-1.5">
          <p className="text-xs text-muted-foreground">Pick from your inventory</p>
          <Select value={inventoryMatch ? (value as string) : NONE} onValueChange={handleInventory}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Choose a vehicle from inventory…" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={NONE}>
                <span className="text-muted-foreground">None</span>
              </SelectItem>
              <SelectGroup>
                <SelectLabel>Your Inventory</SelectLabel>
                {vehicles.map((v) => (
                  <SelectItem key={v.id} value={v.id}>
                    <div className="flex items-center gap-2">
                      <Car className="h-3 w-3" />
                      <span>
                        {v.year} {v.make} {v.model}
                        {v.trim ? ` ${v.trim}` : ""}
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>
      )}

      <div className="space-y-1.5">
        {hasInventory && (
          <p className="text-xs text-muted-foreground">Or build one — Year / Make / Model</p>
        )}
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
          {/* Year */}
          <Select value={year || NONE} onValueChange={handleYear}>
            <SelectTrigger>
              <SelectValue placeholder="Year" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={NONE}>
                <span className="text-muted-foreground">Year</span>
              </SelectItem>
              {years.map((y) => (
                <SelectItem key={y} value={String(y)}>
                  {y}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Make */}
          <Select value={make || NONE} onValueChange={handleMake}>
            <SelectTrigger>
              <SelectValue placeholder="Make" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={NONE}>
                <span className="text-muted-foreground">Make</span>
              </SelectItem>
              {makes.map((m) => (
                <SelectItem key={m} value={m}>
                  {m}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Model */}
          {modelsForMake && !customModelMode ? (
            <Select value={model || NONE} onValueChange={handleModelSelect}>
              <SelectTrigger>
                <SelectValue placeholder="Model" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={NONE}>
                  <span className="text-muted-foreground">Model</span>
                </SelectItem>
                {modelsForMake.map((m) => (
                  <SelectItem key={m} value={m}>
                    {m}
                  </SelectItem>
                ))}
                <SelectItem value={CUSTOM_MODEL}>
                  <span className="text-muted-foreground">Other…</span>
                </SelectItem>
              </SelectContent>
            </Select>
          ) : (
            <Input
              placeholder="Model"
              value={model}
              onChange={(e) => handleModelInput(e.target.value)}
            />
          )}
        </div>
        {customModelMode && modelsForMake && (
          <button
            type="button"
            className="text-xs text-muted-foreground underline hover:text-foreground"
            onClick={() => {
              setCustomModelMode(false);
              setModel("");
              emitManual(year, make, "");
            }}
          >
            ← Back to {make} model list
          </button>
        )}
      </div>
    </div>
  );
}
