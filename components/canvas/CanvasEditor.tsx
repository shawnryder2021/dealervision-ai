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
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  onChange: (next: CanvasElement[]) => void;
  vehicle: Vehicle | null;
  dealership: Dealership | null;
  stageRef: React.MutableRefObject<Konva.Stage | null>;
  scale: number;
  backgroundColor?: string;
}

type CommonHandlers = {
  draggable: boolean;
  onMouseDown: (e: Konva.KonvaEventObject<MouseEvent>) => void;
  onTouchStart: (e: Konva.KonvaEventObject<TouchEvent>) => void;
  onDragEnd: (e: Konva.KonvaEventObject<DragEvent>) => void;
  onTransformEnd: (e: Konva.KonvaEventObject<Event>) => void;
};

function buildHandlers(
  el: CanvasElement,
  onSelect: (id: string) => void,
  updateEl: (id: string, patch: Partial<CanvasElement>) => void
): CommonHandlers {
  return {
    draggable: !el.locked,
    onMouseDown: (e) => {
      e.cancelBubble = true;
      onSelect(el.id);
    },
    onTouchStart: (e) => {
      e.cancelBubble = true;
      onSelect(el.id);
    },
    onDragEnd: (e) => {
      updateEl(el.id, { x: e.target.x(), y: e.target.y() });
    },
    onTransformEnd: (e) => {
      const node = e.target;
      const sx = node.scaleX();
      const sy = node.scaleY();
      node.scaleX(1);
      node.scaleY(1);
      updateEl(el.id, {
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

export default function CanvasEditor({
  width,
  height,
  elements,
  selectedId,
  onSelect,
  onChange,
  vehicle,
  dealership,
  stageRef,
  scale,
  backgroundColor = "#ffffff",
}: Props) {
  const layerRef = useRef<Konva.Layer | null>(null);
  const trRef = useRef<Konva.Transformer | null>(null);

  const merged = useMemo(() => applyMergeTags(elements, vehicle, dealership), [elements, vehicle, dealership]);

  useEffect(() => {
    const tr = trRef.current;
    const layer = layerRef.current;
    if (!tr || !layer) return;
    if (!selectedId) {
      tr.nodes([]);
      tr.getLayer()?.batchDraw();
      return;
    }
    const node = layer.findOne(`#${selectedId}`);
    if (node) {
      tr.nodes([node]);
      tr.getLayer()?.batchDraw();
    }
  }, [selectedId, merged]);

  const handleStageMouseDown = (e: Konva.KonvaEventObject<MouseEvent>) => {
    if (e.target === e.target.getStage()) onSelect(null);
  };

  const updateEl = (id: string, patch: Partial<CanvasElement>) => {
    onChange(elements.map((el) => (el.id === id ? ({ ...el, ...patch } as CanvasElement) : el)));
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
        {merged.map((el) => {
          const handlers = buildHandlers(el, onSelect, updateEl);
          if (el.type === "image") return <ImageNode key={el.id} el={el} handlers={handlers} />;
          if (el.type === "shape") return <ShapeNode key={el.id} el={el} handlers={handlers} />;
          if (el.type === "qr") return <QrNode key={el.id} el={el} handlers={handlers} />;
          return <TextNode key={el.id} el={el} handlers={handlers} />;
        })}
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
