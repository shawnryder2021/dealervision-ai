"use client";

import { useAppStore } from "./store";
import type { GeneratedAsset, Vehicle } from "./types";
import type { WebhookPayload } from "./webhook";

/**
 * Client-side hook to fire webhooks after image generation.
 * Sends the payload to /api/webhook-fire which delivers it server-side.
 */
export function useWebhook() {
  const { dealership, vehicles } = useAppStore();

  function fireWebhook(
    asset: GeneratedAsset,
    event: "image.generated" | "image.edited" = "image.generated"
  ) {
    if (!dealership?.webhook_config?.enabled || !dealership?.webhook_config?.url) {
      return;
    }

    const config = dealership.webhook_config;
    const vehicle = asset.vehicle_id
      ? vehicles.find((v) => v.id === asset.vehicle_id)
      : null;

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

    if (config.include_user_email && dealership.contact.email) {
      payload.user_email = dealership.contact.email;
    }

    // Fire-and-forget to server endpoint
    fetch("/api/webhook-fire", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ dealership, payload }),
    }).catch((e) => console.error("Webhook fire request failed:", e));
  }

  return { fireWebhook };
}
