import type { CanvasElement } from "@/lib/canvas/types";

export interface CanvasTemplateRow {
  id: string;
  dealership_id: string;
  created_by: string | null;
  name: string;
  kind: "template" | "draft";
  thumbnail_url: string | null;
  exported_url: string | null;
  canvas_size: string;
  canvas_width: number;
  canvas_height: number;
  vehicle_id: string | null;
  elements: CanvasElement[];
  created_at: string;
  updated_at: string;
}

export type CanvasTemplateInput = Partial<
  Pick<
    CanvasTemplateRow,
    | "name"
    | "kind"
    | "thumbnail_url"
    | "exported_url"
    | "canvas_size"
    | "canvas_width"
    | "canvas_height"
    | "vehicle_id"
    | "elements"
  >
>;
