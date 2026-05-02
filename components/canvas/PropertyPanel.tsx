"use client";

import { useMemo } from "react";
import {
  AlignLeft,
  AlignCenter,
  AlignRight,
  Bold,
  Italic,
  ChevronUp,
  ChevronDown,
  Trash2,
  Copy,
  Lock,
  Unlock,
  Plus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { CanvasElement, ShapeElement, TextElement, ImageElement, QrElement } from "@/lib/canvas/types";
import { FONT_FAMILIES, newId } from "@/lib/canvas/types";
import { MERGE_TAGS, MERGE_TAG_LABELS } from "@/lib/canvas/merge-tags";
import type { Dealership } from "@/lib/types";

interface Props {
  selected: CanvasElement | null;
  dealership: Dealership | null;
  onChange: (patch: Partial<CanvasElement>) => void;
  onDelete: () => void;
  onDuplicate: () => void;
  onMoveLayer: (direction: "up" | "down") => void;
}

export function PropertyPanel({ selected, dealership, onChange, onDelete, onDuplicate, onMoveLayer }: Props) {
  const palette = useMemo(() => {
    const c = dealership?.brand_colors;
    return [c?.primary, c?.secondary, c?.accent, "#000000", "#ffffff", "#ef4444", "#22c55e", "#3b82f6"].filter(Boolean) as string[];
  }, [dealership]);

  if (!selected) {
    return (
      <div className="space-y-3">
        <p className="text-sm text-muted-foreground">Select an element to edit its properties.</p>
      </div>
    );
  }

  const isText = selected.type === "text";
  const isShape = selected.type === "shape";
  const isImage = selected.type === "image";
  const isQr = selected.type === "qr";

  const txt = selected as TextElement;
  const sh = selected as ShapeElement;
  const im = selected as ImageElement;
  const qr = selected as QrElement;

  return (
    <div className="space-y-4 text-sm">
      <div className="flex justify-between items-center">
        <span className="text-xs uppercase tracking-wider text-muted-foreground">{selected.type}</span>
        <div className="flex gap-1">
          <Button size="icon-xs" variant="ghost" onClick={() => onMoveLayer("up")} title="Bring forward">
            <ChevronUp className="h-3.5 w-3.5" />
          </Button>
          <Button size="icon-xs" variant="ghost" onClick={() => onMoveLayer("down")} title="Send backward">
            <ChevronDown className="h-3.5 w-3.5" />
          </Button>
          <Button size="icon-xs" variant="ghost" onClick={onDuplicate} title="Duplicate">
            <Copy className="h-3.5 w-3.5" />
          </Button>
          <Button size="icon-xs" variant="ghost" onClick={() => onChange({ locked: !selected.locked })} title="Lock">
            {selected.locked ? <Lock className="h-3.5 w-3.5" /> : <Unlock className="h-3.5 w-3.5" />}
          </Button>
          <Button size="icon-xs" variant="ghost" onClick={onDelete} title="Delete">
            <Trash2 className="h-3.5 w-3.5 text-destructive" />
          </Button>
        </div>
      </div>

      {isText && (
        <>
          <div>
            <Label>Text (use <code className="text-xs">{`{{tag}}`}</code> for vehicle merge)</Label>
            <Textarea
              rows={3}
              value={txt.text}
              onChange={(e) => onChange({ text: e.target.value })}
              className="mt-1 font-mono text-xs"
            />
            <details className="mt-1">
              <summary className="text-xs text-muted-foreground cursor-pointer flex items-center gap-1">
                <Plus className="h-3 w-3" /> Insert merge tag
              </summary>
              <div className="grid grid-cols-2 gap-1 mt-2">
                {MERGE_TAGS.map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    className="text-[11px] text-left px-1.5 py-0.5 hover:bg-muted rounded"
                    onClick={() => onChange({ text: txt.text + ` {{${tag}}}` })}
                  >
                    {MERGE_TAG_LABELS[tag]}
                  </button>
                ))}
              </div>
            </details>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label className="text-xs">Font</Label>
              <Select value={txt.fontFamily} onValueChange={(v) => onChange({ fontFamily: v ?? "Inter" })}>
                <SelectTrigger className="mt-1 h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {FONT_FAMILIES.map((f) => (
                    <SelectItem key={f} value={f}>
                      {f}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Size</Label>
              <Input
                type="number"
                value={txt.fontSize}
                onChange={(e) => onChange({ fontSize: Number(e.target.value) || 14 })}
                className="mt-1 h-8 text-xs"
              />
            </div>
          </div>

          <div className="flex gap-1">
            <Button
              size="icon-xs"
              variant={txt.fontStyle.includes("bold") ? "default" : "ghost"}
              onClick={() =>
                onChange({
                  fontStyle: (txt.fontStyle.includes("bold")
                    ? txt.fontStyle.replace(/bold ?/, "")
                    : `bold ${txt.fontStyle.replace("normal", "")}`).trim() as TextElement["fontStyle"] || "normal",
                })
              }
            >
              <Bold className="h-3.5 w-3.5" />
            </Button>
            <Button
              size="icon-xs"
              variant={txt.fontStyle.includes("italic") ? "default" : "ghost"}
              onClick={() =>
                onChange({
                  fontStyle: (txt.fontStyle.includes("italic")
                    ? txt.fontStyle.replace(/italic/, "")
                    : `${txt.fontStyle.replace("normal", "")} italic`).trim() as TextElement["fontStyle"] || "normal",
                })
              }
            >
              <Italic className="h-3.5 w-3.5" />
            </Button>
            <span className="w-px bg-border mx-1" />
            {(["left", "center", "right"] as const).map((a) => (
              <Button
                key={a}
                size="icon-xs"
                variant={txt.align === a ? "default" : "ghost"}
                onClick={() => onChange({ align: a })}
              >
                {a === "left" ? <AlignLeft className="h-3.5 w-3.5" /> : a === "center" ? <AlignCenter className="h-3.5 w-3.5" /> : <AlignRight className="h-3.5 w-3.5" />}
              </Button>
            ))}
          </div>

          <ColorRow label="Text color" palette={palette} value={txt.fill} onChange={(v) => onChange({ fill: v })} />

          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label className="text-xs">Letter spacing</Label>
              <Input
                type="number"
                value={txt.letterSpacing ?? 0}
                onChange={(e) => onChange({ letterSpacing: Number(e.target.value) || 0 })}
                className="mt-1 h-8 text-xs"
              />
            </div>
            <div>
              <Label className="text-xs">Line height</Label>
              <Input
                type="number"
                step="0.05"
                value={txt.lineHeight ?? 1.1}
                onChange={(e) => onChange({ lineHeight: Number(e.target.value) || 1.1 })}
                className="mt-1 h-8 text-xs"
              />
            </div>
          </div>
        </>
      )}

      {isShape && (
        <>
          <ColorRow label="Fill" palette={palette} value={sh.fill} onChange={(v) => onChange({ fill: v })} />
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label className="text-xs">Stroke</Label>
              <Input value={sh.stroke || ""} onChange={(e) => onChange({ stroke: e.target.value })} className="mt-1 h-8 text-xs" />
            </div>
            <div>
              <Label className="text-xs">Stroke width</Label>
              <Input
                type="number"
                value={sh.strokeWidth ?? 0}
                onChange={(e) => onChange({ strokeWidth: Number(e.target.value) || 0 })}
                className="mt-1 h-8 text-xs"
              />
            </div>
          </div>
          {sh.shape === "rect" && (
            <div>
              <Label className="text-xs">Corner radius</Label>
              <Input
                type="number"
                value={sh.cornerRadius ?? 0}
                onChange={(e) => onChange({ cornerRadius: Number(e.target.value) || 0 })}
                className="mt-1 h-8 text-xs"
              />
            </div>
          )}
        </>
      )}

      {isImage && (
        <>
          <div>
            <Label className="text-xs">Source URL</Label>
            <Input value={im.src} onChange={(e) => onChange({ src: e.target.value })} className="mt-1 h-8 text-xs font-mono" />
          </div>
          <div>
            <Label className="text-xs">Corner radius</Label>
            <Input
              type="number"
              value={im.cornerRadius ?? 0}
              onChange={(e) => onChange({ cornerRadius: Number(e.target.value) || 0 })}
              className="mt-1 h-8 text-xs"
            />
          </div>
        </>
      )}

      {isQr && (
        <>
          <div>
            <Label className="text-xs">Encoded URL</Label>
            <Input value={qr.data} onChange={(e) => onChange({ data: e.target.value })} className="mt-1 h-8 text-xs font-mono" />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label className="text-xs">Dark</Label>
              <Input value={qr.fill} onChange={(e) => onChange({ fill: e.target.value })} className="mt-1 h-8 text-xs" />
            </div>
            <div>
              <Label className="text-xs">Light</Label>
              <Input value={qr.bg} onChange={(e) => onChange({ bg: e.target.value })} className="mt-1 h-8 text-xs" />
            </div>
          </div>
        </>
      )}

      <div>
        <Label className="text-xs">Opacity</Label>
        <input
          type="range"
          min="0"
          max="1"
          step="0.05"
          value={selected.opacity ?? 1}
          onChange={(e) => onChange({ opacity: Number(e.target.value) })}
          className="w-full"
        />
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div>
          <Label className="text-xs">X</Label>
          <Input
            type="number"
            value={Math.round(selected.x)}
            onChange={(e) => onChange({ x: Number(e.target.value) || 0 })}
            className="mt-1 h-8 text-xs"
          />
        </div>
        <div>
          <Label className="text-xs">Y</Label>
          <Input
            type="number"
            value={Math.round(selected.y)}
            onChange={(e) => onChange({ y: Number(e.target.value) || 0 })}
            className="mt-1 h-8 text-xs"
          />
        </div>
        <div>
          <Label className="text-xs">W</Label>
          <Input
            type="number"
            value={Math.round(selected.width)}
            onChange={(e) => onChange({ width: Number(e.target.value) || 1 })}
            className="mt-1 h-8 text-xs"
          />
        </div>
        <div>
          <Label className="text-xs">H</Label>
          <Input
            type="number"
            value={Math.round(selected.height)}
            onChange={(e) => onChange({ height: Number(e.target.value) || 1 })}
            className="mt-1 h-8 text-xs"
          />
        </div>
        <div className="col-span-2">
          <Label className="text-xs">Rotation</Label>
          <Input
            type="number"
            value={Math.round(selected.rotation)}
            onChange={(e) => onChange({ rotation: Number(e.target.value) || 0 })}
            className="mt-1 h-8 text-xs"
          />
        </div>
      </div>
    </div>
  );
}

function ColorRow({
  label,
  palette,
  value,
  onChange,
}: {
  label: string;
  palette: string[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <Label className="text-xs">{label}</Label>
      <div className="flex items-center gap-1 mt-1">
        <input type="color" value={value} onChange={(e) => onChange(e.target.value)} className="h-8 w-10 rounded border bg-transparent" />
        <Input value={value} onChange={(e) => onChange(e.target.value)} className="flex-1 h-8 text-xs font-mono" />
      </div>
      <div className="flex gap-1 mt-1">
        {palette.map((c) => (
          <button
            key={c}
            type="button"
            onClick={() => onChange(c)}
            className="h-5 w-5 rounded border"
            style={{ background: c }}
            title={c}
          />
        ))}
      </div>
    </div>
  );
}
