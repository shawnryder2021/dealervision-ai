"use client";

import { Type, Square, Circle as CircleIcon, Star as StarIcon, Image as ImageIcon, QrCode, Palette, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { newId, type CanvasElement } from "@/lib/canvas/types";
import type { Dealership } from "@/lib/types";

interface Props {
  dealership: Dealership | null;
  canvasWidth: number;
  canvasHeight: number;
  onAdd: (el: CanvasElement | CanvasElement[]) => void;
  onOpenBadges: () => void;
  onOpenLibrary: () => void;
  onUpload: (file: File) => void;
}

export function Toolbar({ dealership, canvasWidth, canvasHeight, onAdd, onOpenBadges, onOpenLibrary, onUpload }: Props) {
  const cx = canvasWidth / 2;
  const cy = canvasHeight / 2;
  const colors = dealership?.brand_colors;

  const addText = (preset: "headline" | "sub" | "body") => {
    const sizes = { headline: 96, sub: 48, body: 28 };
    const styles = { headline: "bold" as const, sub: "bold" as const, body: "normal" as const };
    onAdd({
      id: newId(),
      type: "text",
      text: preset === "headline" ? "Add a headline" : preset === "sub" ? "Subheadline" : "Add body text here",
      x: cx - 300,
      y: cy - sizes[preset] / 2,
      width: 600,
      height: sizes[preset] * 1.5,
      rotation: 0,
      fontFamily: preset === "headline" ? "Bebas Neue" : "Inter",
      fontSize: sizes[preset],
      fontStyle: styles[preset],
      align: "center",
      fill: colors?.primary || "#0f172a",
    });
  };

  const addShape = (shape: "rect" | "circle" | "star") => {
    onAdd({
      id: newId(),
      type: "shape",
      shape,
      x: cx - 100,
      y: cy - 100,
      width: 200,
      height: 200,
      rotation: 0,
      fill: colors?.accent || "#ff8c00",
      cornerRadius: shape === "rect" ? 12 : undefined,
      numPoints: shape === "star" ? 5 : undefined,
      innerRadius: shape === "star" ? 0.45 : undefined,
    });
  };

  const addQr = () => {
    onAdd({
      id: newId(),
      type: "qr",
      data: dealership?.contact?.website || "https://example.com",
      x: cx - 80,
      y: cy - 80,
      width: 160,
      height: 160,
      rotation: 0,
      fill: "#000000",
      bg: "#ffffff",
    });
  };

  return (
    <div className="space-y-3">
      <div>
        <Label className="text-xs uppercase tracking-wider text-muted-foreground">Text</Label>
        <div className="grid grid-cols-1 gap-1 mt-1">
          <Button variant="ghost" className="justify-start" size="sm" onClick={() => addText("headline")}>
            <Type className="h-4 w-4 mr-2" /> Add headline
          </Button>
          <Button variant="ghost" className="justify-start" size="sm" onClick={() => addText("sub")}>
            <Type className="h-4 w-4 mr-2 opacity-70" /> Add subheading
          </Button>
          <Button variant="ghost" className="justify-start" size="sm" onClick={() => addText("body")}>
            <Type className="h-3.5 w-3.5 mr-2 opacity-50" /> Add body
          </Button>
        </div>
      </div>

      <div>
        <Label className="text-xs uppercase tracking-wider text-muted-foreground">Shape</Label>
        <div className="grid grid-cols-3 gap-1 mt-1">
          <Button variant="ghost" size="sm" onClick={() => addShape("rect")}>
            <Square className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => addShape("circle")}>
            <CircleIcon className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => addShape("star")}>
            <StarIcon className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div>
        <Label className="text-xs uppercase tracking-wider text-muted-foreground">Image</Label>
        <div className="grid grid-cols-1 gap-1 mt-1">
          <Button variant="ghost" size="sm" className="justify-start" onClick={onOpenLibrary}>
            <ImageIcon className="h-4 w-4 mr-2" /> From Library
          </Button>
          <label className="flex items-center text-sm text-muted-foreground hover:text-foreground hover:bg-muted rounded-md px-2 py-1 cursor-pointer">
            <ImageIcon className="h-4 w-4 mr-2 opacity-70" /> Upload…
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) onUpload(f);
                e.target.value = "";
              }}
            />
          </label>
          <Button variant="ghost" size="sm" className="justify-start" onClick={addQr}>
            <QrCode className="h-4 w-4 mr-2" /> Add QR code
          </Button>
        </div>
      </div>

      <div>
        <Label className="text-xs uppercase tracking-wider text-muted-foreground">Dealership</Label>
        <Button variant="default" size="sm" className="w-full mt-1 justify-start" onClick={onOpenBadges}>
          <Sparkles className="h-4 w-4 mr-2" /> Badge library
        </Button>
      </div>

      {colors && (
        <div>
          <Label className="text-xs uppercase tracking-wider text-muted-foreground flex items-center gap-1">
            <Palette className="h-3 w-3" /> Brand colors
          </Label>
          <div className="grid grid-cols-3 gap-1 mt-1">
            {[colors.primary, colors.secondary, colors.accent].map((c) => (
              <div
                key={c}
                className="h-7 rounded border"
                style={{ background: c }}
                title={c}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
