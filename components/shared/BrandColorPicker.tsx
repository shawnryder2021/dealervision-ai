"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface BrandColors {
  primary: string;
  secondary: string;
  accent: string;
}

interface BrandColorPickerProps {
  value: BrandColors;
  onChange: (colors: BrandColors) => void;
}

export function BrandColorPicker({ value, onChange }: BrandColorPickerProps) {
  const colorFields: { key: keyof BrandColors; label: string }[] = [
    { key: "primary", label: "Primary" },
    { key: "secondary", label: "Secondary" },
    { key: "accent", label: "Accent" },
  ];

  return (
    <div className="space-y-3">
      <Label className="text-sm font-medium">Brand Colors</Label>
      <div className="grid grid-cols-3 gap-3">
        {colorFields.map(({ key, label }) => (
          <div key={key} className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">{label}</Label>
            <div className="flex items-center gap-2">
              <div className="relative">
                <input
                  type="color"
                  value={value[key]}
                  onChange={(e) =>
                    onChange({ ...value, [key]: e.target.value })
                  }
                  className="h-9 w-9 cursor-pointer rounded-md border border-border bg-transparent p-0.5"
                />
              </div>
              <Input
                value={value[key]}
                onChange={(e) =>
                  onChange({ ...value, [key]: e.target.value })
                }
                className="h-9 font-mono text-xs uppercase"
                placeholder="#000000"
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
