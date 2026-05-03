"use client";

import { useState } from "react";
import {
  Eye,
  EyeOff,
  Lock,
  Unlock,
  Trash2,
  ChevronUp,
  ChevronDown,
  ChevronsUp,
  ChevronsDown,
  GripVertical,
  Type as TypeIcon,
  Image as ImageIcon,
  Square,
  Circle as CircleIcon,
  Star as StarIcon,
  QrCode,
  Pencil,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { CanvasElement } from "@/lib/canvas/types";

interface Props {
  elements: CanvasElement[];
  selectedIds: string[];
  onSelect: (id: string, additive?: boolean) => void;
  onChange: (next: CanvasElement[]) => void;
  onDelete: (id: string) => void;
}

function elementIcon(el: CanvasElement) {
  if (el.type === "text") return TypeIcon;
  if (el.type === "image") return ImageIcon;
  if (el.type === "qr") return QrCode;
  if (el.type === "shape") {
    const s = (el as { shape: string }).shape;
    if (s === "circle") return CircleIcon;
    if (s === "star") return StarIcon;
    return Square;
  }
  return Square;
}

function defaultLabel(el: CanvasElement, idx: number) {
  if (el.name) return el.name;
  if (el.type === "text") return (el as { text: string }).text.slice(0, 24) || `Text ${idx + 1}`;
  if (el.type === "image") return `Image ${idx + 1}`;
  if (el.type === "qr") return `QR ${idx + 1}`;
  if (el.type === "shape") return `${(el as { shape: string }).shape} ${idx + 1}`;
  return `Layer ${idx + 1}`;
}

export function LayerPanel({ elements, selectedIds, onSelect, onChange, onDelete }: Props) {
  const [renaming, setRenaming] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [overId, setOverId] = useState<string | null>(null);

  // Render top-most first (matches z-order intuition; last in array = top in canvas)
  const ordered = elements.slice().reverse();

  const moveTo = (id: string, position: "front" | "back" | "up" | "down") => {
    const idx = elements.findIndex((el) => el.id === id);
    if (idx < 0) return;
    const arr = [...elements];
    const [item] = arr.splice(idx, 1);
    if (position === "front") arr.push(item);
    else if (position === "back") arr.unshift(item);
    else if (position === "up") arr.splice(Math.min(idx + 1, arr.length), 0, item);
    else arr.splice(Math.max(idx - 1, 0), 0, item);
    onChange(arr);
  };

  const reorderOnDrop = (sourceId: string, targetId: string) => {
    if (sourceId === targetId) return;
    const arr = [...elements];
    const sIdx = arr.findIndex((el) => el.id === sourceId);
    const tIdx = arr.findIndex((el) => el.id === targetId);
    if (sIdx < 0 || tIdx < 0) return;
    const [item] = arr.splice(sIdx, 1);
    const newTIdx = arr.findIndex((el) => el.id === targetId);
    arr.splice(newTIdx + (sIdx < tIdx ? 1 : 0), 0, item);
    onChange(arr);
  };

  const updateOne = (id: string, patch: Partial<CanvasElement>) => {
    onChange(elements.map((el) => (el.id === id ? ({ ...el, ...patch } as CanvasElement) : el)));
  };

  return (
    <div className="space-y-1">
      {ordered.length === 0 && (
        <p className="text-xs text-muted-foreground italic">No layers yet.</p>
      )}
      {ordered.map((el, idx) => {
        const Icon = elementIcon(el);
        const reverseIdx = elements.length - 1 - idx; // index in original array
        const isSelected = selectedIds.includes(el.id);
        const isHidden = el.visible === false;
        const isLocked = el.locked === true;
        const dragOver = overId === el.id && draggingId !== el.id;

        return (
          <div
            key={el.id}
            draggable
            onDragStart={() => setDraggingId(el.id)}
            onDragEnd={() => {
              setDraggingId(null);
              setOverId(null);
            }}
            onDragOver={(e) => {
              e.preventDefault();
              setOverId(el.id);
            }}
            onDrop={(e) => {
              e.preventDefault();
              if (draggingId) reorderOnDrop(draggingId, el.id);
              setOverId(null);
            }}
            className={cn(
              "group flex items-center gap-1 px-1.5 py-1 rounded text-xs border border-transparent",
              isSelected ? "bg-primary/10 text-primary" : "hover:bg-muted",
              dragOver && "border-primary",
              isHidden && "opacity-50"
            )}
          >
            <GripVertical className="h-3 w-3 text-muted-foreground/50 cursor-grab active:cursor-grabbing shrink-0" />
            <Icon className="h-3 w-3 shrink-0" />
            {renaming === el.id ? (
              <input
                autoFocus
                value={renameValue}
                onChange={(e) => setRenameValue(e.target.value)}
                onBlur={() => {
                  updateOne(el.id, { name: renameValue.trim() || undefined });
                  setRenaming(null);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    updateOne(el.id, { name: renameValue.trim() || undefined });
                    setRenaming(null);
                  }
                  if (e.key === "Escape") setRenaming(null);
                }}
                className="flex-1 min-w-0 bg-background border rounded px-1 text-xs"
              />
            ) : (
              <button
                className="flex-1 min-w-0 text-left truncate"
                onClick={(e) => onSelect(el.id, e.shiftKey)}
                onDoubleClick={() => {
                  setRenameValue(el.name || "");
                  setRenaming(el.id);
                }}
                title="Click to select · Shift+click to add to selection · Double-click to rename"
              >
                {defaultLabel(el, reverseIdx)}
              </button>
            )}

            <div className="flex items-center opacity-50 group-hover:opacity-100 transition-opacity">
              <button
                className="p-0.5 hover:text-primary"
                onClick={() => moveTo(el.id, "front")}
                title="Bring to front"
              >
                <ChevronsUp className="h-3 w-3" />
              </button>
              <button className="p-0.5 hover:text-primary" onClick={() => moveTo(el.id, "up")} title="Bring forward">
                <ChevronUp className="h-3 w-3" />
              </button>
              <button className="p-0.5 hover:text-primary" onClick={() => moveTo(el.id, "down")} title="Send backward">
                <ChevronDown className="h-3 w-3" />
              </button>
              <button
                className="p-0.5 hover:text-primary"
                onClick={() => moveTo(el.id, "back")}
                title="Send to back"
              >
                <ChevronsDown className="h-3 w-3" />
              </button>
              <button
                className="p-0.5 hover:text-primary"
                onClick={() => updateOne(el.id, { visible: isHidden ? true : false })}
                title={isHidden ? "Show" : "Hide"}
              >
                {isHidden ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
              </button>
              <button
                className="p-0.5 hover:text-primary"
                onClick={() => updateOne(el.id, { locked: !isLocked })}
                title={isLocked ? "Unlock" : "Lock"}
              >
                {isLocked ? <Lock className="h-3 w-3" /> : <Unlock className="h-3 w-3" />}
              </button>
              <button
                className="p-0.5 hover:text-primary"
                onClick={() => {
                  setRenameValue(el.name || "");
                  setRenaming(el.id);
                }}
                title="Rename"
              >
                <Pencil className="h-3 w-3" />
              </button>
              <button
                className="p-0.5 hover:text-destructive"
                onClick={() => onDelete(el.id)}
                title="Delete"
              >
                <Trash2 className="h-3 w-3" />
              </button>
            </div>
          </div>
        );
      })}
      <p className="text-[10px] text-muted-foreground/70 mt-2 px-1">
        Drag to reorder · Top of list = front of canvas
      </p>
    </div>
  );
}
