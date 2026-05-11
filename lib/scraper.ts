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

// ─── Merge helper ────────────────────────────────────────────────────────────

/**
 * Merge partial vehicle records in priority order (later wins), but only
 * for values that are actually present — `undefined`, `null`, and empty
 * strings do NOT overwrite a defined value from a lower-priority source.
 * Empty `photos` arrays are also skipped so JSON-LD image lists aren't
 * wiped by a data-attr pass that didn't look at images.
 */
function mergeDefined(
  ...sources: Partial<ScrapedVehicle>[]
): ScrapedVehicle {
  const out: Record<string, any> = {};
  for (const src of sources) {
    if (!src) continue;
    for (const [key, value] of Object.entries(src)) {
      if (value === undefined || value === null) continue;
      if (typeof value === "string" && value.trim() === "") continue;
      if (Array.isArray(value) && value.length === 0) continue;
      out[key] = value;
    }
  }
  return out as ScrapedVehicle;
}

// ─── Core item extraction (merges all strategies) ────────────────────────────

function extractVehicleFromItem(
  $: CheerioAPI,
  item: any,
  jsonLdVehicles: ScrapedVehicle[],
  fieldMapping?: Record<string, string>
): ScrapedVehicle {
  // Strategy 1: Field mapping (explicit CSS selectors from user)
  const mappingData: Partial<ScrapedVehicle> = {};
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

  // Merge: heuristics (lowest) → data attrs → JSON-LD → explicit mapping (highest).
  // IMPORTANT: only non-empty values override lower-priority sources. Object
  // spread would let `model: undefined` from sparse JSON-LD clobber a real
  // `model: "Jetta"` from data-attrs.
  const merged: ScrapedVehicle = mergeDefined(
    heuristicData,
    dataAttrData,
    jsonLdData,
    mappingData
  );

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

// ─── Sitemap-based strategy (for JS-rendered sites like SM360, CDK, etc.) ────

const DEFAULT_HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
  "Accept-Language": "en-US,en;q=0.9",
};

/**
 * Read robots.txt to find the Sitemap: directive, then fall back to common paths.
 */
export async function findSitemapUrl(baseUrl: string): Promise<string | null> {
  const origin = new URL(baseUrl).origin;

  // 1. Check robots.txt
  try {
    const res = await fetch(`${origin}/robots.txt`, {
      headers: DEFAULT_HEADERS,
      signal: AbortSignal.timeout(8000),
    });
    if (res.ok) {
      const text = await res.text();
      const m = text.match(/^Sitemap:\s*(\S+)/im);
      if (m) return m[1].trim();
    }
  } catch { /* ignore */ }

  // 2. Common paths
  const candidates = [
    "/sitemap.xml",
    "/sitemap_index.xml",
    "/en/sitemap-xml",
    "/en/sitemap.xml",
    "/fr/sitemap-xml",
    "/sitemap/sitemap.xml",
  ];
  for (const path of candidates) {
    try {
      const url = `${origin}${path}`;
      const res = await fetch(url, {
        headers: DEFAULT_HEADERS,
        signal: AbortSignal.timeout(6000),
      });
      if (res.ok) {
        const text = await res.text();
        if (text.includes("<urlset") || text.includes("<sitemapindex")) return url;
      }
    } catch { /* ignore */ }
  }
  return null;
}

/**
 * Fetch a sitemap XML and return all vehicle detail page URLs.
 * Matches URLs that include a 4-digit year and a recognizable inventory path.
 */
