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
import { BADGE_PRESETS } from "@/lib/canvas/badge-presets";
import { Toolbar } from "@/components/canvas/Toolbar";
import { PropertyPanel } from "@/components/canvas/PropertyPanel";
import { BadgePicker } from "@/components/canvas/BadgePicker";
import { AssetPickerDialog } from "@/components/canvas/AssetPickerDialog";
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
};

export default function CanvasEditorPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const id = params.id as string;
  const isNew = id === "new";

  const { dealership, vehicles } = useAppStore();
  const [design, setDesign] = useState<Design>(DEFAULT_DESIGN);
  const [designId, setDesignId] = useState<string | null>(isNew ? null : id);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [badgeOpen, setBadgeOpen] = useState(false);
  const [libraryOpen, setLibraryOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [loading, setLoading] = useState(!isNew);
  const stageRef = useRef<Konva.Stage | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [stageScale, setStageScale] = useState(1);

  const vehicle: Vehicle | null = useMemo(
    () => (design.vehicleId ? vehicles.find((v) => v.id === design.vehicleId) ?? null : null),
    [design.vehicleId, vehicles]
  );

  // Load existing design
  useEffect(() => {
    if (isNew) {
      const fromAsset = searchParams.get("fromAssetId");
      const fromUrl = searchParams.get("fromUrl");
      const url = fromUrl;
      if (url || fromAsset) {
        // Initialize with background image element
        setDesign((d) => ({
          ...d,
          elements: url
            ? [
                {
                  id: newId(),
                  type: "image",
                  src: url,
                  x: 0,
                  y: 0,
                  width: d.canvasWidth,
                  height: d.canvasHeight,
                  rotation: 0,
                } as CanvasElement,
              ]
            : d.elements,
        }));
      }
      return;
    }
    setLoading(true);
    fetch(`/api/canvas-templates/${id}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.design) {
          setDesign({
            id: data.design.id,
            name: data.design.name,
            kind: data.design.kind,
            canvasSize: data.design.canvas_size,
            canvasWidth: data.design.canvas_width,
            canvasHeight: data.design.canvas_height,
            vehicleId: data.design.vehicle_id,
            elements: data.design.elements || [],
            thumbnailUrl: data.design.thumbnail_url,
            exportedUrl: data.design.exported_url,
          });
          setDesignId(data.design.id);
        }
      })
      .finally(() => setLoading(false));
  }, [id, isNew, searchParams]);

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

  const updateElements = useCallback((next: CanvasElement[]) => {
    setDesign((d) => ({ ...d, elements: next }));
  }, []);

  const addElements = useCallback((els: CanvasElement | CanvasElement[]) => {
    const arr = Array.isArray(els) ? els : [els];
    setDesign((d) => ({ ...d, elements: [...d.elements, ...arr] }));
    if (arr.length === 1) setSelectedId(arr[0].id);
  }, []);

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

  const deleteSelected = () => {
    if (!selectedId) return;
    setDesign((d) => ({ ...d, elements: d.elements.filter((el) => el.id !== selectedId) }));
    setSelectedId(null);
  };

  const duplicateSelected = () => {
    if (!selected) return;
    const copy: CanvasElement = { ...selected, id: newId(), x: selected.x + 20, y: selected.y + 20 };
    setDesign((d) => ({ ...d, elements: [...d.elements, copy] }));
    setSelectedId(copy.id);
  };

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
        setDesign((d) => ({ ...d, id: data.design.id, kind }));
        router.replace(`/dashboard/canvas/${data.design.id}`);
      } else {
        const res = await fetch(`/api/canvas-templates/${designId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(persistBody(kind)),
        });
        if (!res.ok) throw new Error((await res.json()).error || "Failed");
        setDesign((d) => ({ ...d, kind }));
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
      // First save so we have an id
      if (!designId) await save("draft");
      const targetId = designId;
      const finalId = targetId || (design.id as string | undefined);
      const dataUrl = stageRef.current.toDataURL({ pixelRatio: 2 });
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-4rem)] -m-6">
      {/* Left rail: toolbar + layers */}
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

      {/* Center stage */}
      <div className="flex-1 flex flex-col bg-muted/30 min-w-0">
        <div className="border-b p-2 flex items-center gap-2 bg-background">
          <Input
            value={design.name}
            onChange={(e) => setDesign((d) => ({ ...d, name: e.target.value }))}
            className="h-8 max-w-xs"
            placeholder="Design name"
          />
          <Select value={design.canvasSize} onValueChange={(v) => v && handleSizeChange(v)}>
            <SelectTrigger className="h-8 max-w-[220px] text-xs">
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
            value={design.vehicleId ?? ""}
            onValueChange={(v) => setDesign((d) => ({ ...d, vehicleId: v || null }))}
          >
            <SelectTrigger className="h-8 max-w-[260px] text-xs">
              <PaintBucket className="h-3.5 w-3.5 mr-1" />
              <SelectValue placeholder="Bind a vehicle (optional)" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">No vehicle binding</SelectItem>
              {vehicles.map((v) => (
                <SelectItem key={v.id} value={v.id}>
                  {[v.year, v.make, v.model, v.trim].filter(Boolean).join(" ")}
                  {v.stock_number ? ` — #${v.stock_number}` : ""}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

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
            />
          </div>
        </div>
      </div>

      {/* Right rail: properties */}
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
    </div>
  );
}
