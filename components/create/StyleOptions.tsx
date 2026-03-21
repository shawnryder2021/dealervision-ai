"use client";

import { cn } from "@/lib/utils";
import { STYLE_OPTIONS } from "@/lib/constants";

interface StyleOptionsProps {
  value: string;
  onChange: (style: string) => void;
}

export function StyleOptions({ value, onChange }: StyleOptionsProps) {
  return (
    <div className="space-y-3">
      <label className="text-sm font-medium">Visual Style</label>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {STYLE_OPTIONS.map((style) => (
          <button
            key={style.id}
            type="button"
            onClick={() => onChange(style.id)}
            className={cn(
              "rounded-lg border p-3 text-left transition-all",
              value === style.id
                ? "border-primary bg-primary/10 shadow-sm"
                : "border-border hover:border-primary/30 hover:bg-muted/50"
            )}
          >
            <p className="text-xs font-medium">{style.name}</p>
            <p className="text-[10px] text-muted-foreground mt-0.5">
              {style.description}
            </p>
          </button>
        ))}
      </div>
    </div>
  );
}
