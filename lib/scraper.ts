/**
 * Web Scraping Engine
 * Multi-strategy extraction: JSON-LD → Data Attributes → CSS/Heuristic fallback
 * Supports a wide range of dealer website layouts (Dealer.com, DealerSocket, custom, etc.)
 */

import { load } from "cheerio";
type CheerioAPI = ReturnType<typeof load>;
import { Vehicle } from "@/lib/types";

export interface ScrapedVehicle {
  year?: number;
  make?: string;
  model?: string;
  trim?: string;
  price?: number;
  mileage?: number;
  vin?: string;
  stock_number?: string;
  status?: Vehicle["status"];
  photos?: string[];
  raw?: Record<string, any>;
}

export interface ScrapeOptions {
  timeout?: number;
  headers?: Record<string, string>;
  followRedirects?: boolean;
}

// ─── Expanded container selectors ────────────────────────────────────────────
const CONTAINER_SELECTORS = [
  "li.carBoxWrapper",         // Dealer.com / D2CMedia (e.g. brownsvw.ca)
  "li[data-carid]",           // Dealer.com variant
  ".vehicle-card",
  ".vehicle-listing",
  ".car-card",
  ".listing-item",
  "[data-vehicle]",
  "[data-vehicle-id]",
  ".inventory-item",
  ".vehicle-item",
  "article.vehicle",
  ".srp-list-item",
  ".search-result-item",
  ".result-item",
  ".listing-card",
  ".car-listing",
  ".stock-item",
  ".InventoryItem",
  ".VehicleCard",
  ".inventory-listing",
  ".used-vehicle",
  ".new-vehicle",
];

// ─── Expanded make list (40+) ─────────────────────────────────────────────────
const KNOWN_MAKES = [
  "Acura", "Alfa Romeo", "Aston Martin", "Audi",
  "Bentley", "BMW", "Buick",
  "Cadillac", "Chevrolet", "Chrysler",
  "Dodge",
  "Ferrari", "Fiat", "Ford",
  "Genesis", "GMC",
  "Honda", "Hummer", "Hyundai",
  "Infiniti", "Isuzu",
  "Jaguar", "Jeep",
  "Kia",
  "Lamborghini", "Land Rover", "Lexus", "Lincoln",
  "Maserati", "Mazda", "McLaren", "Mercedes", "Mercedes-Benz", "Mini", "Mitsubishi",
  "Nissan",
  "Oldsmobile",
  "Pontiac", "Porsche",
  "Ram",
  "Rolls-Royce",
  "Saturn", "Scion", "Smart", "Subaru", "Suzuki",
  "Tesla", "Toyota",
  "Volkswagen", "Volvo",
];

// ─── JSON-LD extraction ───────────────────────────────────────────────────────

function parseYearFromName(name: string): number | undefined {
  const m = name?.match(/\b(19|20)\d{2}\b/);
  return m ? parseInt(m[0]) : undefined;
}

/**
 * Parse all JSON-LD blocks from raw HTML, returning scraped vehicle data.
 * Handles @type Vehicle and @type Product (with offers).
 */
export function extractFromJsonLd(html: string): ScrapedVehicle[] {
  const vehicles: ScrapedVehicle[] = [];
  const regex = /<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  let match;
  while ((match = regex.exec(html)) !== null) {
    try {
      const data = JSON.parse(match[1]);
      const items: any[] = Array.isArray(data) ? data : [data];
      for (const item of items) {
        const type = item["@type"];
        const isVehicle = type === "Vehicle";
        const isProduct = type === "Product" && item.offers;
        if (!isVehicle && !isProduct) continue;

        // Parse photos
        let photos: string[] = [];
        if (Array.isArray(item.image)) {
          photos = item.image.filter((u: any) => typeof u === "string");
        } else if (typeof item.image === "string") {
          photos = [item.image];
        }

        vehicles.push({
          make: item.brand?.name || item.manufacturer || undefined,
          model: item.model || undefined,
          year: item.modelDate
            ? parseInt(item.modelDate)
            : parseYearFromName(item.name || ""),
          vin: item.vehicleIdentificationNumber || undefined,
          price: item.offers?.price
            ? parseFloat(String(item.offers.price).replace(/[^0-9.]/g, ""))
            : undefined,
          photos,
          status: "available",
          raw: item,
        });
      }
    } catch {
      // Silently skip malformed JSON-LD
    }
  }
  return vehicles;
}

// ─── Data-attribute extraction ────────────────────────────────────────────────

/**
 * Extract vehicle data from common data-* attribute patterns used by
 * Dealer.com, DealerSocket, and similar CMS platforms.
 */
