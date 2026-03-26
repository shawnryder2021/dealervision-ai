"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Plus, Trash2, Download, Type, GripVertical } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

interface TextLayer {
  id: string;
  text: string;
  x: number;
  y: number;
  fontSize: number;
  fontWeight: string;
  color: string;
  bgColor: string;
  bgEnabled: boolean;
  align: CanvasTextAlign;
}

const PRESET_OVERLAYS = [
  { label: "Sale Price", text: "NOW $XX,XXX", fontSize: 48, fontWeight: "bold", color: "#FFFFFF", bgColor: "#FF0000", bgEnabled: true },
  { label: "Monthly Payment", text: "$XXX/mo*", fontSize: 42, fontWeight: "bold", color: "#FFFFFF", bgColor: "#003366", bgEnabled: true },
  { label: "Special Offer", text: "SPECIAL OFFER", fontSize: 36, fontWeight: "bold", color: "#FFD700", bgColor: "#000000", bgEnabled: true },
  { label: "Limited Time", text: "LIMITED TIME ONLY", fontSize: 32, fontWeight: "bold", color: "#FFFFFF", bgColor: "#CC0000", bgEnabled: true },
  { label: "0% APR", text: "0% APR FOR 60 MONTHS", fontSize: 36, fontWeight: "bold", color: "#FFFFFF", bgColor: "#006600", bgEnabled: true },
  { label: "Lease Special", text: "LEASE FOR $XXX/MO", fontSize: 36, fontWeight: "bold", color: "#FFFFFF", bgColor: "#003366", bgEnabled: true },
  { label: "Discount", text: "SAVE $X,XXX", fontSize: 42, fontWeight: "bold", color: "#FFD700", bgColor: "#000000", bgEnabled: true },
  { label: "Custom Text", text: "Your Text Here", fontSize: 32, fontWeight: "normal", color: "#FFFFFF", bgColor: "transparent", bgEnabled: false },
];

const FONT_SIZES = [16, 20, 24, 28, 32, 36, 42, 48, 56, 64, 72];

interface TextOverlayEditorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  imageUrl: string;
  onSave: (dataUrl: string) => void;
}

/** Compute bounding box for a layer at a given scale */
function getLayerBounds(
  layer: TextLayer,
  ctx: CanvasRenderingContext2D,
  scale: number
) {
  const fontSize = layer.fontSize * scale;
  ctx.font = `${layer.fontWeight} ${fontSize}px sans-serif`;
  const tw = ctx.measureText(layer.text || " ").width;
  const th = fontSize * 1.2;
  const padding = fontSize * 0.3;
  const x = layer.x * scale;
  const y = layer.y * scale;

  let left = x - padding;
  if (layer.align === "center") left = x - tw / 2 - padding;
  else if (layer.align === "right") left = x - tw - padding;

  return {
    left,
    top: y - padding / 2,
    width: tw + padding * 2,
    height: th + padding,
    textWidth: tw,
    textHeight: th,
    padding,
  };
}

