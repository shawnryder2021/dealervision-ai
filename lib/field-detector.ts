/**
 * Field Detection Engine
 * Analyzes scraped vehicles to suggest field mappings with confidence scores
 */

import { ScrapedVehicle } from "@/lib/scraper";

export interface DetectedField {
  field: string;
  confidence: number; // 0-1
  sample?: string;
  description: string;
}

export interface FieldMapping {
  [field: string]: string;
}

/**
 * Detect fields from sample vehicles
 * Analyzes raw data to infer field locations and suggest CSS selectors
 */
export function detectFields(
  vehicles: ScrapedVehicle[]
): {
  detectedFields: DetectedField[];
  suggestedMapping: FieldMapping;
  confidence: number; // Overall confidence 0-1
} {
  if (vehicles.length === 0) {
    return {
      detectedFields: [],
      suggestedMapping: {},
      confidence: 0,
    };
  }

  const detectedFields: DetectedField[] = [];
  const fieldScores: Record<string, number[]> = {};

  // Analyze each vehicle
  vehicles.forEach((vehicle) => {
    analyzeVehicle(vehicle, fieldScores);
  });

  // Calculate confidence for each field
  const fieldConfidences = Object.entries(fieldScores).map(
    ([field, scores]) => {
      const avgConfidence = scores.reduce((a, b) => a + b, 0) / scores.length;
      const sample =
        vehicles.find((v) => {
          const key = field.toLowerCase() as keyof ScrapedVehicle;
          return v[key];
        })?.[field.toLowerCase() as keyof ScrapedVehicle] || "";

      return {
        field,
        confidence: avgConfidence,
        sample: String(sample),
        description: getFieldDescription(field),
      };
    }
  );

  // Sort by confidence
  fieldConfidences.sort((a, b) => b.confidence - a.confidence);

  // Keep fields with confidence > 0.3
  const highConfidenceFields = fieldConfidences.filter(
    (f) => f.confidence > 0.3
  );
  detectedFields.push(...highConfidenceFields);

  // Suggest mapping (using field names as fallback selectors)
  const suggestedMapping: FieldMapping = {};
  highConfidenceFields.forEach((field) => {
    suggestedMapping[field.field.toLowerCase()] = `.${field.field.toLowerCase()}`;
  });

  // Calculate overall confidence
  const overallConfidence =
    highConfidenceFields.length > 0
      ? highConfidenceFields.reduce((sum, f) => sum + f.confidence, 0) /
        highConfidenceFields.length
      : 0;

  return {
    detectedFields: highConfidenceFields,
    suggestedMapping,
    confidence: overallConfidence,
  };
}

/**
 * Analyze a single vehicle for field patterns
 */
function analyzeVehicle(
  vehicle: ScrapedVehicle,
  fieldScores: Record<string, number[]>
): void {
  const patterns = {
    year: {
      check: (v: any) =>
        typeof v === "number" && v >= 1900 && v <= 2100,
      confidence: 0.9,
    },
    make: {
      check: (v: any) =>
        typeof v === "string" &&
        /^[A-Z][a-z]+$/.test(v) &&
        v.length > 1 &&
        v.length < 20,
      confidence: 0.85,
    },
    model: {
      check: (v: any) =>
        typeof v === "string" &&
        /^[A-Z0-9][a-zA-Z0-9\s-]*$/.test(v) &&
        v.length > 1,
      confidence: 0.8,
    },
    trim: {
      check: (v: any) =>
        typeof v === "string" &&
        /^[A-Z][a-zA-Z0-9\s]*$/.test(v) &&
        v.length > 2,
      confidence: 0.7,
    },
    price: {
      check: (v: any) =>
        typeof v === "number" && v > 1000 && v < 1000000,
      confidence: 0.95,
    },
    mileage: {
      check: (v: any) =>
        typeof v === "number" && v >= 0 && v < 1000000,
      confidence: 0.9,
    },
    vin: {
      check: (v: any) =>
        typeof v === "string" && /^[A-HJ-NPR-Z0-9]{17}$/i.test(v),
      confidence: 0.99,
    },
    stock_number: {
      check: (v: any) =>
        typeof v === "string" && /^[A-Z0-9]{2,}$/i.test(v),
      confidence: 0.75,
    },
  };

  Object.entries(patterns).forEach(([field, pattern]) => {
    const key = field as keyof ScrapedVehicle;
    const value = vehicle[key];

    if (value !== null && value !== undefined && pattern.check(value)) {
      if (!fieldScores[field]) {
        fieldScores[field] = [];
      }
      fieldScores[field].push(pattern.confidence);
    }
  });
}