function extractFromDataAttributes(
  $: CheerioAPI,
  item: any
): Partial<ScrapedVehicle> {
  // Pattern 1: <input name="vehicledata" data-make="..." ...>
  const input = $('input[name="vehicledata"]', item).first();
  if (input.length) {
    const yearStr = input.attr("data-year") || "";
    return {
      make: input.attr("data-make") || undefined,
      model: input.attr("data-model") || undefined,
      year: parseInt(yearStr) || undefined,
      trim: input.attr("data-trim") || undefined,
      vin: input.attr("data-vin") || undefined,
      stock_number: input.attr("data-stock-number") || input.attr("data-stock") || undefined,
    };
  }

  // Pattern 2: Any element with data-make directly on it or a child
  const el = $("[data-make]", item).first();
  if (el.length) {
    const yearStr = el.attr("data-year") || "";
    return {
      make: el.attr("data-make") || undefined,
      model: el.attr("data-model") || undefined,
      year: parseInt(yearStr) || undefined,
      vin: el.attr("data-vin") || undefined,
      stock_number:
        el.attr("data-nostock") ||
        el.attr("data-stock-number") ||
        el.attr("data-stock") ||
        undefined,
    };
  }

  return {};
}

// ─── Photo extraction ─────────────────────────────────────────────────────────

function extractPhotos($: CheerioAPI, item: any): string[] {
  const seen = new Set<string>();
  const photos: string[] = [];

  // Check img tags — look for src, data-src, data-imgsrc, data-lazy, data-original
  $("img", item).each((_: number, el: any) => {
    const attrs = ["src", "data-src", "data-imgsrc", "data-lazy", "data-original"];
    for (const attr of attrs) {
      const url = $(el).attr(attr);
      if (url && url.startsWith("http") && !seen.has(url)) {
        seen.add(url);
        photos.push(url);
        break; // Only add one URL per img (prefer earliest attr)
      }
    }
  });

  return photos;
}

// ─── Heuristic extraction ─────────────────────────────────────────────────────

/**
 * Extract vehicle fields from element text using known CSS classes and regex patterns.
 * This is the fallback strategy when JSON-LD and data attributes yield nothing.
 */
