import type { Vehicle, Dealership } from "@/lib/types";
import type { CanvasElement, TextElement } from "./types";

const FORMATTERS: Record<string, (v: Vehicle | null, d: Dealership | null) => string> = {
  year: (v) => v?.year?.toString() ?? "",
  make: (v) => v?.make ?? "",
  model: (v) => v?.model ?? "",
  trim: (v) => v?.trim ?? "",
  ymm: (v) => v ? [v.year, v.make, v.model].filter(Boolean).join(" ") : "",
  ymmt: (v) => v ? [v.year, v.make, v.model, v.trim].filter(Boolean).join(" ") : "",
  price: (v) => (v?.price != null ? `$${Number(v.price).toLocaleString()}` : ""),
  price_raw: (v) => (v?.price != null ? Number(v.price).toLocaleString() : ""),
  mileage: (v) => (v?.mileage != null ? `${Number(v.mileage).toLocaleString()} mi` : ""),
  vin: (v) => v?.vin ?? "",
  stock_number: (v) => (v?.stock_number ? `#${v.stock_number}` : ""),
  dealer_name: (_v, d) => d?.name ?? "",
  phone: (_v, d) => d?.contact?.phone ?? "",
  website: (_v, d) => d?.contact?.website?.replace(/^https?:\/\//, "") ?? "",
  address: (_v, d) => d?.contact?.address ?? "",
  tagline: (_v, d) => d?.tagline ?? "",
};

export const MERGE_TAGS = Object.keys(FORMATTERS);

export const MERGE_TAG_LABELS: Record<string, string> = {
  year: "Year",
  make: "Make",
  model: "Model",
  trim: "Trim",
  ymm: "Year Make Model",
  ymmt: "Year Make Model Trim",
  price: "Price ($)",
  price_raw: "Price (no $)",
  mileage: "Mileage",
  vin: "VIN",
  stock_number: "Stock #",
  dealer_name: "Dealer Name",
  phone: "Phone",
  website: "Website",
  address: "Address",
  tagline: "Tagline",
};

export function applyMergeTagsToString(
  s: string,
  vehicle: Vehicle | null,
  dealership: Dealership | null
): string {
  return s.replace(/\{\{\s*([a-z_]+)\s*\}\}/gi, (_, tag: string) => {
    const fmt = FORMATTERS[tag.toLowerCase()];
    return fmt ? fmt(vehicle, dealership) : "";
  });
}

export function applyMergeTags(
  elements: CanvasElement[],
  vehicle: Vehicle | null,
  dealership: Dealership | null
): CanvasElement[] {
  return elements.map((el) => {
    if (el.type === "text") {
      const text = applyMergeTagsToString(el.text, vehicle, dealership);
      return { ...el, text } as TextElement;
    }
    return el;
  });
}
