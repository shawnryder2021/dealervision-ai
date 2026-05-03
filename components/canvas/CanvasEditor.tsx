"use client";

import { useEffect, useMemo, useRef } from "react";
import Konva_ from "konva";
import {
  Stage,
  Layer,
  Rect,
  Circle,
  Star,
  Text as KonvaText,
  Image as KonvaImage,
  Transformer,
  Line,
} from "react-konva";
import type Konva from "konva";
import useImage from "use-image";
import { useState } from "react";
import type { CanvasElement, ImageElement, ShapeElement, TextElement, QrElement } from "@/lib/canvas/types";
import { applyMergeTags } from "@/lib/canvas/merge-tags";
import type { Dealership, Vehicle } from "@/lib/types";

interface Props {
  width: number;
  height: number;
  elements: CanvasElement[];
  selectedIds: string[];
  onSelect: (id: string | null, additive?: boolean) => void;
  onChange: (next: CanvasElement[]) => void;
  vehicle: Vehicle | null;
  dealership: Dealership | null;
  stageRef: React.MutableRefObject<Konva.Stage | null>;
  scale: number;
  backgroundColor?: string;
  showGrid?: boolean;
  showSafeArea?: boolean;
  showThirds?: boolean;
}

type CommonHandlers = {
  draggable: boolean;
  onMouseDown: (e: Konva.KonvaEventObject<MouseEvent>) => void;
  onTouchStart: (e: Konva.KonvaEventObject<TouchEvent>) => void;
  onDragMove?: (e: Konva.KonvaEventObject<DragEvent>) => void;
  onDragEnd: (e: Konva.KonvaEventObject<DragEvent>) => void;
  onTransformEnd: (e: Konva.KonvaEventObject<Event>) => void;
};

interface BuildHandlersCtx {
  onSelect: (id: string, additive?: boolean) => void;
  updateEl: (id: string, patch: Partial<CanvasElement>) => void;
  onDragMove?: (e: Konva.KonvaEventObject<DragEvent>, el: CanvasElement) => void;
}

function buildHandlers(el: CanvasElement, ctx: BuildHandlersCtx): CommonHandlers {
  return {
    draggable: !el.locked,
    onMouseDown: (e) => {
      e.cancelBubble = true;
      const native = e.evt as MouseEvent;
      ctx.onSelect(el.id, native?.shiftKey || native?.metaKey || false);
    },
    onTouchStart: (e) => {
      e.cancelBubble = true;
      ctx.onSelect(el.id);
    },
    onDragMove: (e) => ctx.onDragMove?.(e, el),
    onDragEnd: (e) => {
      ctx.updateEl(el.id, { x: e.target.x(), y: e.target.y() });
    },
    onTransformEnd: (e) => {
      const node = e.target;
      const sx = node.scaleX();
      const sy = node.scaleY();
      node.scaleX(1);
      node.scaleY(1);
      ctx.updateEl(el.id, {
        x: node.x(),
        y: node.y(),
        width: Math.max(8, el.width * sx),
        height: Math.max(8, el.height * sy),
        rotation: node.rotation(),
      });
    },
  };
}

function proxiedSrc(url: string): string {
  if (!url) return url;
  if (url.startsWith("data:") || url.startsWith("blob:")) return url;
  if (typeof window !== "undefined") {
    try {
      const u = new URL(url, window.location.origin);
      if (u.origin === window.location.origin) return url; // same-origin: no proxy
    } catch {}
  }
  return `/api/image-proxy?url=${encodeURIComponent(url)}`;
}

