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
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [badgeOpen, setBadgeOpen] = useState(false);
  const [libraryOpen, setLibraryOpen] = useState(false);
  const [headlineOpen, setHeadlineOpen] = useState(false);
  const [templatesOpen, setTemplatesOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [loading, setLoading] = useState(!isNew);
  const stageRef = useRef<Konva.Stage | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [stageScale, setStageScale] = useState(1);

  // Undo/redo history
  const historyRef = useRef<Design[]>([]);
  const futureRef = useRef<Design[]>([]);
  const skipHistoryRef = useRef(true); // first set after load shouldn't push history

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

  // Load existing design or initialize from query params / starter template
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

  // Fit canvas to container
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
      if (arr.length === 1) setSelectedId(arr[0].id);
    },
    [setDesign]
  );

  const selected = useMemo(
    () => design.elements.find((el) => el.id === selectedId) || null,
    [design.elements, selectedId]
  );

  const updateSelected = (patch: Partial<CanvasElement>) => {
    if (!selectedId) return;
    setDesign((d) => ({
      ...d,
      elements: d.elements.map((el) =>
        el.id === selectedId ? ({ ...el, ...patch } as CanvasElement) : el
      ),
    }));
  };

  const deleteSelected = useCallback(() => {
    if (!selectedId) return;
    setDesign((d) => ({ ...d, elements: d.elements.filter((el) => el.id !== selectedId) }));
    setSelectedId(null);
  }, [selectedId, setDesign]);

  const duplicateSelected = useCallback(() => {
    if (!selected) return;
    const copy: CanvasElement = { ...selected, id: newId(), x: selected.x + 20, y: selected.y + 20 };
    setDesign((d) => ({ ...d, elements: [...d.elements, copy] }));
    setSelectedId(copy.id);
  }, [selected, setDesign]);

  const moveLayer = (direction: "up" | "down") => {
    if (!selectedId) return;
    setDesign((d) => {
      const idx = d.elements.findIndex((el) => el.id === selectedId);
      if (idx < 0) return d;
      const arr = [...d.elements];
      const swap = direction === "up" ? idx + 1 : idx - 1;
      if (swap < 0 || swap >= arr.length) return d;
      [arr[idx], arr[swap]] = [arr[swap], arr[idx]];
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

  const persistBody = (kind: "draft" | "template") => ({
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

  const exportPNG = async () => {
    if (!stageRef.current) return;
    setExporting(true);
    try {
      if (!designId) await save("draft");
      const finalId = designId || (design.id as string | undefined);
      let dataUrl: string;
      try {
        dataUrl = stageRef.current.toDataURL({ pixelRatio: 2 });
      } catch (e) {
        throw new Error(
          "Export blocked by image CORS. Re-add any external images via the Library or Upload action so they go through the proxy."
        );
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

  // Alignment helpers
  const alignSelected = (action: "left" | "right" | "centerH" | "top" | "bottom" | "centerV") => {
    if (!selected) return;
    const W = design.canvasWidth;
    const H = design.canvasHeight;
    const patch: Partial<CanvasElement> = {};
    if (action === "left") patch.x = 0;
    if (action === "right") patch.x = W - selected.width;
    if (action === "centerH") patch.x = (W - selected.width) / 2;
    if (action === "top") patch.y = 0;
    if (action === "bottom") patch.y = H - selected.height;
    if (action === "centerV") patch.y = (H - selected.height) / 2;
    updateSelected(patch);
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const isTyping =
        target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable);
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
      if (e.key === "Delete" || e.key === "Backspace") {
        if (selectedId) {
          e.preventDefault();
          deleteSelected();
        }
        return;
      }
      if (e.key === "Escape") {
        setSelectedId(null);
        return;
      }
      // Arrow nudging
      if (selectedId && ["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(e.key)) {
        e.preventDefault();
        const step = e.shiftKey ? 20 : 2;
        const dx = e.key === "ArrowLeft" ? -step : e.key === "ArrowRight" ? step : 0;
        const dy = e.key === "ArrowUp" ? -step : e.key === "ArrowDown" ? step : 0;
        updateSelected({ x: selected!.x + dx, y: selected!.y + dy });
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [selectedId, selected, undo, redo, deleteSelected, duplicateSelected]);

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
          canvasWidth={design.canvasWidth}
          canvasHeight={design.canvasHeight}
          onAdd={addElements}
          onOpenBadges={() => setBadgeOpen(true)}
          onOpenLibrary={() => setLibraryOpen(true)}
          onUpload={handleUpload}
        />

        <div className="mt-3 space-y-1">
          <Button variant="outline" size="sm" className="w-full justify-start" onClick={() => setHeadlineOpen(true)}>
            <Sparkles className="h-4 w-4 mr-2 text-primary" /> AI Headline
          </Button>
          <Button variant="outline" size="sm" className="w-full justify-start" onClick={() => setTemplatesOpen(true)}>
            <Wand2 className="h-4 w-4 mr-2" /> Starter templates
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

        <div className="mt-5">
          <Label className="text-xs uppercase tracking-wider text-muted-foreground flex items-center gap-1">
            <Layers className="h-3 w-3" /> Layers ({design.elements.length})
          </Label>
          <div className="mt-1 space-y-0.5 max-h-72 overflow-y-auto">
            {design.elements
              .slice()
              .reverse()
              .map((el) => (
                <button
                  key={el.id}
                  onClick={() => setSelectedId(el.id)}
                  className={`w-full text-left px-2 py-1 text-xs rounded ${
                    selectedId === el.id ? "bg-primary/10 text-primary" : "hover:bg-muted"
                  }`}
                >
                  {el.type === "text"
                    ? `T ${(el as { text: string }).text.slice(0, 20)}`
                    : el.type === "image"
                    ? "Image"
                    : el.type === "qr"
                    ? "QR"
                    : `Shape (${(el as { shape: string }).shape})`}
                </button>
              ))}
          </div>
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

          <Button size="icon-sm" variant="ghost" onClick={() => alignSelected("left")} disabled={!selected} title="Align left">
            <AlignStartHorizontal className="h-4 w-4" />
          </Button>
          <Button size="icon-sm" variant="ghost" onClick={() => alignSelected("centerH")} disabled={!selected} title="Center horizontally">
            <AlignHorizontalJustifyCenter className="h-4 w-4" />
          </Button>
          <Button size="icon-sm" variant="ghost" onClick={() => alignSelected("right")} disabled={!selected} title="Align right">
            <AlignEndHorizontal className="h-4 w-4" />
          </Button>
          <Button size="icon-sm" variant="ghost" onClick={() => alignSelected("top")} disabled={!selected} title="Align top">
            <AlignStartVertical className="h-4 w-4" />
          </Button>
          <Button size="icon-sm" variant="ghost" onClick={() => alignSelected("centerV")} disabled={!selected} title="Center vertically">
            <AlignVerticalJustifyCenter className="h-4 w-4" />
          </Button>
          <Button size="icon-sm" variant="ghost" onClick={() => alignSelected("bottom")} disabled={!selected} title="Align bottom">
            <AlignEndVertical className="h-4 w-4" />
          </Button>

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
              selectedId={selectedId}
              onSelect={setSelectedId}
              onChange={updateElements}
              vehicle={vehicle}
              dealership={dealership}
              stageRef={stageRef}
              scale={stageScale}
              backgroundColor={design.backgroundColor}
            />
          </div>
        </div>
      </div>

      <aside className="w-72 border-l p-3 overflow-y-auto bg-background">
        <PropertyPanel
          selected={selected}
          dealership={dealership}
          onChange={updateSelected}
          onDelete={deleteSelected}
          onDuplicate={duplicateSelected}
          onMoveLayer={moveLayer}
        />
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
          setSelectedId(null);
        }}
      />
    </div>
  );
}
