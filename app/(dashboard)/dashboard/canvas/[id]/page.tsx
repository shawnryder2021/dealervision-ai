"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  Save,
  Download,
  Loader2,
  Layers,
  Bookmark,
  PaintBucket,
  Undo2,
  Redo2,
  AlignHorizontalJustifyCenter,
  AlignVerticalJustifyCenter,
  AlignStartHorizontal,
  AlignEndHorizontal,
  AlignStartVertical,
  AlignEndVertical,
  Sparkles,
  Wand2,
  Grid3x3,
  ScanSearch,
  Maximize2,
  BadgeCheck,
  Trash2,
} from "lucide-react";
import type Konva from "konva";
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
import { useAppStore } from "@/lib/store";
import { CANVAS_SIZE_PRESETS, newId, type CanvasElement, type Design } from "@/lib/canvas/types";
import { Toolbar } from "@/components/canvas/Toolbar";
import { PropertyPanel } from "@/components/canvas/PropertyPanel";
import { BadgePicker } from "@/components/canvas/BadgePicker";
import { AssetPickerDialog } from "@/components/canvas/AssetPickerDialog";
import { AIHeadlineDialog } from "@/components/canvas/AIHeadlineDialog";
import { StarterTemplatesDialog } from "@/components/canvas/StarterTemplatesDialog";
import { LayerPanel } from "@/components/canvas/LayerPanel";
import { VehiclePhotoPicker } from "@/components/canvas/VehiclePhotoPicker";
import { templateToDesign, STARTER_TEMPLATES } from "@/lib/canvas/starter-templates";
import type { Vehicle } from "@/lib/types";
import { toast } from "sonner";

const CanvasEditor = dynamic(() => import("@/components/canvas/CanvasEditor"), {
  ssr: false,
  loading: () => <div className="text-sm text-muted-foreground">Loading editor…</div>,
});

const DEFAULT_DESIGN: Design = {
  name: "Untitled design",
  kind: "draft",
  canvasSize: "instagram-post",
  canvasWidth: 1080,
  canvasHeight: 1080,
  vehicleId: null,
  elements: [],
  backgroundColor: "#ffffff",
};

const HISTORY_LIMIT = 50;

