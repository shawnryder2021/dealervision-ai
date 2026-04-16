/**
 * Web Scraping Engine
 * Fetches and parses dealer inventory pages using Cheerio
 */

import { load, CheerioAPI } from "cheerio";
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

/**
 * Fetch and parse a URL
 */
export async function scrapeUrl(
  url: string,
  options: ScrapeOptions = {}
): Promise<{ html: string; $: CheerioAPI } | null> {
  try {
    const {
      timeout = 10000,
      headers = {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      },
      followRedirects = true,
    } = options;

    const response = await fetch(url, {
      headers,
      timeout,
      redirect: followRedirects ? "follow" : "manual",
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch ${url}: ${response.statusText}`);
    }

    const html = await response.text();
    const $ = load(html);

    return { html, $ };
  } catch (error) {
    console.error(`Error scraping ${url}:`, error);
    return null;
  }
}

/**
 * Detect vehicle item containers in HTML
 * Looks for common patterns: divs with class like 'vehicle', 'listing', 'car-card', etc.
 */
export function detectVehicleItems(
  $: CheerioAPI
): { selector: string; items: any[]; count: number } | null {
  const commonSelectors = [
    ".vehicle-card",
    ".vehicle-listing",
    ".car-card",
    ".listing-item",
    "[data-vehicle]",
    ".inventory-item",
    ".vehicle-item",
    "article.vehicle",
    ".vehicle",
  ];

  for (const selector of commonSelectors) {
    const items = $(selector).toArray();
    if (items.length > 0) {
      return { selector, items, count: items.length };
    }
  }

  // Fallback: look for any divs with multiple vehicle-like attributes
  const divs = $("div")
    .filter((i, el) => {
      const text = $(el).text().toLowerCase();
      return (
        (text.includes("price") || text.includes("mileage")) &&
        (text.includes("make") || text.includes("model"))
      );
    })
    .toArray();

  if (divs.length > 0) {
    return { selector: "div", items: divs, count: divs.length };
  }

  return null;
}

/**
 * Extract text content with fallback selectors
 */
function extractText(
  $: CheerioAPI,
  element: any,
  selectors: string[]
): string | null {
  for (const selector of selectors) {
    const text = $(selector, element).text()?.trim();
    if (text) return text;
  }
  return null;
}

/**
 * Extract vehicle data from items using field mapping
 */
export function extractVehicles(
  $: CheerioAPI,
  items: any[],
  fieldMapping?: Record<string, string>
): ScrapedVehicle[] {
  const vehicles: ScrapedVehicle[] = [];

  items.forEach((item, index) => {
    try {
      const vehicle = extractVehicleFromItem($, item, fieldMapping, index);
      if (vehicle.make && vehicle.model) {
        vehicles.push(vehicle);
      }
    } catch (error) {
      console.error(`Error extracting vehicle ${index}:`, error);
    }
  });

  return vehicles;
}

/**
 * Extract single vehicle from item element
 */
function extractVehicleFromItem(
  $: CheerioAPI,
  element: any,
  fieldMapping?: Record<string, string>,
  index?: number
): ScrapedVehicle {
  const vehicle: ScrapedVehicle = { raw: {} };

  // If field mapping provided, use it
  if (fieldMapping) {
    const mappedData = extractByMapping($, element, fieldMapping);
    Object.assign(vehicle, mappedData);
    vehicle.raw = mappedData;
  } else {
    // Use heuristic extraction
    const heuristicData = extractByHeuristics($, element);
    Object.assign(vehicle, heuristicData);
    vehicle.raw = heuristicData;
  }

  // Extract photos
  const photoSelectors = [
    "img",
    "[data-image]",
    "picture img",
    ".photo img",
    ".image img",
  ];
  const photos: string[] = [];
  photoSelectors.forEach((selector) => {
    $(selector, element).each((i, el) => {
      const src = $(el).attr("src") || $(el).attr("data-src");
      if (src && src.startsWith("http")) {
        photos.push(src);
      }
    });
  });

  if (photos.length > 0) {
    vehicle.photos = photos;
  }

  // Default status
  if (!vehicle.status) {
    vehicle.status = "available";
  }

  return vehicle;
}

/**
 * Extract fields using provided mapping (CSS selectors)
 */
function extractByMapping(
  $: CheerioAPI,
  element: any,
  mapping: Record<string, string>
): Record<string, any> {
  const data: Record<string, any> = {};

  Object.entries(mapping).forEach(([field, selector]) => {
    const value = $(selector, element).text()?.trim();
    if (value) {
      data[field] = normalizeField(field, value);
    }
  });

  return data;
}

/**
 * Extract fields using heuristic patterns
 */
function extractByHeuristics(
  $: CheerioAPI,
  element: any
): Record<string, any> {
  const text = $(element).text();
  const html = $(element).html() || "";
  const data: Record<string, any> = {};

  // Extract year (4-digit numbers like 2020-2030)
  const yearMatch = text.match(/\b(19|20)\d{2}\b/);
  if (yearMatch) {
    data.year = parseInt(yearMatch[0]);
  }

  // Extract make (common manufacturer names)
  const makes = [
    "Toyota",
    "Honda",
    "Ford",
    "Chevrolet",
    "BMW",
    "Mercedes",
    "Audi",
    "Nissan",
    "Hyundai",
    "Kia",
    "Volkswagen",
    "Lexus",
    "Subaru",
    "Mazda",
    "Jeep",
    "Ram",
    "GMC",
    "Cadillac",
  ];
  for (const make of makes) {
    if (text.includes(make)) {
      data.make = make;
      break;
    }
  }

  // Extract model (next word or words after make)
  if (data.make) {
    const makeIndex = text.indexOf(data.make);
    const afterMake = text.substring(makeIndex + data.make.length).trim();
    const modelMatch = afterMake.match(/^([A-Za-z0-9\s]+?)(?:\s*\(|,|$)/);
    if (modelMatch) {
      data.model = modelMatch[1].trim();
    }
  }

  // Extract trim (usually in parentheses or after model)
  const trimMatch = text.match(/\(([A-Za-z0-9\s]+?)\)/);
  if (trimMatch) {
    data.trim = trimMatch[1].trim();
  }

  // Extract price ($X,XXX)
  const priceMatch = text.match(/\$[\s]*([\d,]+)/);
  if (priceMatch) {
    data.price = parseInt(priceMatch[1].replace(/,/g, ""));
  }

  // Extract mileage (X,XXX mi or miles)
  const mileageMatch = text.match(/([\d,]+)\s*(?:mi|miles)/i);
  if (mileageMatch) {
    data.mileage = parseInt(mileageMatch[1].replace(/,/g, ""));
  }

  // Extract VIN (17-character alphanumeric)
  const vinMatch = text.match(/\b([A-HJ-NPR-Z0-9]{17})\b/i);
  if (vinMatch) {
    data.vin = vinMatch[1].toUpperCase();
  }

  // Extract stock number (Stock #XXXXX or similar)
  const stockMatch = text.match(/Stock\s*#?(\w+)/i);
  if (stockMatch) {
    data.stock_number = stockMatch[1];
  }

  return data;
}

/**
 * Normalize extracted field values
 */
function normalizeField(field: string, value: string): any {
  const cleanValue = value.trim();

  switch (field) {
    case "year":
      const year = parseInt(cleanValue);
      return year >= 1900 && year <= 2100 ? year : null;

    case "price":
      const price = parseInt(cleanValue.replace(/[^\d]/g, ""));
      return price > 0 ? price : null;

    case "mileage":
      const mileage = parseInt(cleanValue.replace(/[^\d]/g, ""));
      return mileage >= 0 ? mileage : null;

    case "vin":
      return cleanValue.toUpperCase();

    case "status":
      const statuses = ["available", "sold", "coming_soon", "featured"];
      return statuses.includes(cleanValue.toLowerCase())
        ? cleanValue.toLowerCase()
        : "available";

    default:
      return cleanValue || null;
  }
}

/**
 * Normalize scraped vehicle to match Vehicle schema
 */
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

/**
 * Full scrape and extract flow
 */
export async function scrapeAndExtract(
  url: string,
  dealershipId: string,
  fieldMapping?: Record<string, string>,
  options?: ScrapeOptions
): Promise<{ vehicles: ScrapedVehicle[]; detectionInfo: any } | null> {
  // Fetch page
  const scrapeResult = await scrapeUrl(url, options);
  if (!scrapeResult) {
    return null;
  }

  const { $ } = scrapeResult;

  // Detect vehicle items
  const detection = detectVehicleItems($);
  if (!detection) {
    return null;
  }

  // Extract vehicles
  const vehicles = extractVehicles($, detection.items, fieldMapping);

  // Normalize to Vehicle schema
  const normalized = vehicles.map((v) => normalizeVehicle(v, dealershipId));

  return {
    vehicles: normalized as ScrapedVehicle[],
    detectionInfo: {
      selector: detection.selector,
      itemCount: detection.count,
      vehiclesExtracted: vehicles.length,
    },
  };
}
