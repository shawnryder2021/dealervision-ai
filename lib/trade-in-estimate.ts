/**
 * Transparent, deterministic trade-in ballpark estimator.
 *
 * This is intentionally a heuristic — NOT a KBB/Black Book valuation. It exists to
 * give a site visitor a plausible range and capture a lead. A paid valuation API can
 * be swapped in behind the same `estimateTradeIn()` signature later.
 */

export type VehicleCondition = "excellent" | "good" | "fair" | "poor";

export interface TradeInInput {
  year: number;
  make: string;
  model?: string;
  mileage: number;
  condition: VehicleCondition;
}

export interface TradeInEstimate {
  low: number;
  high: number;
  /** Midpoint for display. */
  mid: number;
  /** Human-readable assumptions, surfaced in the UI so the number is never a black box. */
  assumptions: string[];
}

// Rough "near-new" reference value by brand tier. Used only as a depreciation anchor.
const LUXURY = new Set([
  "bmw", "mercedes", "mercedes-benz", "audi", "lexus", "porsche", "jaguar",
  "land rover", "infiniti", "acura", "cadillac", "lincoln", "genesis", "volvo", "tesla",
]);
const TRUCK_SUV = new Set([
  "ford", "chevrolet", "chevy", "gmc", "ram", "dodge", "jeep", "toyota", "honda",
  "nissan", "subaru", "volkswagen", "vw",
]);
const ECONOMY = new Set([
  "kia", "hyundai", "mitsubishi", "fiat", "mini", "smart", "scion", "suzuki",
]);

function referenceValue(make: string): number {
  const m = make.trim().toLowerCase();
  if (LUXURY.has(m)) return 55000;
  if (TRUCK_SUV.has(m)) return 38000;
  if (ECONOMY.has(m)) return 22000;
  return 28000; // mainstream default
}

const CONDITION_MULTIPLIER: Record<VehicleCondition, number> = {
  excellent: 1.08,
  good: 1.0,
  fair: 0.88,
  poor: 0.72,
};

function roundTo(value: number, step: number): number {
  return Math.round(value / step) * step;
}

export function estimateTradeIn(input: TradeInInput): TradeInEstimate {
  const currentYear = new Date().getFullYear();
  const age = Math.max(0, currentYear - input.year);
  const ref = referenceValue(input.make);

  // Depreciation: ~20% in year one, then ~10% per year after.
  const depreciationFactor = age === 0 ? 1.0 : 0.8 * Math.pow(0.9, age - 1);
  let value = ref * depreciationFactor;

  // Mileage adjustment vs. an expected 12k/year.
  const expectedMileage = 12000 * age;
  const mileageDelta = (input.mileage ?? 0) - expectedMileage;
  // -3% per 10k over expected; +2% per 10k under expected (capped at ±20%).
  const mileagePct = mileageDelta >= 0
    ? -0.03 * (mileageDelta / 10000)
    : 0.02 * (-mileageDelta / 10000);
  const mileageAdj = Math.max(-0.2, Math.min(0.2, mileagePct));
  value *= 1 + mileageAdj;

  // Condition.
  value *= CONDITION_MULTIPLIER[input.condition] ?? 1.0;

  // Floor.
  value = Math.max(750, value);

  const low = roundTo(value * 0.9, 250);
  const high = roundTo(value * 1.08, 250);
  const mid = roundTo(value, 250);

  const assumptions = [
    `${input.year} ${input.make}${input.model ? " " + input.model : ""}`,
    `${(input.mileage ?? 0).toLocaleString()} miles`,
    `Condition: ${input.condition}`,
    "Ballpark only — final offer depends on inspection.",
  ];

  return { low, high, mid, assumptions };
}
