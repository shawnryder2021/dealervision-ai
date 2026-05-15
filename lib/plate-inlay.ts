/**
 * License plate post-processing.
 * Uses the existing /api/edit-image endpoint (KIE.ai nano-banana-edit) to
 * either blur the plate region or replace it with a clean dealer-branded plate.
 *
 * Two modes:
 *   - 'blur'    — covers the plate with a soft-blur rectangle
 *   - 'branded' — replaces the plate with a clean white plate showing the dealer name
 */

import type { Dealership } from "@/lib/types";

export type PlateInlayMode = "off" | "blur" | "branded";

/** Build the edit prompt for a given plate mode and dealership */
export function buildPlateInlayPrompt(
  mode: "blur" | "branded",
  dealership: Pick<Dealership, "name">
): string {
  if (mode === "blur") {
    return [
      "Find every license plate visible on the vehicle in this image (front and rear).",
      "Replace each plate's rectangular area with a soft, smooth gaussian blur that exactly matches the plate's perspective, angle, and size.",
      "Preserve the plate frame, mounting hardware, and surrounding bodywork untouched.",
      "Do not change anything else in the image — same lighting, same composition, same vehicle, same background.",
    ].join(" ");
  }

  // branded
  const dealerText = (dealership.name || "DEALERSHIP").toUpperCase();
  return [
    "Find every license plate visible on the vehicle in this image (front and rear).",
    `Replace each plate with a clean rectangular white license plate that reads "${dealerText}" in bold black sans-serif lettering, centered horizontally and vertically.`,
    "Match each replaced plate to the exact perspective, angle, size, and lighting of the original plate.",
    "Keep the plate frame, mounting hardware, and surrounding bodywork untouched.",
    "Do not change anything else in the image — same vehicle, same composition, same background, same lighting.",
  ].join(" ");
}

interface ApplyPlateInlayOptions {
  imageUrl: string;
  dealership: Pick<Dealership, "name">;
  mode: "blur" | "branded";
  /** Optional fetch override (for server-side use). Defaults to global fetch. */
  fetcher?: typeof fetch;
  /** Optional base URL prefix (for server-side calls). */
  baseUrl?: string;
}

interface PollOptions {
  taskId: string;
  fetcher?: typeof fetch;
  baseUrl?: string;
  maxAttempts?: number;
  intervalMs?: number;
}

/**
 * Kicks off a plate inlay edit task. Returns the task ID; caller polls separately.
 */
export async function startPlateInlay({
  imageUrl,
  dealership,
  mode,
  fetcher = fetch,
  baseUrl = "",
}: ApplyPlateInlayOptions): Promise<{ taskId: string }> {
  const prompt = buildPlateInlayPrompt(mode, dealership);
  const res = await fetcher(`${baseUrl}/api/edit-image`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      prompt,
      image_url: imageUrl,
      image_size: "1:1",
    }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `Plate inlay request failed (HTTP ${res.status})`);
  }
  const data = await res.json();
  if (!data.taskId) throw new Error("Plate inlay response missing taskId");
  return { taskId: data.taskId };
}

/**
 * Polls the edit-image endpoint until the task completes or fails.
 * Returns the resulting image URL.
 */
export async function pollPlateInlay({
  taskId,
  fetcher = fetch,
  baseUrl = "",
  maxAttempts = 40,
  intervalMs = 3000,
}: PollOptions): Promise<string> {
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    await new Promise((r) => setTimeout(r, intervalMs));
    const res = await fetcher(`${baseUrl}/api/edit-image?taskId=${encodeURIComponent(taskId)}`);
    if (!res.ok) continue;
    const data = await res.json();

    if (data.status === "completed" && data.output?.image_url) {
      return data.output.image_url as string;
    }
    if (data.status === "failed") {
      throw new Error(data.error || "Plate inlay task failed");
    }
  }
  throw new Error("Plate inlay task timed out");
}

/**
 * High-level convenience: starts the inlay task and polls until it completes.
 * Returns the new image URL with plate processed.
 */
export async function applyPlateInlay(
  options: ApplyPlateInlayOptions
): Promise<string> {
  const { taskId } = await startPlateInlay(options);
  return pollPlateInlay({
    taskId,
    fetcher: options.fetcher,
    baseUrl: options.baseUrl,
  });
}
