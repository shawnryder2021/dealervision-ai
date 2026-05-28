import type { GeneratedAsset } from "@/lib/types";

/** Thrown when /api/generate returns 402 (quota/credits exhausted). */
export class QuotaError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "QuotaError";
  }
}

const POLL_INTERVAL_MS = 3000;
const MAX_POLL_ATTEMPTS = 60;

function delay(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

/**
 * Run an async worker over items with a fixed concurrency limit.
 * Always settles (errors are surfaced per-item via the worker, not thrown here).
 */
export async function runPool<T>(
  items: T[],
  concurrency: number,
  worker: (item: T, index: number) => Promise<void>
): Promise<void> {
  let cursor = 0;
  const runNext = async (): Promise<void> => {
    const i = cursor++;
    if (i >= items.length) return;
    await worker(items[i], i);
    return runNext();
  };
  const lanes = Array.from({ length: Math.min(concurrency, items.length) }, () => runNext());
  await Promise.all(lanes);
}

/**
 * Production generation job: POST /api/generate, then poll /api/generate/[id]
 * until completed/failed. Calls onCreated as soon as the (processing) asset row
 * exists so the UI can show a card immediately. Resolves with the final asset.
 * Throws QuotaError on 402.
 */
export async function submitAndPollProd(args: {
  body: Record<string, unknown>;
  headers?: Record<string, string>;
  onCreated?: (asset: GeneratedAsset) => void;
}): Promise<GeneratedAsset> {
  const { body, headers, onCreated } = args;

  const res = await fetch("/api/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json", ...(headers || {}) },
    body: JSON.stringify(body),
  });

  if (res.status === 402) {
    const err = await res.json().catch(() => ({}));
    throw new QuotaError(err.error || "Generation limit reached");
  }
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || "Generation failed");
  }

  const asset: GeneratedAsset = await res.json();
  onCreated?.(asset);

  let attempts = 0;
  while (attempts < MAX_POLL_ATTEMPTS) {
    attempts++;
    await delay(POLL_INTERVAL_MS);
    try {
      const pres = await fetch(`/api/generate/${asset.id}`);
      if (!pres.ok) continue;
      const data: GeneratedAsset = await pres.json();
      if (data.status === "completed" && data.image_url) return data;
      if (data.status === "failed") return data;
    } catch {
      // transient — keep polling
    }
  }
  return { ...asset, status: "failed" };
}

/**
 * Demo generation job: POST /api/demo-generate, then poll ?taskId. The caller
 * supplies the client-built base asset (demo mode has no DB row). Resolves with
 * the asset carrying the final status + image_url.
 */
export async function submitAndPollDemo(args: {
  payload: Record<string, unknown>;
  baseAsset: GeneratedAsset;
  onCreated?: (asset: GeneratedAsset) => void;
}): Promise<GeneratedAsset> {
  const { payload, baseAsset, onCreated } = args;

  const res = await fetch("/api/demo-generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || "Generation failed");
  }
  const { taskId } = await res.json();
  onCreated?.(baseAsset);

  let attempts = 0;
  while (attempts < MAX_POLL_ATTEMPTS) {
    attempts++;
    await delay(POLL_INTERVAL_MS);
    try {
      const pres = await fetch(`/api/demo-generate?taskId=${taskId}`);
      if (!pres.ok) continue;
      const data = await pres.json();
      if (data.status === "completed" && (data.output?.image_url || data.output?.url)) {
        return { ...baseAsset, status: "completed", image_url: data.output.image_url || data.output.url };
      }
      if (data.status === "failed") return { ...baseAsset, status: "failed" };
    } catch {
      // transient — keep polling
    }
  }
  return { ...baseAsset, status: "failed" };
}