export function TextOverlayEditor({
  open,
  onOpenChange,
  imageUrl,
  onSave,
}: TextOverlayEditorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const inlineInputRef = useRef<HTMLInputElement>(null);
  const [layers, setLayers] = useState<TextLayer[]>([]);
  const [selectedLayer, setSelectedLayer] = useState<string | null>(null);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imgEl, setImgEl] = useState<HTMLImageElement | null>(null);
  const [dragging, setDragging] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [editingInline, setEditingInline] = useState<string | null>(null);
  const [inlinePos, setInlinePos] = useState({ left: 0, top: 0, width: 200, fontSize: 32 });
  const [hoveredLayer, setHoveredLayer] = useState<string | null>(null);

  const getScale = useCallback(() => {
    if (!imgEl) return 1;
    const maxWidth = 600;
    return Math.min(maxWidth / imgEl.width, 1);
  }, [imgEl]);

  // Load image
  useEffect(() => {
    if (!open || !imageUrl) return;
    setImageLoaded(false);
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      setImgEl(img);
      setImageLoaded(true);
    };
    img.onerror = () => toast.error("Failed to load image");
    img.src = imageUrl;
  }, [open, imageUrl]);

  // Reset state when dialog closes
  useEffect(() => {
    if (!open) {
      setLayers([]);
      setSelectedLayer(null);
      setDragging(null);
      setEditingInline(null);
      setHoveredLayer(null);
    }
  }, [open]);

  // Render canvas
  const renderCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !imgEl) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const scale = getScale();
    canvas.width = imgEl.width * scale;
    canvas.height = imgEl.height * scale;

    ctx.drawImage(imgEl, 0, 0, canvas.width, canvas.height);

    for (const layer of layers) {
      // Skip rendering text for the layer being inline-edited
      if (layer.id === editingInline) continue;

      const x = layer.x * scale;
      const y = layer.y * scale;
      const fontSize = layer.fontSize * scale;

      ctx.font = `${layer.fontWeight} ${fontSize}px sans-serif`;
      ctx.textAlign = layer.align;
      ctx.textBaseline = "top";

      const bounds = getLayerBounds(layer, ctx, scale);

      // Background
      if (layer.bgEnabled && layer.bgColor !== "transparent") {
        ctx.fillStyle = layer.bgColor;
        ctx.globalAlpha = 0.85;
        ctx.fillRect(bounds.left, bounds.top, bounds.width, bounds.height);
        ctx.globalAlpha = 1;
      }

      // Text
      ctx.fillStyle = layer.color;
      ctx.fillText(layer.text, x, y);

      // Selection / hover indicator
      const isSelected = layer.id === selectedLayer;
      const isHovered = layer.id === hoveredLayer;
      if (isSelected || isHovered) {
        ctx.strokeStyle = isSelected ? "#3b82f6" : "#3b82f680";
        ctx.lineWidth = isSelected ? 2 : 1;
        ctx.setLineDash(isSelected ? [5, 3] : [3, 3]);
        ctx.strokeRect(bounds.left, bounds.top, bounds.width, bounds.height);
        ctx.setLineDash([]);

        // Draw move handle for selected
        if (isSelected) {
          const handleSize = Math.max(14, fontSize * 0.4);
          const hx = bounds.left - handleSize - 4;
          const hy = bounds.top + bounds.height / 2 - handleSize / 2;
          ctx.fillStyle = "#3b82f6";
          ctx.globalAlpha = 0.9;
          ctx.beginPath();
          ctx.roundRect(hx, hy, handleSize, handleSize, 3);
          ctx.fill();
          ctx.globalAlpha = 1;
          // Grip dots
          ctx.fillStyle = "#fff";
          const dotR = Math.max(1.5, handleSize * 0.08);
          const cx = hx + handleSize / 2;
          const cy = hy + handleSize / 2;
          for (const dy of [-handleSize * 0.2, 0, handleSize * 0.2]) {
            for (const dx of [-handleSize * 0.12, handleSize * 0.12]) {
              ctx.beginPath();
              ctx.arc(cx + dx, cy + dy, dotR, 0, Math.PI * 2);
              ctx.fill();
            }
          }
        }
      }
    }
  }, [imgEl, layers, selectedLayer, hoveredLayer, editingInline, getScale]);

  useEffect(() => {
    renderCanvas();
  }, [renderCanvas]);

  // Focus inline input when it appears
  useEffect(() => {
    if (editingInline && inlineInputRef.current) {
      inlineInputRef.current.focus();
      inlineInputRef.current.select();
    }
  }, [editingInline]);

  function addPreset(preset: (typeof PRESET_OVERLAYS)[number]) {
    const newLayer: TextLayer = {
      id: `layer-${Date.now()}`,
      text: preset.text,
      x: imgEl ? imgEl.width / 2 : 300,
      y: imgEl ? imgEl.height * 0.8 : 400,
      fontSize: preset.fontSize,
      fontWeight: preset.fontWeight,
      color: preset.color,
      bgColor: preset.bgColor,
      bgEnabled: preset.bgEnabled,
      align: "center",
    };
    setLayers((prev) => [...prev, newLayer]);
    setSelectedLayer(newLayer.id);
  }

  function updateLayer(id: string, updates: Partial<TextLayer>) {
    setLayers((prev) =>
      prev.map((l) => (l.id === id ? { ...l, ...updates } : l))
    );
  }

  function removeLayer(id: string) {
    setLayers((prev) => prev.filter((l) => l.id !== id));
    if (selectedLayer === id) setSelectedLayer(null);
    if (editingInline === id) setEditingInline(null);
  }

  /** Hit-test: find which layer is at canvas coords (mx, my in image space) */
  function hitTest(mx: number, my: number): TextLayer | null {
    const canvas = canvasRef.current;
    if (!canvas || !imgEl) return null;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;
    const scale = getScale();

    for (let i = layers.length - 1; i >= 0; i--) {
      const layer = layers[i];
      const bounds = getLayerBounds(layer, ctx, scale);
      const sx = mx * scale;
      const sy = my * scale;
      if (
        sx >= bounds.left &&
        sx <= bounds.left + bounds.width &&
        sy >= bounds.top &&
        sy <= bounds.top + bounds.height
      ) {
        return layer;
      }
    }
    return null;
  }

  function canvasToImage(clientX: number, clientY: number) {
    const canvas = canvasRef.current;
    if (!canvas || !imgEl) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const scale = getScale();
    const displayScale = canvas.width / rect.width; // account for CSS scaling
    return {
      x: ((clientX - rect.left) * displayScale) / scale,
      y: ((clientY - rect.top) * displayScale) / scale,
    };
  }

  function startInlineEdit(layer: TextLayer) {
    const canvas = canvasRef.current;
    if (!canvas || !imgEl) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const scale = getScale();
    const bounds = getLayerBounds(layer, ctx, scale);
    const rect = canvas.getBoundingClientRect();
    const displayScale = rect.width / canvas.width;

    setEditingInline(layer.id);
    setInlinePos({
      left: bounds.left * displayScale,
      top: bounds.top * displayScale,
      width: Math.max(bounds.width * displayScale, 120),
      fontSize: layer.fontSize * scale * displayScale,
    });
  }

  function commitInlineEdit() {
    setEditingInline(null);
  }

  // --- Mouse handlers ---
  function handleMouseDown(e: React.MouseEvent<HTMLCanvasElement>) {
    if (editingInline) {
      commitInlineEdit();
      return;
    }
    const { x: mx, y: my } = canvasToImage(e.clientX, e.clientY);
    const hit = hitTest(mx, my);
    if (hit) {
      setDragging(hit.id);
      setSelectedLayer(hit.id);
      setDragOffset({ x: mx - hit.x, y: my - hit.y });
      e.preventDefault();
    } else {
      setSelectedLayer(null);
    }
  }

  function handleMouseMove(e: React.MouseEvent<HTMLCanvasElement>) {
    if (dragging) {
      const { x: mx, y: my } = canvasToImage(e.clientX, e.clientY);
      updateLayer(dragging, { x: mx - dragOffset.x, y: my - dragOffset.y });
      return;
    }
    // Hover detection
    const { x: mx, y: my } = canvasToImage(e.clientX, e.clientY);
    const hit = hitTest(mx, my);
    setHoveredLayer(hit?.id || null);
  }

  function handleMouseUp() {
    setDragging(null);
  }

  function handleDoubleClick(e: React.MouseEvent<HTMLCanvasElement>) {
    const { x: mx, y: my } = canvasToImage(e.clientX, e.clientY);
    const hit = hitTest(mx, my);
    if (hit) {
      setSelectedLayer(hit.id);
      startInlineEdit(hit);
    }
  }

  // --- Touch handlers ---
  function handleTouchStart(e: React.TouchEvent<HTMLCanvasElement>) {
    if (editingInline) {
      commitInlineEdit();
      return;
    }
    const touch = e.touches[0];
    const { x: mx, y: my } = canvasToImage(touch.clientX, touch.clientY);
    const hit = hitTest(mx, my);
    if (hit) {
      setDragging(hit.id);
      setSelectedLayer(hit.id);
      setDragOffset({ x: mx - hit.x, y: my - hit.y });
      e.preventDefault();
    } else {
      setSelectedLayer(null);
    }
  }

  function handleTouchMove(e: React.TouchEvent<HTMLCanvasElement>) {
    if (!dragging) return;
    const touch = e.touches[0];
    const { x: mx, y: my } = canvasToImage(touch.clientX, touch.clientY);
    updateLayer(dragging, { x: mx - dragOffset.x, y: my - dragOffset.y });
    e.preventDefault();
  }

  function handleTouchEnd() {
    setDragging(null);
  }

  // --- Export ---
  function renderFullRes(): HTMLCanvasElement | null {
    if (!imgEl) return null;
    const exportCanvas = document.createElement("canvas");
    exportCanvas.width = imgEl.width;
    exportCanvas.height = imgEl.height;
    const ctx = exportCanvas.getContext("2d");
    if (!ctx) return null;

    ctx.drawImage(imgEl, 0, 0);

    for (const layer of layers) {
      ctx.font = `${layer.fontWeight} ${layer.fontSize}px sans-serif`;
      ctx.textAlign = layer.align;
      ctx.textBaseline = "top";

      const metrics = ctx.measureText(layer.text);
      const textWidth = metrics.width;
      const textHeight = layer.fontSize * 1.2;

      if (layer.bgEnabled && layer.bgColor !== "transparent") {
        const padding = layer.fontSize * 0.3;
        let bgX = layer.x - padding;
        if (layer.align === "center") bgX = layer.x - textWidth / 2 - padding;
        else if (layer.align === "right") bgX = layer.x - textWidth - padding;

        ctx.fillStyle = layer.bgColor;
        ctx.globalAlpha = 0.85;
        ctx.fillRect(bgX, layer.y - padding / 2, textWidth + padding * 2, textHeight + padding);
        ctx.globalAlpha = 1;
      }

      ctx.fillStyle = layer.color;
      ctx.fillText(layer.text, layer.x, layer.y);
    }
    return exportCanvas;
  }

  function handleExport() {
    const exportCanvas = renderFullRes();
    if (!exportCanvas) return;
    const dataUrl = exportCanvas.toDataURL("image/png");
    onSave(dataUrl);
    toast.success("Text overlay applied!");
  }

  function handleDownload() {
    const exportCanvas = renderFullRes();
    if (!exportCanvas) return;
    exportCanvas.toBlob((blob) => {
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `overlay-${Date.now()}.png`;
      a.click();
      URL.revokeObjectURL(url);
    }, "image/png");
  }

  const selected = layers.find((l) => l.id === selectedLayer);
  const editingLayer = editingInline ? layers.find((l) => l.id === editingInline) : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Type className="h-4 w-4 text-primary" />
            Text Overlay Editor
          </DialogTitle>
          <DialogDescription>
            Drag text to reposition. Double-click to edit in place.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Canvas area */}
          <div className="lg:col-span-2">
            <div
              ref={containerRef}
              className="relative rounded-lg overflow-hidden border border-border bg-muted/30"
            >
              {imageLoaded ? (
                <>
                  <canvas
                    ref={canvasRef}
                    className={`w-full select-none ${
                      dragging
                        ? "cursor-grabbing"
                        : hoveredLayer
                        ? "cursor-grab"
                        : "cursor-default"
                    }`}
                    onMouseDown={handleMouseDown}
                    onMouseMove={handleMouseMove}
                    onMouseUp={handleMouseUp}
                    onMouseLeave={() => {
                      handleMouseUp();
                      setHoveredLayer(null);
                    }}
                    onDoubleClick={handleDoubleClick}
                    onTouchStart={handleTouchStart}
                    onTouchMove={handleTouchMove}
                    onTouchEnd={handleTouchEnd}
                  />
                  {/* Inline text input overlay */}
                  {editingLayer && (
                    <input
                      ref={inlineInputRef}
                      type="text"
                      value={editingLayer.text}
                      onChange={(e) =>
                        updateLayer(editingLayer.id, { text: e.target.value })
                      }
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === "Escape") {
                          commitInlineEdit();
                        }
                      }}
                      onBlur={commitInlineEdit}
                      className="absolute border-2 border-blue-500 bg-black/60 text-white outline-none px-1"
                      style={{
                        left: `${inlinePos.left}px`,
                        top: `${inlinePos.top}px`,
                        minWidth: `${inlinePos.width}px`,
                        fontSize: `${inlinePos.fontSize}px`,
                        fontWeight: editingLayer.fontWeight,
                        color: editingLayer.color,
                        lineHeight: 1.2,
                      }}
                    />
                  )}
                </>
              ) : (
                <div className="aspect-video flex items-center justify-center">
                  <p className="text-sm text-muted-foreground">Loading image...</p>
                </div>
              )}
            </div>

            {/* Hint */}
            {layers.length > 0 && !editingInline && (
              <p className="text-[10px] text-muted-foreground mt-1.5 text-center">
                Drag to move &middot; Double-click to edit text
              </p>
            )}

            {/* Preset buttons */}
            <div className="mt-3 space-y-1.5">
              <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Quick Add</p>
              <div className="flex flex-wrap gap-1.5">
                {PRESET_OVERLAYS.map((preset) => (
                  <button
                    key={preset.label}
                    onClick={() => addPreset(preset)}
                    className="px-2.5 py-1 text-[11px] rounded-full border border-border bg-muted/30 hover:bg-primary/10 hover:border-primary/30 transition-colors"
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Layer controls */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium">Text Layers</p>
              <Button
                size="sm"
                variant="outline"
                onClick={() => addPreset(PRESET_OVERLAYS[PRESET_OVERLAYS.length - 1])}
              >
                <Plus className="h-3.5 w-3.5 mr-1" />
                Add
              </Button>
            </div>

            {layers.length === 0 && (
              <p className="text-xs text-muted-foreground text-center py-4">
                Click a preset or Add to create a text layer
              </p>
            )}

            {/* Layer list */}
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {layers.map((layer) => (
                <div
                  key={layer.id}
                  onClick={() => setSelectedLayer(layer.id)}
                  onDoubleClick={() => startInlineEdit(layer)}
                  className={`p-2 rounded-md border text-xs cursor-pointer transition-colors ${
                    selectedLayer === layer.id
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/30"
                  }`}
                >
                  <div className="flex items-center justify-between gap-1">
                    <GripVertical className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                    <span className="font-medium truncate flex-1">{layer.text}</span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        removeLayer(layer.id);
                      }}
                      className="h-5 w-5 flex items-center justify-center rounded hover:bg-destructive/10 flex-shrink-0"
                    >
                      <Trash2 className="h-3 w-3 text-muted-foreground" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Selected layer properties */}
            {selected && (
              <div className="space-y-3 border-t border-border pt-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">Text</Label>
                  <Input
                    value={selected.text}
                    onChange={(e) => updateLayer(selected.id, { text: e.target.value })}
                    className="text-xs"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1.5">
                    <Label className="text-xs">Size</Label>
                    <Select
                      value={String(selected.fontSize)}
                      onValueChange={(v) => updateLayer(selected.id, { fontSize: parseInt(v ?? "32") })}
                    >
                      <SelectTrigger className="text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {FONT_SIZES.map((s) => (
                          <SelectItem key={s} value={String(s)}>
                            {s}px
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Weight</Label>
                    <Select
                      value={selected.fontWeight}
                      onValueChange={(v) => updateLayer(selected.id, { fontWeight: v ?? "normal" })}
                    >
                      <SelectTrigger className="text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="normal">Normal</SelectItem>
                        <SelectItem value="bold">Bold</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1.5">
                    <Label className="text-xs">Text Color</Label>
                    <div className="flex items-center gap-1.5">
                      <input
                        type="color"
                        value={selected.color}
                        onChange={(e) => updateLayer(selected.id, { color: e.target.value })}
                        className="h-8 w-8 rounded border border-border cursor-pointer"
                      />
                      <Input
                        value={selected.color}
                        onChange={(e) => updateLayer(selected.id, { color: e.target.value })}
                        className="text-xs font-mono flex-1"
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Background</Label>
                    <div className="flex items-center gap-1.5">
                      <input
                        type="color"
                        value={selected.bgColor === "transparent" ? "#000000" : selected.bgColor}
                        onChange={(e) => updateLayer(selected.id, { bgColor: e.target.value, bgEnabled: true })}
                        className="h-8 w-8 rounded border border-border cursor-pointer"
                      />
                      <button
                        onClick={() => updateLayer(selected.id, { bgEnabled: !selected.bgEnabled })}
                        className={`text-[10px] px-2 py-1 rounded border ${
                          selected.bgEnabled ? "border-primary bg-primary/10" : "border-border"
                        }`}
                      >
                        {selected.bgEnabled ? "ON" : "OFF"}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs">Align</Label>
                  <div className="flex gap-1">
                    {(["left", "center", "right"] as const).map((align) => (
                      <button
                        key={align}
                        onClick={() => updateLayer(selected.id, { align })}
                        className={`flex-1 py-1 text-[10px] rounded border capitalize ${
                          selected.align === align
                            ? "border-primary bg-primary/10"
                            : "border-border hover:border-primary/30"
                        }`}
                      >
                        {align}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Actions */}
            {layers.length > 0 && (
              <div className="flex gap-2 border-t border-border pt-3">
                <Button onClick={handleExport} className="flex-1 gradient-primary text-white" size="sm">
                  <Type className="h-3.5 w-3.5 mr-1" />
                  Apply
                </Button>
                <Button onClick={handleDownload} variant="outline" size="sm">
                  <Download className="h-3.5 w-3.5 mr-1" />
                  Save
                </Button>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
