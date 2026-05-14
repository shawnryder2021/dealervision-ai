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
  const layerIdRef = useRef(0);
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
    let cancelled = false;
    const img = new Image();
    const timer = window.setTimeout(() => {
      setImageLoaded(false);
      img.crossOrigin = "anonymous";
      img.onload = () => {
        if (cancelled) return;
        setImgEl(img);
        setImageLoaded(true);
      };
      img.onerror = () => {
        if (!cancelled) toast.error("Failed to load image");
      };
      img.src = imageUrl;
    }, 0);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [open, imageUrl]);

  // Reset state when dialog closes
  useEffect(() => {
    if (!open) {
      const timer = window.setTimeout(() => {
        setLayers([]);
        setSelectedLayer(null);
        setDragging(null);
        setEditingInline(null);
        setHoveredLayer(null);
      }, 0);
      return () => window.clearTimeout(timer);
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
    layerIdRef.current += 1;
    const newLayer: TextLayer = {
      id: `layer-${layerIdRef.current}`,
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
      <DialogContent className="max-w-[min(1400px,96vw)] w-full max-h-[94vh] p-0 gap-0 flex flex-col overflow-hidden">
        {/* Header */}
        <DialogHeader className="px-6 py-4 border-b border-border shrink-0">
          <DialogTitle className="flex items-center gap-2 text-lg">
            <Type className="h-4 w-4 text-primary" />
            Text Overlay Editor
          </DialogTitle>
          <DialogDescription>
            Drag text to reposition · Double-click to edit text in place
          </DialogDescription>
        </DialogHeader>

        {/* Body: two-column layout */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-[1fr_340px] min-h-0">
          {/* LEFT: Canvas area */}
          <div className="flex flex-col min-h-0 border-r border-border">
            <div className="flex-1 overflow-auto bg-[radial-gradient(circle_at_center,rgba(0,0,0,0.04)_1px,transparent_1px)] [background-size:18px_18px] p-4 md:p-6 flex items-center justify-center">
              <div
                ref={containerRef}
                className="relative rounded-lg overflow-hidden border border-border shadow-md bg-white max-w-full"
                style={{ maxHeight: "calc(94vh - 220px)" }}
              >
                {imageLoaded ? (
                  <>
                    <canvas
                      ref={canvasRef}
                      className={`block max-w-full max-h-[calc(94vh-220px)] w-auto h-auto select-none ${
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
                  <div className="aspect-video flex items-center justify-center min-w-[400px]">
                    <p className="text-sm text-muted-foreground">Loading image…</p>
                  </div>
                )}
              </div>
            </div>

            {/* Preset chips bar (sticky bottom of canvas column) */}
            <div className="border-t border-border bg-background px-4 md:px-6 py-3 shrink-0">
              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                Quick add overlay
              </p>
              <div className="flex flex-wrap gap-1.5">
                {PRESET_OVERLAYS.map((preset) => (
                  <button
                    key={preset.label}
                    onClick={() => addPreset(preset)}
                    className="px-2.5 py-1 text-[11px] rounded-full border border-border bg-background hover:bg-primary/10 hover:border-primary/40 transition-colors whitespace-nowrap"
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* RIGHT: Layer controls (independently scrollable) */}
          <div className="flex flex-col min-h-0 bg-muted/10">
            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
              {/* Layers header */}
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold">Text Layers</p>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => addPreset(PRESET_OVERLAYS[PRESET_OVERLAYS.length - 1])}
                  className="h-7 text-xs"
                >
                  <Plus className="h-3.5 w-3.5 mr-1" />
                  Add
                </Button>
              </div>

              {layers.length === 0 ? (
                <div className="rounded-lg border border-dashed border-border bg-background py-6 px-4 text-center">
                  <Type className="h-6 w-6 text-muted-foreground/40 mx-auto mb-2" />
                  <p className="text-xs text-muted-foreground">
                    Click a preset below the image, or hit Add to create your first text layer
                  </p>
                </div>
              ) : (
                <div className="space-y-1.5">
                  {layers.map((layer) => (
                    <div
                      key={layer.id}
                      onClick={() => setSelectedLayer(layer.id)}
                      onDoubleClick={() => startInlineEdit(layer)}
                      className={`p-2 rounded-md border text-xs cursor-pointer transition-colors ${
                        selectedLayer === layer.id
                          ? "border-primary bg-primary/5"
                          : "border-border bg-background hover:border-primary/30"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-1.5">
                        <GripVertical className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                        <span className="font-medium truncate flex-1">{layer.text || "(empty)"}</span>
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
              )}

              {/* Selected layer properties */}
              {selected && (
                <div className="space-y-3 border-t border-border pt-4">
                  <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                    Edit Selected Layer
                  </p>

                  <div className="space-y-1.5">
                    <Label className="text-xs">Text</Label>
                    <Input
                      value={selected.text}
                      onChange={(e) => updateLayer(selected.id, { text: e.target.value })}
                      className="text-xs h-9"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1.5">
                      <Label className="text-xs">Size</Label>
                      <Select
                        value={String(selected.fontSize)}
                        onValueChange={(v) => updateLayer(selected.id, { fontSize: parseInt(v ?? "32") })}
                      >
                        <SelectTrigger className="text-xs h-9">
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
                        <SelectTrigger className="text-xs h-9">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="normal">Normal</SelectItem>
                          <SelectItem value="bold">Bold</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs">Text Color</Label>
                    <div className="flex items-center gap-1.5">
                      <input
                        type="color"
                        value={selected.color}
                        onChange={(e) => updateLayer(selected.id, { color: e.target.value })}
                        className="h-9 w-9 rounded border border-border cursor-pointer shrink-0"
                      />
                      <Input
                        value={selected.color}
                        onChange={(e) => updateLayer(selected.id, { color: e.target.value })}
                        className="text-xs font-mono flex-1 h-9"
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
                        className="h-9 w-9 rounded border border-border cursor-pointer shrink-0"
                      />
                      <Input
                        value={selected.bgColor === "transparent" ? "" : selected.bgColor}
                        onChange={(e) => updateLayer(selected.id, { bgColor: e.target.value || "transparent" })}
                        placeholder="transparent"
                        className="text-xs font-mono flex-1 h-9"
                      />
                      <button
                        onClick={() => updateLayer(selected.id, { bgEnabled: !selected.bgEnabled })}
                        className={`text-[10px] px-2.5 h-9 rounded border font-semibold shrink-0 ${
                          selected.bgEnabled
                            ? "border-primary bg-primary/10 text-primary"
                            : "border-border bg-background"
                        }`}
                      >
                        {selected.bgEnabled ? "ON" : "OFF"}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs">Alignment</Label>
                    <div className="flex gap-1">
                      {(["left", "center", "right"] as const).map((align) => (
                        <button
                          key={align}
                          onClick={() => updateLayer(selected.id, { align })}
                          className={`flex-1 py-1.5 text-[11px] rounded border capitalize transition-colors ${
                            selected.align === align
                              ? "border-primary bg-primary/10 text-primary font-medium"
                              : "border-border bg-background hover:border-primary/30"
                          }`}
                        >
                          {align}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Sticky action footer */}
            {layers.length > 0 && (
              <div className="border-t border-border bg-background px-5 py-3 shrink-0">
                <div className="flex gap-2">
                  <Button
                    onClick={handleExport}
                    className="flex-1 gradient-primary text-white"
                    size="sm"
                  >
                    <Type className="h-3.5 w-3.5 mr-1.5" />
                    Apply Overlay
                  </Button>
                  <Button onClick={handleDownload} variant="outline" size="sm">
                    <Download className="h-3.5 w-3.5 mr-1" />
                    Save
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