function ImageNode({
  el,
  handlers,
}: {
  el: ImageElement;
  handlers: CommonHandlers;
}) {
  const [img] = useImage(proxiedSrc(el.src), "anonymous");
  const ref = useRef<Konva_.Image | null>(null);
  const filters = el.filters || {};
  const filterArr = useMemo(() => {
    const arr: Array<typeof Konva_.Filters[keyof typeof Konva_.Filters]> = [];
    if (filters.brightness != null) arr.push(Konva_.Filters.Brighten);
    if (filters.contrast != null) arr.push(Konva_.Filters.Contrast);
    if (filters.blur) arr.push(Konva_.Filters.Blur);
    if (filters.grayscale) arr.push(Konva_.Filters.Grayscale);
    if (filters.invert) arr.push(Konva_.Filters.Invert);
    return arr;
  }, [filters.brightness, filters.contrast, filters.blur, filters.grayscale, filters.invert]);
  useEffect(() => {
    const node = ref.current;
    if (!node || !img) return;
    if (filterArr.length > 0) {
      node.cache();
      node.filters(filterArr);
      node.getLayer()?.batchDraw();
    } else {
      node.clearCache();
      node.filters([]);
      node.getLayer()?.batchDraw();
    }
  }, [img, filterArr, el.width, el.height]);
  return (
    <KonvaImage
      ref={ref as React.RefObject<Konva_.Image>}
      id={el.id}
      x={el.x}
      y={el.y}
      width={el.width}
      height={el.height}
      rotation={el.rotation}
      opacity={el.opacity ?? 1}
      image={img}
      cornerRadius={el.cornerRadius}
      brightness={filters.brightness ?? 0}
      contrast={filters.contrast ?? 0}
      blurRadius={filters.blur ?? 0}
      {...handlers}
    />
  );
}

function QrNode({ el, handlers }: { el: QrElement; handlers: CommonHandlers }) {
  const [src, setSrc] = useState<string>("");
  useEffect(() => {
    let cancelled = false;
    import("qrcode").then(({ default: QRCode }) => {
      QRCode.toDataURL(el.data || " ", { color: { dark: el.fill, light: el.bg }, margin: 0 }).then((url) => {
        if (!cancelled) setSrc(url);
      });
    });
    return () => {
      cancelled = true;
    };
  }, [el.data, el.fill, el.bg]);
  const [img] = useImage(src);
  return (
    <KonvaImage
      id={el.id}
      x={el.x}
      y={el.y}
      width={el.width}
      height={el.height}
      rotation={el.rotation}
      opacity={el.opacity ?? 1}
      image={img}
      {...handlers}
    />
  );
}

function ShapeNode({ el, handlers }: { el: ShapeElement; handlers: CommonHandlers }) {
  const common = {
    id: el.id,
    x: el.x,
    y: el.y,
    rotation: el.rotation,
    opacity: el.opacity ?? 1,
    fill: el.fill,
    stroke: el.stroke,
    strokeWidth: el.strokeWidth ?? 0,
    width: el.width,
    height: el.height,
    ...handlers,
  };
  if (el.shape === "circle") {
    const r = Math.min(el.width, el.height) / 2;
    return <Circle {...common} radius={r} offsetX={-el.width / 2} offsetY={-el.height / 2} />;
  }
  if (el.shape === "star") {
    return (
      <Star
        {...common}
        numPoints={el.numPoints ?? 8}
        innerRadius={(Math.min(el.width, el.height) / 2) * (el.innerRadius ?? 0.5)}
        outerRadius={Math.min(el.width, el.height) / 2}
        offsetX={-el.width / 2}
        offsetY={-el.height / 2}
      />
    );
  }
  return <Rect {...common} cornerRadius={el.cornerRadius} />;
}

function TextNode({ el, handlers }: { el: TextElement; handlers: CommonHandlers }) {
  const text = el.uppercase ? el.text.toUpperCase() : el.text;
  return (
    <KonvaText
      id={el.id}
      x={el.x}
      y={el.y}
      width={el.width}
      height={el.height}
      rotation={el.rotation}
      opacity={el.opacity ?? 1}
      text={text}
      fontFamily={el.fontFamily}
      fontSize={el.fontSize}
      fontStyle={el.fontStyle}
      align={el.align}
      fill={el.fill}
      stroke={el.stroke}
      strokeWidth={el.strokeWidth}
      letterSpacing={el.letterSpacing}
      lineHeight={el.lineHeight ?? 1.1}
      shadowColor={el.shadow?.color}
      shadowBlur={el.shadow?.blur}
      shadowOffsetX={el.shadow?.offsetX}
      shadowOffsetY={el.shadow?.offsetY}
      shadowOpacity={el.shadow?.opacity}
      {...handlers}
    />
  );
}

interface Guide {
  type: "v" | "h";
  pos: number;
}

const SNAP_THRESHOLD = 6; // canvas units

