/**
 * Dealership Brand Memory helpers.
 *
 * Brand Memory is an accumulating knowledge profile (manual notes + an
 * AI-learned summary + structured preferences) that gets injected into every
 * generation — image prompts, vehicle descriptions, social captions, AI copy.
 * This is context injection (RAG-style), NOT model fine-tuning: the hosted
 * image/text models can't be trained, so instead we carry the dealership's
 * accumulated context into each prompt.
 */

import type { BrandMemory, Dealership } from "@/lib/types";

/**
 * Build the brand-memory text block injected into prompts. Returns "" when the
 * dealership has no memory yet, so callers can safely concatenate.
 *
 * `mode` tunes the framing:
 *  - "image": guidance for an image generator (visual styling cues)
 *  - "copy":  guidance for a text/copy generator (voice + facts)
 */
export function buildBrandMemoryBlock(
  dealership: Pick<Dealership, "brand_memory"> | null | undefined,
  mode: "image" | "copy" = "image"
): string {
  const mem = dealership?.brand_memory;
  if (!mem) return "";

  const parts: string[] = [];

  if (mem.manual_notes && mem.manual_notes.trim()) {
    parts.push(mem.manual_notes.trim());
  }
  if (mem.learned_summary && mem.learned_summary.trim()) {
    parts.push(mem.learned_summary.trim());
  }

  const prefs = mem.preferences;
  if (prefs) {
    const prefParts: string[] = [];
    if (prefs.tones?.length) prefParts.push(`preferred tone: ${prefs.tones.join(", ")}`);
    if (prefs.styles?.length) prefParts.push(`preferred visual style: ${prefs.styles.join(", ")}`);
    if (mode === "copy" && prefs.recurring_offers?.length) {
      prefParts.push(`offers they commonly run: ${prefs.recurring_offers.join(", ")}`);
    }
    if (prefs.featured_models?.length) {
      prefParts.push(`vehicles they feature most: ${prefs.featured_models.join(", ")}`);
    }
    if (prefParts.length) parts.push(prefParts.join("; "));
  }

  if (parts.length === 0) return "";

  const label =
    mode === "image"
      ? "Dealership brand memory (apply as styling + voice guidance, do not render this text literally)"
      : "Dealership brand memory (match this voice, facts, and preferences)";

  return ` ${label}: ${parts.join(". ")}.`;
}

/** True when there's anything in memory worth injecting. */
export function hasBrandMemory(dealership: Pick<Dealership, "brand_memory"> | null | undefined): boolean {
  return buildBrandMemoryBlock(dealership).length > 0;
}

/** Empty preferences object — safe default for the UI. */
export function emptyPreferences(): NonNullable<BrandMemory["preferences"]> {
  return { tones: [], styles: [], channels: [], featured_models: [], recurring_offers: [] };
}

// ─── Summarizer (used by /api/brand-memory/learn) ──────────────────────────────

/** A single row of activity the summarizer reasons over. */
export interface ActivitySignal {
  content_type: string;
  channel: string;
  style?: string | null;
  headline?: string | null;
  vehicle?: string | null;
  campaign?: string | null;
}

export const BRAND_MEMORY_SYSTEM_PROMPT = `You analyze a car dealership's recent marketing-generation activity and distill what you've learned about how THIS dealership markets itself.

Output STRICT JSON only (no markdown, no commentary) with this exact shape:
{
  "learned_summary": "2-4 sentence paragraph describing this dealership's marketing patterns, voice, and focus — written as guidance for generating future marketing. Plain text, no markdown.",
  "preferences": {
    "tones": ["..."],
    "styles": ["..."],
    "channels": ["..."],
    "featured_models": ["..."],
    "recurring_offers": ["..."]
  }
}

RULES
- Base everything ONLY on the activity provided plus any existing profile. Never invent dealership facts, pricing, or claims.
- Keep each preferences array to at most 5 of the most representative items. Use plain lowercase phrases.
- featured_models = vehicle makes/models that recur. recurring_offers = offers/phrases (e.g. "0% APR", "$0 down") that recur in headlines.
- If the activity is too thin to support a field, return an empty array for it.
- The learned_summary must read as practical guidance, e.g. "This dealership favors a confident, value-driven tone and posts mostly Instagram vehicle spotlights of trucks and SUVs..."`;

/** Build the user prompt for the summarizer from existing memory + recent signals. */
export function buildSummarizerUserPrompt(args: {
  dealershipName?: string;
  existing?: BrandMemory;
  signals: ActivitySignal[];
}): string {
  const { dealershipName, existing, signals } = args;

  const existingBlock =
    existing && (existing.manual_notes || existing.learned_summary)
      ? `EXISTING PROFILE:\n${[existing.manual_notes, existing.learned_summary].filter(Boolean).join("\n")}`
      : "EXISTING PROFILE: (none yet)";

  const lines = signals.map((s, i) => {
    const bits = [
      `#${i + 1}`,
      s.content_type,
      `→ ${s.channel}`,
      s.style ? `style:${s.style}` : "",
      s.vehicle ? `vehicle:${s.vehicle}` : "",
      s.headline ? `headline:"${s.headline}"` : "",
      s.campaign ? `campaign:${s.campaign}` : "",
    ].filter(Boolean);
    return bits.join(" ");
  });

  return `DEALERSHIP: ${dealershipName || "(unnamed)"}

${existingBlock}

RECENT GENERATION ACTIVITY (most recent first, ${signals.length} items):
${lines.join("\n") || "(no activity yet)"}

Analyze the above and return the JSON profile now.`;
}