export async function extractVehicleUrlsFromSitemap(
  sitemapUrl: string
): Promise<string[]> {
  const res = await fetch(sitemapUrl, {
    headers: DEFAULT_HEADERS,
    signal: AbortSignal.timeout(15000),
  });
  if (!res.ok) return [];
  const text = await res.text();

  const allLocs = [...text.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) =>
    m[1].trim()
  );

  // Handle sitemap index — recurse into child sitemaps
  if (text.includes("<sitemapindex")) {
    const child = allLocs.find(
      (u) => /inventory|vehicle|cars?|catalog/i.test(u)
    ) || allLocs[0];
    if (child && child !== sitemapUrl) {
      return extractVehicleUrlsFromSitemap(child);
    }
    return [];
  }

  // Filter to vehicle detail pages:
  // Must contain a 4-digit year AND match an inventory-like pattern
  return allLocs.filter((url) => {
    const path = new URL(url).pathname;
    const hasYear = /\/(19|20)\d{2}[-/]/.test(path);
    const hasInventory =
      /\/(used|new|certified|pre-owned|inventory|vehicles?|cars?|usados?)\//i.test(
        path
      );
    const hasId = /-id\d+/.test(path); // SM360 pattern
    return hasYear || (hasInventory && path.split("/").length >= 4) || hasId;
  });
}

/**
 * Extract year/make/model from a vehicle detail page URL slug.
 * Works for SM360 (/make/model/YYYY-make-model-idXXX) and generic patterns.
 */
function parseBasicFromUrl(url: string): Partial<ScrapedVehicle> {
  try {
    const segments = new URL(url).pathname
      .split("/")
      .filter(Boolean);
    const last = segments[segments.length - 1] || "";

    // Extract year from the start of the last segment
    const yearMatch = last.match(/^((?:19|20)\d{2})[-_]/);
    if (!yearMatch) return {};
    const year = parseInt(yearMatch[1]);

    // SM360 pattern: /make-slug/model-slug/YYYY-make-model-idXXX
    // Segments: [..., 'toyota', 'rav4', '2024-toyota-rav4-id38073033']
    const makeSeg = segments.length >= 3 ? segments[segments.length - 3] : "";
    const modelSeg = segments.length >= 2 ? segments[segments.length - 2] : "";

    const capitalize = (s: string) =>
      s
        .split("-")
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(" ");

    const make = makeSeg ? capitalize(makeSeg) : undefined;
    const model = modelSeg ? capitalize(modelSeg) : undefined;

    return { year, make, model };
  } catch {
    return {};
  }
}

/**
 * Fetch a single vehicle detail page and return its data via JSON-LD Car schema.
 * Falls back to heuristic extraction if JSON-LD is missing.
 */
async function fetchVehicleDetail(
  url: string
): Promise<ScrapedVehicle | null> {
  try {
    const res = await fetch(url, {
      headers: DEFAULT_HEADERS,
      signal: AbortSignal.timeout(12000),
    });
    if (!res.ok) return null;
    const html = await res.text();

    // Prefer @type Car in JSON-LD
    const ldBlocks = [
      ...html.matchAll(
        /<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi
      ),
    ].map((m) => m[1]);

    for (const block of ldBlocks) {
      try {
        const data = JSON.parse(block.trim());
        const type = data["@type"];
        if (type === "Car" || type === "Vehicle") {
          // Mileage: mileageFromOdometer.value (in KM or MI)
          const mileageVal = data.mileageFromOdometer?.value;
          const mileage = mileageVal ? parseInt(String(mileageVal)) : undefined;

          // Price from offers
          const priceStr = data.offers?.price;
          const price = priceStr
            ? parseFloat(String(priceStr).replace(/[^0-9.]/g, ""))
            : undefined;

          // Photos
          const photos: string[] = Array.isArray(data.image)
            ? data.image.filter((i: unknown) => typeof i === "string")
            : typeof data.image === "string"
            ? [data.image]
            : [];

          return {
            year:
              data.modelDate || data.vehicleModelDate
                ? parseInt(data.modelDate || data.vehicleModelDate)
                : parseYearFromName(data.name || ""),
            make: data.brand || data.manufacturer || undefined,
            model: data.model || data.name || undefined,
            trim: data.vehicleConfiguration || undefined,
            vin: data.vehicleIdentificationNumber || undefined,
            price: price || undefined,
            mileage: mileage || undefined,
            photos,
            status: "available",
          };
        }
      } catch { /* skip malformed */ }
    }

    // Fallback: heuristic on the detail page
    const $ = load(html);
    return extractByHeuristics($, $("body")) as ScrapedVehicle;
  } catch {
    return null;
  }
}

