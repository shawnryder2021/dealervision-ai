import { NextResponse } from "next/server";
import { fireWebhook } from "@/lib/webhook";
import type { Dealership } from "@/lib/types";
import type { WebhookPayload } from "@/lib/webhook";

/**
 * Server-side webhook delivery endpoint.
 * The client sends the dealership config + payload,
 * and we fire the webhook from the server (avoids CORS issues).
 */
export async function POST(request: Request) {
  try {
    const { dealership, payload } = (await request.json()) as {
      dealership: Dealership;
      payload: WebhookPayload;
    };

    if (!dealership?.webhook_config?.enabled || !dealership?.webhook_config?.url) {
      return NextResponse.json({ fired: false, reason: "Webhook not configured" });
    }

    // Fire-and-forget in background, return immediately
    fireWebhook(dealership, payload).catch((e) =>
      console.error("Webhook delivery error:", e)
    );

    return NextResponse.json({ fired: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Webhook fire failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
