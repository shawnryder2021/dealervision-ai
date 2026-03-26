/**
 * Outbound Webhook System
 * Fires webhooks to external URLs when images are generated
 */

import type { Dealership, GeneratedAsset, Vehicle } from "./types";

export interface WebhookPayload {
  event: "image.generated" | "image.edited" | "test";
  timestamp: string;
  image_url: string;
  content_type: string;
  channel: string;
  aspect_ratio: string | null;
  resolution: string | null;
  prompt?: string;
  vehicle?: {
    year: number | null;
    make: string | null;
    model: string | null;
    trim: string | null;
    price: number | null;
    vin: string | null;
    stock_number: string | null;
  };
  dealership?: {
    name: string;
    phone?: string;
    email?: string;
    website?: string;
    address?: string;
  };
  user_email?: string;
  campaign?: string | null;
}

/**
 * Build the webhook payload based on config options
 */
export function buildWebhookPayload({
  event = "image.generated",
  asset,
  dealership,
  vehicle,
  userEmail,
}: {
  event?: "image.generated" | "image.edited" | "test";
  asset: GeneratedAsset;
  dealership: Dealership;
  vehicle?: Vehicle | null;
  userEmail?: string;
}): WebhookPayload {
  const config = dealership.webhook_config;
  if (!config) return {} as WebhookPayload;

  const payload: WebhookPayload = {
    event,
    timestamp: new Date().toISOString(),
    image_url: asset.image_url || "",
    content_type: asset.content_type,
    channel: asset.channel,
    aspect_ratio: asset.aspect_ratio,
    resolution: asset.resolution,
    campaign: asset.campaign,
  };

  if (config.include_prompt) {
    payload.prompt = asset.prompt;
  }

  if (config.include_vehicle && vehicle) {
    payload.vehicle = {
      year: vehicle.year,
      make: vehicle.make,
      model: vehicle.model,
      trim: vehicle.trim,
      price: vehicle.price,
      vin: vehicle.vin,
      stock_number: vehicle.stock_number,
    };
  }

  if (config.include_dealership) {
    payload.dealership = {
      name: dealership.name,
      phone: dealership.contact.phone,
      email: dealership.contact.email,
      website: dealership.contact.website,
      address: dealership.contact.address,
    };
  }

  if (config.include_user_email && userEmail) {
    payload.user_email = userEmail;
  }

  return payload;
}

/**
 * Fire a webhook to the configured URL.
 * This is fire-and-forget — it never throws, just logs errors.
 */
export async function fireWebhook(
  dealership: Dealership,
  payload: WebhookPayload
): Promise<{ success: boolean; status?: number; error?: string }> {
  const config = dealership.webhook_config;
  if (!config || !config.enabled || !config.url) {
    return { success: false, error: "Webhook not configured" };
  }

  try {
    const body = JSON.stringify(payload);
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      "User-Agent": "DealerAdGen-AI/1.0",
    };

    // HMAC signature if secret is configured
    if (config.secret) {
      const encoder = new TextEncoder();
      const key = await crypto.subtle.importKey(
        "raw",
        encoder.encode(config.secret),
        { name: "HMAC", hash: "SHA-256" },
        false,
        ["sign"]
      );
      const signature = await crypto.subtle.sign(
        "HMAC",
        key,
        encoder.encode(body)
      );
      const hexSignature = Array.from(new Uint8Array(signature))
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("");
      headers["X-Webhook-Signature"] = `sha256=${hexSignature}`;
    }

    const res = await fetch(config.url, {
      method: "POST",
      headers,
      body,
      signal: AbortSignal.timeout(10000), // 10s timeout
    });

    return { success: res.ok, status: res.status };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Webhook failed";
    console.error(`Webhook delivery failed to ${config.url}:`, message);
    return { success: false, error: message };
  }
}

/**
 * Fire webhook in the background (fire-and-forget).
 * Use this in API routes so webhook delivery doesn't block the response.
 */
export function fireWebhookAsync(
  dealership: Dealership,
  payload: WebhookPayload
): void {
  fireWebhook(dealership, payload).catch((e) =>
    console.error("Background webhook failed:", e)
  );
}
