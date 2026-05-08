"use client";

import { SCENE_PRESETS, SCENE_CATEGORIES, type ScenePreset } from "@/lib/scene-presets";

interface Props {
  value: string | undefined;
  onChange: (id: string | undefined) => void;
  hasLocalLandmark?: boolean;
}

export function SceneLocationPicker({ value, onChange, hasLocalLandmark }: Props) {
  const handleClick = (id: string) => {
    onChange(value === id ? undefined : id);
  };

  return (
    <div className="space-y-3">
      {/* "None" / default option */}
      <button
        type="button"
        onClick={() => onChange(undefined)}
        className={`w-full text-left px-3 py-2 rounded-md border text-sm transition-colors ${
          !value
            ? "border-primary bg-primary/5 text-primary font-medium"
            : "border-border hover:border-primary/50 text-muted-foreground"
        }`}
      >
        <span className="mr-2">🎲</span>
        <span>Auto — let AI choose the best scene</span>
      </button>

      {SCENE_CATEGORIES.map((category: string) => {
        const presets = SCENE_PRESETS.filter(
          (p) => p.category === category &&
            // hide local-landmark if no landmark is configured
            !(p.id === "local-landmark" && !hasLocalLandmark)
        );
        if (presets.length === 0) return null;

        return (
          <div key={category}>
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
              {category}
            </p>
            <div className="grid grid-cols-2 gap-1.5">
              {presets.map((preset) => (
                <SceneCard
                  key={preset.id}
                  preset={preset}
                  selected={value === preset.id}
                  onClick={() => handleClick(preset.id)}
                />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function SceneCard({
  preset,
  selected,
  onClick,
}: {
  preset: ScenePreset;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`text-left p-2.5 rounded-md border transition-all ${
        selected
          ? "border-primary bg-primary/5 ring-1 ring-primary/30"
          : "border-border hover:border-primary/50 hover:bg-muted/40"
      }`}
    >
      <div className="flex items-start gap-1.5">
        <span className="text-lg leading-none mt-0.5 shrink-0">{preset.emoji}</span>
        <div className="min-w-0">
          <p className={`text-xs font-medium leading-tight ${selected ? "text-primary" : ""}`}>
            {preset.label}
          </p>
          <p className="text-xs text-muted-foreground leading-tight mt-0.5 truncate">
            {preset.description}
          </p>
        </div>
      </div>
    </button>
  );
}