/**
 * Fetch vehicle detail pages in parallel batches, respecting a concurrency limit.
 */
async function batchFetchDetails(
  urls: string[],
  { concurrency = 8, delayMs = 200 }: { concurrency?: number; delayMs?: number } = {}
): Promise<ScrapedVehicle[]> {
  const results: ScrapedVehicle[] = [];

  for (let i = 0; i < urls.length; i += concurrency) {
    const batch = urls.slice(i, i + concurrency);
    const settled = await Promise.allSettled(batch.map(fetchVehicleDetail));
    for (const s of settled) {
      if (s.status === "fulfilled" && s.value) results.push(s.value);
    }
    if (i + concurrency < urls.length && delayMs > 0) {
      await new Promise((r) => setTimeout(r, delayMs));
    }
  }

  return results;
}

export interface SitemapScrapeOptions {
  /** If false (default for detect), only parse URL slugs — no per-vehicle HTTP requests. */
  fetchDetails?: boolean;
  /** Max vehicles to import when fetchDetails=true. Default: 200. */
  maxVehicles?: number;
}

/**
 * Sitemap-based scraping strategy for JS-rendered inventory sites.
 * 1. Find the sitemap via robots.txt or common paths.
 * 2. Extract vehicle detail page URLs from the sitemap.
 * 3a. (detect mode) Parse year/make/model from URL slugs — no per-page requests.
 * 3b. (import mode) Fetch each vehicle detail page for full data.
 */
export async function scrapeViaSitemap(
  url: string,
  dealershipId: string,
  opts: SitemapScrapeOptions = {}
): Promise<{ vehicles: ScrapedVehicle[]; detectionInfo: any } | null> {
  const { fetchDetails = false, maxVehicles = 200 } = opts;

  // 1. Find sitemap
  const sitemapUrl = await findSitemapUrl(url);
  if (!sitemapUrl) {
    console.log("scrapeViaSitemap: no sitemap found for", url);
    return null;
  }

  // 2. Extract vehicle URLs
  const vehicleUrls = await extractVehicleUrlsFromSitemap(sitemapUrl);
  if (vehicleUrls.length === 0) {
    console.log("scrapeViaSitemap: no vehicle URLs found in sitemap", sitemapUrl);
    return null;
  }

  const limited = vehicleUrls.slice(0, maxVehicles);

  let vehicles: ScrapedVehicle[];

  if (fetchDetails) {
    // 3b. Full import — fetch every detail page
    const rawVehicles = await batchFetchDetails(limited, { concurrency: 8, delayMs: 150 });
    // For any missing fields, fill in from the URL slug
    vehicles = rawVehicles.map((v, i) => {
      const fromUrl = parseBasicFromUrl(limited[i] || "");
      return {
        ...fromUrl,
        ...v, // detail page wins if it has the field
        status: "available" as const,
      };
    });
  } else {
    // 3a. Detect/preview — URL slug parsing only (instant)
    vehicles = limited.map((u) => ({
      ...parseBasicFromUrl(u),
      status: "available" as const,
    }));
  }

  // Require at least make or year
  const valid = vehicles.filter((v) => v.make || v.year);
  if (valid.length === 0) return null;

  const normalized = valid.map((v) => normalizeVehicle(v, dealershipId));

  return {
    vehicles: normalized as ScrapedVehicle[],
    detectionInfo: {
      selector: "sitemap",
      sitemapUrl,
      itemCount: vehicleUrls.length,
      vehiclesExtracted: valid.length,
      strategy: fetchDetails ? "sitemap+detail-pages" : "sitemap+url-slugs",
    },
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