/**
 * Get human-readable description for field
 */
function getFieldDescription(field: string): string {
  const descriptions: Record<string, string> = {
    year: "Model year (e.g., 2024)",
    make: "Vehicle manufacturer (e.g., Toyota, Ford)",
    model: "Vehicle model name (e.g., Camry, Mustang)",
    trim: "Trim level (e.g., LE, XLT)",
    price: "List price in dollars",
    mileage: "Odometer reading in miles",
    vin: "Vehicle Identification Number (17 characters)",
    stock_number: "Dealer stock/inventory number",
  };
  return descriptions[field] || field;
}

/**
 * Validate field mapping for completeness
 */
export function validateMapping(
  mapping: FieldMapping
): { valid: boolean; missingRequired: string[]; warnings: string[] } {
  const required = ["make", "model"];
  const recommended = ["price", "year"];

  const missingRequired = required.filter((f) => !mapping[f]);
  const warnings = recommended
    .filter((f) => !mapping[f])
    .map((f) => `Missing recommended field: ${f}`);

  return {
    valid: missingRequired.length === 0,
    missingRequired,
    warnings,
  };
}

/**
 * Merge detected fields with user overrides
 */
export function mergeDetectedWithOverrides(
  detected: FieldMapping,
  overrides?: FieldMapping
): FieldMapping {
  return {
    ...detected,
    ...overrides,
  };
}

/**
 * Create CSS selector suggestions for common field patterns
 */
export function suggestSelectors(fieldName: string): string[] {
  const suggestions: Record<string, string[]> = {
    year: [
      ".year",
      "[data-year]",
      ".vehicle-year",
      "span.year",
      ".model-year",
    ],
    make: [
      ".make",
      "[data-make]",
      ".vehicle-make",
      "span.make",
      ".manufacturer",
    ],
    model: [
      ".model",
      "[data-model]",
      ".vehicle-model",
      "span.model",
      ".model-name",
    ],
    trim: [
      ".trim",
      "[data-trim]",
      ".vehicle-trim",
      "span.trim",
      ".trim-level",
    ],
    price: [
      ".price",
      "[data-price]",
      ".vehicle-price",
      "span.price",
      ".listing-price",
    ],
    mileage: [
      ".mileage",
      "[data-mileage]",
      ".vehicle-mileage",
      "span.mileage",
      ".odometer",
    ],
    vin: [".vin", "[data-vin]", ".vehicle-vin", "span.vin", ".vin-number"],
    stock_number: [
      ".stock-number",
      "[data-stock]",
      ".stock",
      "span.stock-number",
      ".inventory-number",
    ],
  };

  return suggestions[fieldName.toLowerCase()] || [`.${fieldName}`];
}

/**
 * Score a mapping based on expected field extraction success
 */
export function scoreMappingQuality(
  mapping: FieldMapping,
  detectedConfidences: Record<string, number>
): {
  score: number;
  strengths: string[];
  weaknesses: string[];
} {
  const strengths: string[] = [];
  const weaknesses: string[] = [];

  Object.entries(mapping).forEach(([field, selector]) => {
    const confidence = detectedConfidences[field] || 0;
    if (confidence > 0.8) {
      strengths.push(`${field} has high confidence (${(confidence * 100).toFixed(0)}%)`);
    } else if (confidence < 0.5) {
      weaknesses.push(
        `${field} has low confidence (${(confidence * 100).toFixed(0)}%)`
      );
    }
  });

  const avgConfidence = Object.values(detectedConfidences).length
    ? Object.values(detectedConfidences).reduce((a, b) => a + b, 0) /
      Object.values(detectedConfidences).length
    : 0;

  return {
    score: avgConfidence,
    strengths,
    weaknesses,
  };
}