function extractByHeuristics($: CheerioAPI, item: any): Partial<ScrapedVehicle> {
  const data: Partial<ScrapedVehicle> = {};

  // ── Known CSS class patterns (covers Dealer.com, AutoTrader, Cars.com etc.) ──
  const makeEl = $(".divMake, .vehicle-make, .make, [class*='make']", item).first();
  if (makeEl.length) data.make = makeEl.text().trim() || undefined;

  // Year + Model often combined: "2016 Jetta" → split on first space
  const ymEl = $(".divModelYear, .vehicle-year-model, .year-model", item).first();
  if (ymEl.length) {
    const ymText = ymEl.text().trim();
    const parts = ymText.match(/^(\d{4})\s+(.+)$/);
    if (parts) {
      data.year = parseInt(parts[1]);
      data.model = parts[2].trim();
    }
  }

  // Standalone year
  if (!data.year) {
    const yearEl = $(".year, .vehicle-year, .divYear, [class*='year']", item).first();
    if (yearEl.length) {
      const y = parseInt(yearEl.text().trim());
      if (y >= 1900 && y <= 2100) data.year = y;
    }
  }

  // Standalone model
  if (!data.model) {
    const modelEl = $(".model, .vehicle-model, .divModel, [class*='model']", item).first();
    if (modelEl.length) data.model = modelEl.text().trim() || undefined;
  }

  // Trim
  const trimEl = $(".trim, .vehicle-trim, .divTrim, [class*='trim']", item).first();
  if (trimEl.length) data.trim = trimEl.text().trim() || undefined;

  // Price: try class first, then regex
  const priceEl = $(
    ".price, .vehicle-price, .carPrice, .dollarsigned, [class*='price']",
    item
  ).first();
  if (priceEl.length) {
    const priceText = priceEl.text().replace(/[^0-9]/g, "");
    if (priceText) data.price = parseInt(priceText) || undefined;
  }

  // Mileage: handle km/KM as well as mi/miles
  const kmEl = $(".s-km, .mileage, .vehicle-mileage, [class*='km'], [class*='mileage']", item).first();
  if (kmEl.length) {
    const kmText = kmEl.text().replace(/[^0-9]/g, "");
    if (kmText) data.mileage = parseInt(kmText) || undefined;
  }

  // ── Fallback: raw text regex ──────────────────────────────────────────────
  const text = $(item).text();

  if (!data.year) {
    const m = text.match(/\b(19|20)\d{2}\b/);
    if (m) data.year = parseInt(m[0]);
  }

  if (!data.make) {
    for (const make of KNOWN_MAKES) {
      if (text.includes(make)) {
        data.make = make;
        break;
      }
    }
  }

  if (!data.model && data.make) {
    const idx = text.indexOf(data.make);
    if (idx !== -1) {
      const after = text.substring(idx + data.make.length).trim();
      const m = after.match(/^([A-Za-z0-9][A-Za-z0-9\s\-]*?)(?:\s*[,(]|$)/);
      if (m) data.model = m[1].trim() || undefined;
    }
  }

  if (!data.price) {
    const m = text.match(/\$\s*([\d,]+)/);
    if (m) data.price = parseInt(m[1].replace(/,/g, "")) || undefined;
  }

  if (!data.mileage) {
    const m = text.match(/([\d,]+)\s*(?:km|kms|KM|mi|miles)/i);
    if (m) data.mileage = parseInt(m[1].replace(/,/g, "")) || undefined;
  }

  if (!data.vin) {
    const m = text.match(/\b([A-HJ-NPR-Z0-9]{17})\b/i);
    if (m) data.vin = m[1].toUpperCase();
  }

  if (!data.stock_number) {
    const m = text.match(/Stock\s*[:#]?\s*([A-Z0-9]+)/i);
    if (m) data.stock_number = m[1];
  }

  return data;
}

// ─── Match JSON-LD vehicle to a page item ────────────────────────────────────

function findJsonLdMatch(
  $: CheerioAPI,
  item: any,
  jsonLdVehicles: ScrapedVehicle[]
): ScrapedVehicle | undefined {
  if (jsonLdVehicles.length === 0) return undefined;

  // Try to match by VIN first (most reliable)
  const itemText = $(item).text();
  const vinMatch = itemText.match(/\b([A-HJ-NPR-Z0-9]{17})\b/i);
  if (vinMatch) {
    const vin = vinMatch[1].toUpperCase();
    const found = jsonLdVehicles.find(
      (v) => v.vin?.toUpperCase() === vin
    );
    if (found) return found;
  }

  // Try data-vin attribute
  const dataVin = $("[data-vin]", item).first().attr("data-vin");
  if (dataVin) {
    const found = jsonLdVehicles.find(
      (v) => v.vin?.toUpperCase() === dataVin.toUpperCase()
    );
    if (found) return found;
  }

  return undefined;
}

// ─── Core item extraction (merges all strategies) ────────────────────────────

function extractVehicleFromItem(
  $: CheerioAPI,
  item: any,
  jsonLdVehicles: ScrapedVehicle[],
  fieldMapping?: Record<string, string>
): ScrapedVehicle {
  // Strategy 1: Field mapping (explicit CSS selectors from user)
  let mappingData: Partial<ScrapedVehicle> = {};
  if (fieldMapping && Object.keys(fieldMapping).length > 0) {
    for (const [field, selector] of Object.entries(fieldMapping)) {
      const val = $(selector, item).first().text().trim();
      if (val) {
        (mappingData as any)[field] = val;
      }
    }
  }

  // Strategy 2: JSON-LD match
  const jsonLdData = findJsonLdMatch($, item, jsonLdVehicles) || {};

  // Strategy 3: Data attributes
  const dataAttrData = extractFromDataAttributes($, item);

  // Strategy 4: CSS class + regex heuristics (fallback)
  const heuristicData = extractByHeuristics($, item);

  // Merge: heuristics (lowest) → data attrs → JSON-LD → explicit mapping (highest)
  const merged: ScrapedVehicle = {
    ...heuristicData,
    ...dataAttrData,
    ...jsonLdData,
    ...mappingData,
  };

  // Photos: combine from all sources, deduplicated
  const allPhotos = new Set<string>([
    ...(jsonLdData.photos || []),
    ...extractPhotos($, item),
  ]);
  merged.photos = Array.from(allPhotos);

  // Default status
  if (!merged.status) merged.status = "available";

  // Keep raw for debugging
  merged.raw = {
    heuristic: heuristicData,
    dataAttr: dataAttrData,
    jsonLd: jsonLdData,
  };

  return merged;
}

// ─── Container detection ──────────────────────────────────────────────────────

export function detectVehicleItems(
  $: CheerioAPI
): { selector: string; items: any[]; count: number } | null {
  // Try all known container selectors
  for (const selector of CONTAINER_SELECTORS) {
    const items = $(selector).toArray();
    if (items.length >= 1) {
      return { selector, items, count: items.length };
    }
  }

  // Broad fallback: find divs/lis containing both price and vehicle name indicators
  const candidates = $("li, div, article")
    .filter((_: number, el: any) => {
      const text = $(el).text().toLowerCase();
      const hasPriceOrMileage =
        text.includes("$") || /\d+\s*(km|mi|miles)/i.test(text);
      const hasVehicleIndicator =
        KNOWN_MAKES.some((m) => text.includes(m.toLowerCase())) ||
        /\b(19|20)\d{2}\b/.test(text);
      return hasPriceOrMileage && hasVehicleIndicator;
    })
    .toArray();

  if (candidates.length > 0) {
    // Prefer the smallest elements (most specific containers)
    const sorted = candidates.sort(
      (a, b) => $(a).text().length - $(b).text().length
    );
    return { selector: "auto-detected", items: sorted.slice(0, 50), count: sorted.length };
  }

  return null;
}

// ─── Extract vehicles from detected items ────────────────────────────────────

export function extractVehicles(
  $: CheerioAPI,
  html: string,
  items: any[],
  fieldMapping?: Record<string, string>
): ScrapedVehicle[] {
  // Pre-extract all JSON-LD once for the entire page
  const jsonLdVehicles = extractFromJsonLd(html);

  const vehicles: ScrapedVehicle[] = [];

  items.forEach((item, index) => {
    try {
      const vehicle = extractVehicleFromItem($, item, jsonLdVehicles, fieldMapping);

      // Require at least a make OR a VIN to be worth importing
      if (vehicle.make || vehicle.vin) {
        vehicles.push(vehicle);
      }
    } catch (err) {
      console.error(`Error extracting vehicle at index ${index}:`, err);
    }
  });

  // If items yielded nothing but JSON-LD has vehicles, fall back to JSON-LD only
  if (vehicles.length === 0 && jsonLdVehicles.length > 0) {
    return jsonLdVehicles.filter((v) => v.make || v.vin);
  }

  return vehicles;
}

// ─── Normalize to Vehicle schema ─────────────────────────────────────────────

export function normalizeVehicle(
  raw: ScrapedVehicle,
  dealershipId: string
): Partial<Vehicle> {
  return {
    dealership_id: dealershipId,
    year: raw.year || null,
    make: raw.make || "",
    model: raw.model || "",
    trim: raw.trim || null,
    price: raw.price || null,
    mileage: raw.mileage || null,
    vin: raw.vin || null,
    stock_number: raw.stock_number || null,
    status: (raw.status as Vehicle["status"]) || "available",
    photos: raw.photos || [],
    tags: [],
    details: raw.raw || {},
  };
}

// ─── Public API ───────────────────────────────────────────────────────────────

export async function scrapeUrl(
  url: string,
  options: ScrapeOptions = {}
): Promise<{ html: string; $: CheerioAPI } | null> {
  const {
    timeout = 15000,
    headers = {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      "Accept-Language": "en-US,en;q=0.9",
    },
    followRedirects = true,
  } = options;

  const controller = new AbortController();
  let timeoutId: ReturnType<typeof setTimeout> | undefined;
  if (timeout > 0) {
    timeoutId = setTimeout(() => controller.abort(), timeout);
  }

  try {
    let response: Response;
    try {
      response = await fetch(url, {
        headers,
        redirect: followRedirects ? "follow" : "manual",
        signal: controller.signal,
      });
    } finally {
      if (timeoutId) clearTimeout(timeoutId);
    }

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const html = await response.text();
    const $ = load(html);
    return { html, $ };
  } catch (error) {
    console.error(`Error scraping ${url}:`, error);
    return null;
  }
}

export async function scrapeAndExtract(
  url: string,
  dealershipId: string,
  fieldMapping?: Record<string, string>,
  options?: ScrapeOptions
): Promise<{ vehicles: ScrapedVehicle[]; detectionInfo: any } | null> {
  const scrapeResult = await scrapeUrl(url, options);
  if (!scrapeResult) return null;

  const { html, $ } = scrapeResult;

  // Try container detection
  const detection = detectVehicleItems($);

  let vehicles: ScrapedVehicle[];
  let detectionInfo: any;

  if (detection) {
    vehicles = extractVehicles($, html, detection.items, fieldMapping);
    detectionInfo = {
      selector: detection.selector,
      itemCount: detection.count,
      vehiclesExtracted: vehicles.length,
      strategy: "container+multi",
    };
  } else {
    // No containers found — try pure JSON-LD fallback
    vehicles = extractFromJsonLd(html).filter((v) => v.make || v.vin);
    detectionInfo = {
      selector: "json-ld-only",
      itemCount: vehicles.length,
      vehiclesExtracted: vehicles.length,
      strategy: "json-ld-fallback",
    };
  }

  if (vehicles.length === 0) return null;

  // Normalize to Vehicle schema
  const normalized = vehicles.map((v) => normalizeVehicle(v, dealershipId));

  return {
    vehicles: normalized as ScrapedVehicle[],
    detectionInfo,
  };
}