export default function CanvasEditorPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const id = params.id as string;
  const isNew = id === "new";

  const { dealership, vehicles } = useAppStore();
  const [design, setDesignState] = useState<Design>(DEFAULT_DESIGN);
  const [designId, setDesignId] = useState<string | null>(isNew ? null : id);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [badgeOpen, setBadgeOpen] = useState(false);
  const [libraryOpen, setLibraryOpen] = useState(false);
  const [headlineOpen, setHeadlineOpen] = useState(false);
  const [templatesOpen, setTemplatesOpen] = useState(false);
  const [vehiclePhotosOpen, setVehiclePhotosOpen] = useState(false);
  const [showGrid, setShowGrid] = useState(false);
  const [showThirds, setShowThirds] = useState(false);
  const [showSafe, setShowSafe] = useState(false);
  const [saving, setSaving] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [loading, setLoading] = useState(!isNew);
  const stageRef = useRef<Konva.Stage | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [stageScale, setStageScale] = useState(1);

  const historyRef = useRef<Design[]>([]);
  const futureRef = useRef<Design[]>([]);
  const skipHistoryRef = useRef(true);

  const setDesign = useCallback((updater: Design | ((d: Design) => Design)) => {
    setDesignState((prev) => {
      const next = typeof updater === "function" ? (updater as (d: Design) => Design)(prev) : updater;
      if (!skipHistoryRef.current) {
        historyRef.current.push(prev);
        if (historyRef.current.length > HISTORY_LIMIT) historyRef.current.shift();
        futureRef.current = [];
      }
      skipHistoryRef.current = false;
      return next;
    });
  }, []);

  const undo = useCallback(() => {
    setDesignState((prev) => {
      const last = historyRef.current.pop();
      if (!last) return prev;
      futureRef.current.push(prev);
      return last;
    });
  }, []);

  const redo = useCallback(() => {
    setDesignState((prev) => {
      const next = futureRef.current.pop();
      if (!next) return prev;
      historyRef.current.push(prev);
      return next;
    });
  }, []);

  const vehicle: Vehicle | null = useMemo(
    () => (design.vehicleId ? vehicles.find((v) => v.id === design.vehicleId) ?? null : null),
    [design.vehicleId, vehicles]
  );

  useEffect(() => {
    if (isNew) {
      const fromUrl = searchParams.get("fromUrl");
      const templateId = searchParams.get("template");

      if (templateId) {
        const t = STARTER_TEMPLATES.find((x) => x.id === templateId);
        if (t) {
          skipHistoryRef.current = true;
          setDesignState((prev) => ({ ...prev, ...templateToDesign(t, dealership) } as Design));
          return;
        }
      }
      if (fromUrl) {
        skipHistoryRef.current = true;
        setDesignState((prev) => ({
          ...prev,
          elements: [
            {
              id: newId(),
              type: "image",
              src: fromUrl,
              x: 0,
              y: 0,
              width: prev.canvasWidth,
              height: prev.canvasHeight,
              rotation: 0,
              name: "Background",
            } as CanvasElement,
          ],
        }));
      }
      return;
    }
    setLoading(true);
    fetch(`/api/canvas-templates/${id}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.design) {
          skipHistoryRef.current = true;
          setDesignState({
            id: data.design.id,
            name: data.design.name,
            kind: data.design.kind,
            canvasSize: data.design.canvas_size,
            canvasWidth: data.design.canvas_width,
            canvasHeight: data.design.canvas_height,
            vehicleId: data.design.vehicle_id,
            elements: data.design.elements || [],
            backgroundColor: data.design.background_color || "#ffffff",
            thumbnailUrl: data.design.thumbnail_url,
            exportedUrl: data.design.exported_url,
          });
          setDesignId(data.design.id);
        }
      })
      .finally(() => setLoading(false));
  }, [id, isNew, searchParams, dealership]);

  useEffect(() => {
    const fit = () => {
      const el = containerRef.current;
      if (!el) return;
      const padX = 40;
      const padY = 40;
      const availW = el.clientWidth - padX;
      const availH = el.clientHeight - padY;
      const sx = availW / design.canvasWidth;
      const sy = availH / design.canvasHeight;
      setStageScale(Math.min(sx, sy, 1));
    };
    fit();
    window.addEventListener("resize", fit);
    return () => window.removeEventListener("resize", fit);
  }, [design.canvasWidth, design.canvasHeight]);

  const updateElements = useCallback(
    (next: CanvasElement[]) => {
      setDesign((d) => ({ ...d, elements: next }));
    },
    [setDesign]
  );

  const addElements = useCallback(
    (els: CanvasElement | CanvasElement[]) => {
      const arr = Array.isArray(els) ? els : [els];
      setDesign((d) => ({ ...d, elements: [...d.elements, ...arr] }));
      if (arr.length === 1) setSelectedIds([arr[0].id]);
    },
    [setDesign]
  );

  const handleSelect = useCallback((id: string | null, additive = false) => {
    if (id === null) {
      setSelectedIds([]);
      return;
    }
    if (additive) {
      setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
    } else {
      setSelectedIds([id]);
    }
  }, []);

  const selected = useMemo(
    () => (selectedIds.length === 1 ? design.elements.find((el) => el.id === selectedIds[0]) || null : null),
    [design.elements, selectedIds]
  );

  const updateSelected = (patch: Partial<CanvasElement>) => {
    if (selectedIds.length === 0) return;
    setDesign((d) => ({
      ...d,
      elements: d.elements.map((el) =>
        selectedIds.includes(el.id) ? ({ ...el, ...patch } as CanvasElement) : el
      ),
    }));
  };

  const deleteSelected = useCallback(() => {
    if (selectedIds.length === 0) return;
    setDesign((d) => ({ ...d, elements: d.elements.filter((el) => !selectedIds.includes(el.id)) }));
    setSelectedIds([]);
  }, [selectedIds, setDesign]);

  const duplicateSelected = useCallback(() => {
    if (selectedIds.length === 0) return;
    const newSet: string[] = [];
    setDesign((d) => {
      const copies = d.elements
        .filter((el) => selectedIds.includes(el.id))
        .map((el) => {
          const copy: CanvasElement = { ...el, id: newId(), x: el.x + 20, y: el.y + 20 };
          newSet.push(copy.id);
          return copy;
        });
      return { ...d, elements: [...d.elements, ...copies] };
    });
    setTimeout(() => setSelectedIds(newSet), 0);
  }, [selectedIds, setDesign]);

  const moveLayer = (direction: "up" | "down" | "front" | "back") => {
    if (selectedIds.length !== 1) return;
    const id = selectedIds[0];
    setDesign((d) => {
      const idx = d.elements.findIndex((el) => el.id === id);
      if (idx < 0) return d;
      const arr = [...d.elements];
      const [item] = arr.splice(idx, 1);
      if (direction === "front") arr.push(item);
      else if (direction === "back") arr.unshift(item);
      else if (direction === "up") arr.splice(Math.min(idx + 1, arr.length), 0, item);
      else arr.splice(Math.max(idx - 1, 0), 0, item);
      return { ...d, elements: arr };
    });
  };

  const handleUpload = async (file: File) => {
    const fd = new FormData();
    fd.append("file", file);
    const res = await fetch("/api/upload", { method: "POST", body: fd });
    if (!res.ok) {
      toast.error("Upload failed");
      return;
    }
    const data = await res.json();
    addElements({
      id: newId(),
      type: "image",
      src: data.url,
      x: design.canvasWidth / 2 - 200,
      y: design.canvasHeight / 2 - 200,
      width: 400,
      height: 400,
      rotation: 0,
    });
  };

  const handleSizeChange = (sizeId: string) => {
    const preset = CANVAS_SIZE_PRESETS.find((p) => p.id === sizeId);
    if (!preset) return;
    setDesign((d) => ({ ...d, canvasSize: sizeId, canvasWidth: preset.width, canvasHeight: preset.height }));
  };

  // Resize the canvas AND re-flow elements proportionally to the new dimensions
  const resizeAndScale = (sizeId: string) => {
    const preset = CANVAS_SIZE_PRESETS.find((p) => p.id === sizeId);
    if (!preset) return;
    setDesign((d) => {
      const sx = preset.width / d.canvasWidth;
      const sy = preset.height / d.canvasHeight;
      return {
        ...d,
        canvasSize: sizeId,
        canvasWidth: preset.width,
        canvasHeight: preset.height,
        elements: d.elements.map((el) => ({
          ...el,
          x: el.x * sx,
          y: el.y * sy,
          width: el.width * sx,
          height: el.height * sy,
          ...(el.type === "text" ? { fontSize: (el as { fontSize: number }).fontSize * Math.min(sx, sy) } : {}),
        })),
      };
    });
    toast.success("Resized and scaled to " + preset.label);
  };

  const persistBody = (kind: "draft" | "template" | "badge") => ({
    name: design.name,
    kind,
    canvas_size: design.canvasSize,
    canvas_width: design.canvasWidth,
    canvas_height: design.canvasHeight,
    vehicle_id: design.vehicleId,
    elements: design.elements,
    background_color: design.backgroundColor || "#ffffff",
  });

  const save = async (kind: "draft" | "template" = "draft") => {
    setSaving(true);
    try {
      if (!designId) {
        const res = await fetch("/api/canvas-templates", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(persistBody(kind)),
        });
        if (!res.ok) throw new Error((await res.json()).error || "Failed");
        const data = await res.json();
        setDesignId(data.design.id);
        setDesignState((d) => ({ ...d, id: data.design.id, kind }));
        router.replace(`/dashboard/canvas/${data.design.id}`);
      } else {
        const res = await fetch(`/api/canvas-templates/${designId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(persistBody(kind)),
        });
        if (!res.ok) throw new Error((await res.json()).error || "Failed");
        setDesignState((d) => ({ ...d, kind }));
      }
      toast.success(kind === "template" ? "Saved as template" : "Saved");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const saveSelectionAsBadge = async () => {
    if (selectedIds.length === 0) {
      toast.error("Select one or more elements first");
      return;
    }
    const name = window.prompt("Name this badge:", "My custom badge");
    if (!name) return;
    const els = design.elements.filter((el) => selectedIds.includes(el.id));
    try {
      const res = await fetch("/api/canvas-templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          kind: "badge",
          canvas_size: design.canvasSize,
          canvas_width: design.canvasWidth,
          canvas_height: design.canvasHeight,
          elements: els,
          background_color: design.backgroundColor || "#ffffff",
        }),
      });
      if (!res.ok) throw new Error((await res.json()).error || "Failed");
      toast.success("Saved as reusable badge");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed");
    }
  };

  const exportPNG = async () => {
    if (!stageRef.current) return;
    setExporting(true);
    try {
      if (!designId) await save("draft");
      const finalId = designId || (design.id as string | undefined);
      let dataUrl: string;
      try {
        dataUrl = stageRef.current.toDataURL({ pixelRatio: 2 });
      } catch (_e) {
        throw new Error("Export blocked by image CORS. Re-add any external images via the Library or Upload action.");
      }
      if (!finalId) throw new Error("No design id");
      const res = await fetch(`/api/canvas-templates/${finalId}/export`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dataUrl }),
      });
      if (!res.ok) throw new Error((await res.json()).error || "Export failed");
      const data = await res.json();
      toast.success("Exported to your library");
      window.open(data.url, "_blank");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Export failed");
    } finally {
      setExporting(false);
    }
  };

  const alignSelected = (action: "left" | "right" | "centerH" | "top" | "bottom" | "centerV") => {
    if (selectedIds.length === 0) return;
    const W = design.canvasWidth;
    const H = design.canvasHeight;
    setDesign((d) => ({
      ...d,
      elements: d.elements.map((el) => {
        if (!selectedIds.includes(el.id)) return el;
        const patch: Partial<CanvasElement> = {};
        if (action === "left") patch.x = 0;
        if (action === "right") patch.x = W - el.width;
        if (action === "centerH") patch.x = (W - el.width) / 2;
        if (action === "top") patch.y = 0;
        if (action === "bottom") patch.y = H - el.height;
        if (action === "centerV") patch.y = (H - el.height) / 2;
        return { ...el, ...patch } as CanvasElement;
      }),
    }));
  };

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const isTyping = target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable);
      if (isTyping) return;

      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "z") {
        e.preventDefault();
        if (e.shiftKey) redo();
        else undo();
        return;
      }
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "y") {
        e.preventDefault();
        redo();
        return;
      }
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "d") {
        e.preventDefault();
        duplicateSelected();
        return;
      }
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "s") {
        e.preventDefault();
        save("draft");
        return;
      }
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "a") {
        e.preventDefault();
        setSelectedIds(design.elements.map((el) => el.id));
        return;
      }
      if (e.key === "]" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        moveLayer(e.shiftKey ? "front" : "up");
        return;
      }
      if (e.key === "[" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        moveLayer(e.shiftKey ? "back" : "down");
        return;
      }
      if (e.key === "Delete" || e.key === "Backspace") {
        if (selectedIds.length > 0) {
          e.preventDefault();
          deleteSelected();
        }
        return;
      }
      if (e.key === "Escape") {
        setSelectedIds([]);
        return;
      }
      if (selectedIds.length > 0 && ["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(e.key)) {
        e.preventDefault();
        const step = e.shiftKey ? 20 : 2;
        const dx = e.key === "ArrowLeft" ? -step : e.key === "ArrowRight" ? step : 0;
        const dy = e.key === "ArrowUp" ? -step : e.key === "ArrowDown" ? step : 0;
        setDesign((d) => ({
          ...d,
          elements: d.elements.map((el) =>
            selectedIds.includes(el.id) ? ({ ...el, x: el.x + dx, y: el.y + dy } as CanvasElement) : el
          ),
        }));
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedIds, design.elements]);

  const insertHeadlineFromAI = (text: string) => {
    addElements({
      id: newId(),
      type: "text",
      text,
      x: design.canvasWidth / 2 - 400,
      y: 120,
      width: 800,
      height: 140,
      rotation: 0,
      fontFamily: "Bebas Neue",
      fontSize: 96,
      fontStyle: "bold",
      align: "center",
      fill: dealership?.brand_colors?.primary || "#0F2A47",
      letterSpacing: 2,
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-4rem)] -m-6">
      <aside className="w-56 border-r p-3 overflow-y-auto bg-background">
        <Button variant="ghost" size="sm" className="w-full justify-start mb-3" onClick={() => router.push("/dashboard/canvas")}>
          <ArrowLeft className="h-4 w-4 mr-1" /> Designs
        </Button>
        <Toolbar
          dealership={dealership}
          vehicle={vehicle}
          canvasWidth={design.canvasWidth}
          canvasHeight={design.canvasHeight}
          onAdd={addElements}
          onOpenBadges={() => setBadgeOpen(true)}
          onOpenLibrary={() => setLibraryOpen(true)}
          onOpenVehiclePhotos={() => setVehiclePhotosOpen(true)}
          onUpload={handleUpload}
        />

        <div className="mt-3 space-y-1">
          <Button variant="outline" size="sm" className="w-full justify-start" onClick={() => setHeadlineOpen(true)}>
            <Sparkles className="h-4 w-4 mr-2 text-primary" /> AI Headline
          </Button>
          <Button variant="outline" size="sm" className="w-full justify-start" onClick={() => setTemplatesOpen(true)}>
            <Wand2 className="h-4 w-4 mr-2" /> Starter templates
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="w-full justify-start"
            onClick={saveSelectionAsBadge}
            disabled={selectedIds.length === 0}
          >
            <BadgeCheck className="h-4 w-4 mr-2" /> Save selection as badge
          </Button>
        </div>

        <div className="mt-5">
          <Label className="text-xs uppercase tracking-wider text-muted-foreground">Canvas color</Label>
          <input
            type="color"
            value={design.backgroundColor || "#ffffff"}
            onChange={(e) => setDesign((d) => ({ ...d, backgroundColor: e.target.value }))}
            className="mt-1 w-full h-8 rounded border bg-transparent"
          />
        </div>

        <div className="mt-4">
          <Label className="text-xs uppercase tracking-wider text-muted-foreground">Overlays</Label>
          <div className="grid grid-cols-3 gap-1 mt-1">
            <Button size="sm" variant={showGrid ? "default" : "ghost"} onClick={() => setShowGrid((v) => !v)} title="50px grid">
              <Grid3x3 className="h-3.5 w-3.5" />
            </Button>
            <Button size="sm" variant={showThirds ? "default" : "ghost"} onClick={() => setShowThirds((v) => !v)} title="Rule of thirds">
              <ScanSearch className="h-3.5 w-3.5" />
            </Button>
            <Button size="sm" variant={showSafe ? "default" : "ghost"} onClick={() => setShowSafe((v) => !v)} title="Safe area">
              <Maximize2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>

        <div className="mt-5">
          <Label className="text-xs uppercase tracking-wider text-muted-foreground flex items-center gap-1">
            <Layers className="h-3 w-3" /> Layers ({design.elements.length})
          </Label>
          <LayerPanel
            elements={design.elements}
            selectedIds={selectedIds}
            onSelect={handleSelect}
            onChange={updateElements}
            onDelete={(id) => {
              setDesign((d) => ({ ...d, elements: d.elements.filter((el) => el.id !== id) }));
              setSelectedIds((prev) => prev.filter((x) => x !== id));
            }}
          />
        </div>
      </aside>

      <div className="flex-1 flex flex-col bg-muted/30 min-w-0">
        <div className="border-b p-2 flex flex-wrap items-center gap-2 bg-background">
          <Input
            value={design.name}
            onChange={(e) => setDesign((d) => ({ ...d, name: e.target.value }))}
            className="h-8 max-w-[180px]"
            placeholder="Design name"
          />
          <Select value={design.canvasSize} onValueChange={(v) => v && handleSizeChange(v)}>
            <SelectTrigger className="h-8 max-w-[200px] text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {CANVAS_SIZE_PRESETS.map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  {p.label} · {p.width}×{p.height}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value="" onValueChange={(v) => v && resizeAndScale(v)}>
            <SelectTrigger className="h-8 max-w-[180px] text-xs" title="Resize and re-flow elements">
              <Maximize2 className="h-3.5 w-3.5 mr-1" />
              <SelectValue placeholder="Resize & rescale" />
            </SelectTrigger>
            <SelectContent>
              {CANVAS_SIZE_PRESETS.map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  → {p.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={design.vehicleId ?? "__none__"}
            onValueChange={(v) => setDesign((d) => ({ ...d, vehicleId: v && v !== "__none__" ? v : null }))}
          >
            <SelectTrigger className="h-8 max-w-[220px] text-xs">
              <PaintBucket className="h-3.5 w-3.5 mr-1" />
              <SelectValue placeholder="Bind a vehicle" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__none__">No vehicle binding</SelectItem>
              {vehicles.map((v) => (
                <SelectItem key={v.id} value={v.id}>
                  {[v.year, v.make, v.model, v.trim].filter(Boolean).join(" ")}
                  {v.stock_number ? ` — #${v.stock_number}` : ""}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <span className="w-px h-6 bg-border" />

          <Button size="icon-sm" variant="ghost" onClick={undo} title="Undo (⌘Z)">
            <Undo2 className="h-4 w-4" />
          </Button>
          <Button size="icon-sm" variant="ghost" onClick={redo} title="Redo (⌘⇧Z)">
            <Redo2 className="h-4 w-4" />
          </Button>

          <span className="w-px h-6 bg-border" />

          <Button size="icon-sm" variant="ghost" onClick={() => alignSelected("left")} disabled={selectedIds.length === 0}>
            <AlignStartHorizontal className="h-4 w-4" />
          </Button>
          <Button size="icon-sm" variant="ghost" onClick={() => alignSelected("centerH")} disabled={selectedIds.length === 0}>
            <AlignHorizontalJustifyCenter className="h-4 w-4" />
          </Button>
          <Button size="icon-sm" variant="ghost" onClick={() => alignSelected("right")} disabled={selectedIds.length === 0}>
            <AlignEndHorizontal className="h-4 w-4" />
          </Button>
          <Button size="icon-sm" variant="ghost" onClick={() => alignSelected("top")} disabled={selectedIds.length === 0}>
            <AlignStartVertical className="h-4 w-4" />
          </Button>
          <Button size="icon-sm" variant="ghost" onClick={() => alignSelected("centerV")} disabled={selectedIds.length === 0}>
            <AlignVerticalJustifyCenter className="h-4 w-4" />
          </Button>
          <Button size="icon-sm" variant="ghost" onClick={() => alignSelected("bottom")} disabled={selectedIds.length === 0}>
            <AlignEndVertical className="h-4 w-4" />
          </Button>

          {selectedIds.length > 1 && (
            <span className="text-xs text-muted-foreground ml-1">{selectedIds.length} selected</span>
          )}

          <div className="ml-auto flex gap-2">
            <Button size="sm" variant="outline" onClick={() => save("template")} disabled={saving}>
              <Bookmark className="h-4 w-4 mr-1" /> Save template
            </Button>
            <Button size="sm" variant="outline" onClick={() => save("draft")} disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Save className="h-4 w-4 mr-1" />}
              Save
            </Button>
            <Button size="sm" onClick={exportPNG} disabled={exporting}>
              {exporting ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Download className="h-4 w-4 mr-1" />}
              Export PNG
            </Button>
          </div>
        </div>

        <div ref={containerRef} className="flex-1 flex items-center justify-center overflow-hidden">
          <div className="shadow-xl">
            <CanvasEditor
              width={design.canvasWidth}
              height={design.canvasHeight}
              elements={design.elements}
              selectedIds={selectedIds}
              onSelect={handleSelect}
              onChange={updateElements}
              vehicle={vehicle}
              dealership={dealership}
              stageRef={stageRef}
              scale={stageScale}
              backgroundColor={design.backgroundColor}
              showGrid={showGrid}
              showSafeArea={showSafe}
              showThirds={showThirds}
            />
          </div>
        </div>
      </div>

      <aside className="w-72 border-l p-3 overflow-y-auto bg-background">
        {selectedIds.length > 1 ? (
          <div className="space-y-3 text-sm">
            <p className="text-xs uppercase tracking-wider text-muted-foreground">{selectedIds.length} elements selected</p>
            <div className="grid grid-cols-2 gap-2">
              <Button size="sm" variant="outline" onClick={duplicateSelected}>
                Duplicate
              </Button>
              <Button size="sm" variant="outline" onClick={deleteSelected}>
                <Trash2 className="h-3.5 w-3.5 mr-1 text-destructive" /> Delete all
              </Button>
              <Button size="sm" variant="outline" onClick={saveSelectionAsBadge} className="col-span-2">
                <BadgeCheck className="h-3.5 w-3.5 mr-1" /> Save as badge
              </Button>
            </div>
          </div>
        ) : (
          <PropertyPanel
            selected={selected}
            dealership={dealership}
            onChange={updateSelected}
            onDelete={deleteSelected}
            onDuplicate={duplicateSelected}
            onMoveLayer={(d) => moveLayer(d)}
          />
        )}
      </aside>

      <BadgePicker
        open={badgeOpen}
        onClose={() => setBadgeOpen(false)}
        dealership={dealership}
        vehicle={vehicle}
        canvasWidth={design.canvasWidth}
        canvasHeight={design.canvasHeight}
        onAdd={addElements}
      />
      <AssetPickerDialog
        open={libraryOpen}
        onClose={() => setLibraryOpen(false)}
        onPick={(url) => {
          addElements({
            id: newId(),
            type: "image",
            src: url,
            x: 0,
            y: 0,
            width: design.canvasWidth,
            height: design.canvasHeight,
            rotation: 0,
            name: "Background",
          });
        }}
      />
      <VehiclePhotoPicker
        open={vehiclePhotosOpen}
        onClose={() => setVehiclePhotosOpen(false)}
        vehicle={vehicle}
        onPick={(url) => {
          addElements({
            id: newId(),
            type: "image",
            src: url,
            x: design.canvasWidth / 2 - 320,
            y: design.canvasHeight / 2 - 240,
            width: 640,
            height: 480,
            rotation: 0,
            name: "Vehicle photo",
          });
        }}
      />
      <AIHeadlineDialog
        open={headlineOpen}
        onClose={() => setHeadlineOpen(false)}
        dealership={dealership}
        vehicle={vehicle}
        onPick={insertHeadlineFromAI}
      />
      <StarterTemplatesDialog
        open={templatesOpen}
        onClose={() => setTemplatesOpen(false)}
        dealership={dealership}
        onPick={(t) => {
          const next = templateToDesign(t, dealership);
          setDesign((d) => ({ ...d, ...next } as Design));
          setSelectedIds([]);
        }}
      />
    </div>
  );
}
