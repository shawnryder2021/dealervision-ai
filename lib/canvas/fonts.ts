// Font loading for the Design Studio (Konva canvas).
//
// Konva renders text against the browser's *loaded* fonts — both on screen and
// when exporting via stage.toDataURL(). The font picker (FONT_FAMILIES) offers
// several web fonts that the app does not otherwise load, so without this they
// silently fall back to a system font (and the exported PNG bakes the fallback).
//
// We deliberately do NOT use next/font here: it rewrites font-family to a hashed
// name (e.g. "__Bebas_Neue_abc"), which would not match Konva's literal
// `fontFamily: "Bebas Neue"`. Instead we inject a Google Fonts stylesheet and use
// the CSS Font Loading API. Webfonts do not taint the canvas, so export stays clean.

/** Families that must be fetched from Google Fonts (must match FONT_FAMILIES names). */
export const WEB_FONT_FAMILIES = [
  "Inter",
  "Geist",
  "Bebas Neue",
  "Oswald",
  "Playfair Display",
  "Roboto",
  "Montserrat",
] as const;

/** Families already available as system fonts — no network load needed. */
export const SYSTEM_FONT_FAMILIES = [
  "Helvetica",
  "Georgia",
  "Impact",
  "Arial Black",
  "Courier New",
] as const;

const STYLESHEET_ID = "dv-canvas-fonts";

/** Google Fonts css2 URL covering the web families at the weights the editor uses (400 + 700). */
export const CANVAS_GOOGLE_FONTS_HREF =
  "https://fonts.googleapis.com/css2?" +
  WEB_FONT_FAMILIES.map(
    (f) => `family=${encodeURIComponent(f).replace(/%20/g, "+")}:wght@400;700`
  ).join("&") +
  "&display=swap";

let loadPromise: Promise<void> | null = null;

function injectStylesheet(): void {
  if (typeof document === "undefined") return;
  if (document.getElementById(STYLESHEET_ID)) return;
  const link = document.createElement("link");
  link.id = STYLESHEET_ID;
  link.rel = "stylesheet";
  link.href = CANVAS_GOOGLE_FONTS_HREF;
  document.head.appendChild(link);
}

/**
 * Ensure all canvas web fonts are loaded and ready to render. Idempotent — the
 * underlying work runs once and the resolved promise is reused thereafter.
 * Safe to await before exporting so the PNG bakes the correct fonts.
 */
export function loadCanvasFonts(): Promise<void> {
  if (loadPromise) return loadPromise;
  if (typeof document === "undefined" || !("fonts" in document)) {
    loadPromise = Promise.resolve();
    return loadPromise;
  }

  injectStylesheet();

  loadPromise = (async () => {
    // Request each family at both weights; ignore individual failures so one
    // missing font never blocks the rest.
    const reqs: Promise<unknown>[] = [];
    for (const family of WEB_FONT_FAMILIES) {
      for (const weight of [400, 700]) {
        reqs.push(document.fonts.load(`${weight} 64px "${family}"`).catch(() => undefined));
      }
    }
    await Promise.all(reqs);
    try {
      await document.fonts.ready;
    } catch {
      /* no-op */
    }
  })();

  return loadPromise;
}
