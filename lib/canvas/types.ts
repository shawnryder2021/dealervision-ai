// Element descriptors for the Canva-style design studio.
// These are the source of truth — Konva nodes are derived from them.

export interface BaseElement {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number; // degrees
  opacity?: number; // 0..1
  locked?: boolean;
  visible?: boolean; // default true
  name?: string; // optional layer label
}

export interface TextElement extends BaseElement {
  type: "text";
  text: string;
  fontFamily: string;
  fontSize: number;
  fontStyle: "normal" | "bold" | "italic" | "bold italic";
  align: "left" | "center" | "right";
  fill: string;
  stroke?: string;
  strokeWidth?: number;
  shadow?: { color: string; blur: number; offsetX: number; offsetY: number; opacity: number };
  letterSpacing?: number;
  lineHeight?: number;
  uppercase?: boolean;
}

export interface ImageElement extends BaseElement {
  type: "image";
  src: string;
  cornerRadius?: number;
  filters?: {
    brightness?: number; // -1..1
    contrast?: number; // -100..100
    blur?: number; // 0..40
    grayscale?: boolean;
    invert?: boolean;
  };
}

export type ShapeKind = "rect" | "circle" | "star" | "ribbon" | "callout" | "line";

export interface ShapeElement extends BaseElement {
  type: "shape";
  shape: ShapeKind;
  fill: string;
  stroke?: string;
  strokeWidth?: number;
  cornerRadius?: number;
  numPoints?: number; // for star
  innerRadius?: number; // for star (fraction of outer)
}

export interface QrElement extends BaseElement {
  type: "qr";
  data: string;
  fill: string;
  bg: string;
}

export type CanvasElement = TextElement | ImageElement | ShapeElement | QrElement;

export interface Design {
  id?: string;
  name: string;
  kind: "template" | "draft";
  canvasSize: string; // matches CHANNEL_PRESETS id (or 'custom')
  canvasWidth: number;
  canvasHeight: number;
  vehicleId: string | null;
  elements: CanvasElement[];
  backgroundColor?: string;
  thumbnailUrl?: string | null;
  exportedUrl?: string | null;
}

export const FONT_FAMILIES = [
  "Inter",
  "Geist",
  "Bebas Neue",
  "Oswald",
  "Playfair Display",
  "Roboto",
  "Montserrat",
  "Helvetica",
  "Georgia",
  "Impact",
  "Arial Black",
  "Courier New",
];

export const CANVAS_SIZE_PRESETS: Array<{ id: string; label: string; width: number; height: number }> = [
  { id: "instagram-post", label: "Instagram Post (1:1)", width: 1080, height: 1080 },
  { id: "instagram-story", label: "Instagram Story (9:16)", width: 1080, height: 1920 },
  { id: "facebook-post", label: "Facebook Post (4:5)", width: 1080, height: 1350 },
  { id: "facebook-cover", label: "Facebook Cover (3:1)", width: 1200, height: 400 },
  { id: "twitter", label: "X / Twitter (16:9)", width: 1600, height: 900 },
  { id: "youtube-thumbnail", label: "YouTube Thumb (16:9)", width: 1280, height: 720 },
  { id: "google-business", label: "Google Business (1:1)", width: 1200, height: 1200 },
  { id: "website-hero", label: "Website Hero (21:9)", width: 2520, height: 1080 },
  { id: "email-header", label: "Email Header (3:1)", width: 1500, height: 500 },
  { id: "print-flyer", label: "Print Flyer (3:4 @4K)", width: 3000, height: 4000 },
  { id: "print-poster", label: "Print Poster (2:3 @4K)", width: 2667, height: 4000 },
  { id: "digital-billboard", label: "Digital Billboard (16:9 @4K)", width: 3840, height: 2160 },
];

export function newId(): string {
  return Math.random().toString(36).slice(2, 11);
}
