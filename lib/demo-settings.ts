/**
 * Demo Settings Persistence
 * Saves and loads dealership settings to/from localStorage so changes
 * survive page reloads while running in demo mode.
 */

import type { Dealership } from "./types";

const STORAGE_KEY = "dealeradgen_demo_settings";

export function saveDemoSettings(dealership: Dealership): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(dealership));
  } catch {
    // Ignore storage errors
  }
}

export function loadDemoSettings(): Dealership | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Dealership) : null;
  } catch {
    return null;
  }
}

export function clearDemoSettings(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(STORAGE_KEY);
}