function computeSnapTargets(
  width: number,
  height: number,
  movingId: string,
  elements: CanvasElement[]
) {
  const v: number[] = [0, width / 2, width];
  const h: number[] = [0, height / 2, height];
  for (const el of elements) {
    if (el.id === movingId) continue;
    if (el.visible === false) continue;
    v.push(el.x, el.x + el.width / 2, el.x + el.width);
    h.push(el.y, el.y + el.height / 2, el.y + el.height);
  }
  return { v, h };
}

function snap(value: number, targets: number[]): { snapped: number; line: number | null } {
  for (const t of targets) {
    if (Math.abs(value - t) <= SNAP_THRESHOLD) return { snapped: t, line: t };
  }
  return { snapped: value, line: null };
}

export default function CanvasEditor({
  width,
  height,
  elements,
  selectedIds,
  onSelect,
  onChange,
  vehicle,
  dealership,
  stageRef,
  scale,
  backgroundColor = "#ffffff",
  showGrid = false,
  showSafeArea = false,
  showThirds = false,
}: Props) {
  const layerRef = useRef<Konva.Layer | null>(null);
  const trRef = useRef<Konva.Transformer | null>(null);
  const [guides, setGuides] = useState<Guide[]>([]);

  const merged = useMemo(() => applyMergeTags(elements, vehicle, dealership), [elements, vehicle, dealership]);
  const visibleEls = useMemo(() => merged.filter((el) => el.visible !== false), [merged]);

  useEffect(() => {
    const tr = trRef.current;
    const layer = layerRef.current;
    if (!tr || !layer) return;
    if (selectedIds.length === 0) {
      tr.nodes([]);
      tr.getLayer()?.batchDraw();
      return;
    }
    const nodes = selectedIds
      .map((id) => layer.findOne(`#${id}`))
      .filter(Boolean) as Konva.Node[];
    tr.nodes(nodes);
    tr.getLayer()?.batchDraw();
  }, [selectedIds, visibleEls]);

  const handleStageMouseDown = (e: Konva.KonvaEventObject<MouseEvent>) => {
    if (e.target === e.target.getStage()) onSelect(null);
  };

  const updateEl = (id: string, patch: Partial<CanvasElement>) => {
    onChange(elements.map((el) => (el.id === id ? ({ ...el, ...patch } as CanvasElement) : el)));
  };

  const handleDragMove = (e: Konva.KonvaEventObject<DragEvent>, el: CanvasElement) => {
    const node = e.target;
    const x = node.x();
    const y = node.y();
    const targets = computeSnapTargets(width, height, el.id, elements);
    const newGuides: Guide[] = [];
    // Check left, center, right edges
    const xLeft = snap(x, targets.v);
    const xCenter = snap(x + el.width / 2, targets.v);
    const xRight = snap(x + el.width, targets.v);
    const candidates = [
      { kind: "left" as const, snapped: xLeft },
      { kind: "center" as const, snapped: xCenter },
      { kind: "right" as const, snapped: xRight },
    ].filter((c) => c.snapped.line !== null);
    if (candidates.length > 0) {
      // Pick the closest one
      candidates.sort((a, b) => Math.abs(a.snapped.snapped - (a.kind === "left" ? x : a.kind === "center" ? x + el.width / 2 : x + el.width)) - Math.abs(b.snapped.snapped - (b.kind === "left" ? x : b.kind === "center" ? x + el.width / 2 : x + el.width)));
      const best = candidates[0];
      const line = best.snapped.line!;
      const offset = best.kind === "left" ? 0 : best.kind === "center" ? -el.width / 2 : -el.width;
      node.x(line + offset);
      newGuides.push({ type: "v", pos: line });
    }
    const yTop = snap(y, targets.h);
    const yMid = snap(y + el.height / 2, targets.h);
    const yBot = snap(y + el.height, targets.h);
    const candY = [
      { kind: "top" as const, snapped: yTop },
      { kind: "mid" as const, snapped: yMid },
      { kind: "bot" as const, snapped: yBot },
    ].filter((c) => c.snapped.line !== null);
    if (candY.length > 0) {
      candY.sort((a, b) => Math.abs(a.snapped.snapped - (a.kind === "top" ? y : a.kind === "mid" ? y + el.height / 2 : y + el.height)) - Math.abs(b.snapped.snapped - (b.kind === "top" ? y : b.kind === "mid" ? y + el.height / 2 : y + el.height)));
      const best = candY[0];
      const line = best.snapped.line!;
      const offset = best.kind === "top" ? 0 : best.kind === "mid" ? -el.height / 2 : -el.height;
      node.y(line + offset);
      newGuides.push({ type: "h", pos: line });
    }
    setGuides(newGuides);
  };

  const clearGuides = () => setGuides([]);

  const handlerCtx = {
    onSelect,
    updateEl,
    onDragMove: handleDragMove,
  };

  return (
    <Stage
      ref={(node) => {
        stageRef.current = node;
      }}
      width={width * scale}
      height={height * scale}
      scaleX={scale}
      scaleY={scale}
      onMouseDown={handleStageMouseDown}
      onTouchStart={(e) => {
        if (e.target === e.target.getStage()) onSelect(null);
      }}
      style={{ background: "#ffffff" }}
    >
      <Layer ref={layerRef as React.RefObject<Konva.Layer>}>
        <Rect x={0} y={0} width={width} height={height} fill={backgroundColor} listening={false} />
        {visibleEls.map((el) => {
          const handlers = buildHandlers(el, handlerCtx);
          // Wrap onDragEnd to clear guides
          const wrappedHandlers = {
            ...handlers,
            onDragEnd: (e: Konva.KonvaEventObject<DragEvent>) => {
              clearGuides();
              handlers.onDragEnd(e);
            },
          };
          if (el.type === "image") return <ImageNode key={el.id} el={el} handlers={wrappedHandlers} />;
          if (el.type === "shape") return <ShapeNode key={el.id} el={el} handlers={wrappedHandlers} />;
          if (el.type === "qr") return <QrNode key={el.id} el={el} handlers={wrappedHandlers} />;
          return <TextNode key={el.id} el={el} handlers={wrappedHandlers} />;
        })}

        {/* Guide lines */}
        {guides.map((g, i) => (
          <Line
            key={i}
            points={g.type === "v" ? [g.pos, 0, g.pos, height] : [0, g.pos, width, g.pos]}
            stroke="#FF00AA"
            strokeWidth={1 / scale}
            dash={[6 / scale, 4 / scale]}
            listening={false}
          />
        ))}

        {/* Overlays */}
        {showGrid && (
          <>
            {Array.from({ length: Math.floor(width / 50) }).map((_, i) => (
              <Line
                key={`gv-${i}`}
                points={[(i + 1) * 50, 0, (i + 1) * 50, height]}
                stroke="#0000FF"
                strokeWidth={1 / scale}
                opacity={0.08}
                listening={false}
              />
            ))}
            {Array.from({ length: Math.floor(height / 50) }).map((_, i) => (
              <Line
                key={`gh-${i}`}
                points={[0, (i + 1) * 50, width, (i + 1) * 50]}
                stroke="#0000FF"
                strokeWidth={1 / scale}
                opacity={0.08}
                listening={false}
              />
            ))}
          </>
        )}
        {showThirds && (
          <>
            <Line points={[width / 3, 0, width / 3, height]} stroke="#000" opacity={0.25} strokeWidth={1 / scale} listening={false} />
            <Line points={[(2 * width) / 3, 0, (2 * width) / 3, height]} stroke="#000" opacity={0.25} strokeWidth={1 / scale} listening={false} />
            <Line points={[0, height / 3, width, height / 3]} stroke="#000" opacity={0.25} strokeWidth={1 / scale} listening={false} />
            <Line points={[0, (2 * height) / 3, width, (2 * height) / 3]} stroke="#000" opacity={0.25} strokeWidth={1 / scale} listening={false} />
          </>
        )}
        {showSafeArea && (
          <Rect
            x={width * 0.05}
            y={height * 0.05}
            width={width * 0.9}
            height={height * 0.9}
            stroke="#16a34a"
            strokeWidth={2 / scale}
            dash={[10 / scale, 6 / scale]}
            listening={false}
          />
        )}

        <Transformer
          ref={trRef as React.RefObject<Konva.Transformer>}
          rotateEnabled
          enabledAnchors={[
            "top-left",
            "top-right",
            "bottom-left",
            "bottom-right",
            "middle-left",
            "middle-right",
            "top-center",
            "bottom-center",
          ]}
          boundBoxFunc={(oldBox, newBox) => (newBox.width < 8 || newBox.height < 8 ? oldBox : newBox)}
        />
      </Layer>
    </Stage>
  );
}
