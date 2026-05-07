/**
 * Generic Image Generation Webhook Handler
 *
 * Handles webhooks from any image generation provider (KIE.ai, OpenAI via KIE, etc.)
 * Updates the generated_assets table when generation completes or fails.
 *
 * KIE.ai webhook payload shape (both nano-banana-2 and gpt-image-2):
 * {
 *   code: 200,
 *   data: {
 *     taskId: "...",
 *     state: "success" | "fail" | "waiting" | "queuing" | "generating",
 *     resultJson: "{\"resultUrls\":[\"https://...\"]}",  // stringified JSON
 *     failMsg?: string
 *   }
 * }
 *
 * Generic fallback also supported: { taskId, status, output: { image_url } }
 */

import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { uploadToImgBB } from "@/lib/imgbb";

interface WebhookExtraction {
  taskId?: string;
  status?: "completed" | "failed" | "processing";
  imageUrl?: string;
  errorMessage?: string;
}

/** Extract task info from any supported webhook payload */
function extractFromPayload(body: Record<string, unknown>): WebhookExtraction {
  // KIE.ai format: { code, data: { taskId, state, resultJson, failMsg } }
  const data = (body.data ?? body) as Record<string, unknown>;
  const kieState = data.state as string | undefined;
  const kieTaskId = data.taskId as string | undefined;
  const kieResultJson = data.resultJson;
  const kieFailMsg = data.failMsg as string | undefined;

  // Generic fallback: { taskId, task_id, status, output: { image_url, url }, image_url, error }
  const fallbackTaskId =
    (body.taskId as string | undefined) ?? (body.task_id as string | undefined);
  const fallbackStatus = body.status as string | undefined;
  const output = body.output as Record<string, unknown> | undefined;
  const fallbackImageUrl =
    (output?.image_url as string | undefined) ??
    (body.image_url as string | undefined) ??
    (output?.url as string | undefined);

  // Resolve taskId
  const taskId = kieTaskId ?? fallbackTaskId;

  // Resolve status from KIE state first, then fallback status
  let status: WebhookExtraction["status"];
  if (kieState === "success" || fallbackStatus === "completed" || fallbackStatus === "success") {
    status = "completed";
  } else if (kieState === "fail" || fallbackStatus === "failed" || fallbackStatus === "fail") {
    status = "failed";
  } else if (kieState || fallbackStatus) {
    status = "processing";
  }

  // Resolve image URL — KIE puts it inside resultJson (often stringified)
  let imageUrl: string | undefined = fallbackImageUrl;
  if (!imageUrl && kieResultJson) {
    try {
      const parsed =
        typeof kieResultJson === "string" ? JSON.parse(kieResultJson) : kieResultJson;
      if (parsed && typeof parsed === "object") {
        const obj = parsed as Record<string, unknown>;
        const urls = obj.resultUrls as string[] | undefined;
        if (Array.isArray(urls) && urls.length > 0) {
          imageUrl = urls[0];
        }
      }
    } catch {
      // resultJson parse failed — leave imageUrl undefined
    }
  }

  return {
    taskId,
    status,
    imageUrl,
    errorMessage: kieFailMsg ?? (body.error as string | undefined),
  };
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Record<string, unknown>;
    console.log("[image-webhook] received payload:", JSON.stringify(body).slice(0, 500));

    const { taskId, status, imageUrl, errorMessage } = extractFromPayload(body);

    if (!taskId) {
      console.error("[image-webhook] missing taskId in payload");
      return NextResponse.json({ error: "Missing taskId" }, { status: 400 });
    }

    const supabase = await createServiceClient();

    // Find asset by kie_task_id (stores task ID from any provider)
    const { data: asset } = await supabase
      .from("generated_assets")
      .select("*")
      .eq("kie_task_id", taskId)
      .single();

    if (!asset) {
      console.warn("[image-webhook] asset not found for taskId", taskId);
      // 200 so KIE doesn't retry — the asset row may have been deleted
      return NextResponse.json({ success: false, reason: "asset not found" });
    }

    if (status === "completed" && imageUrl) {
      // Save with original URL immediately so the user sees the image fast
      await supabase
        .from("generated_assets")
        .update({ status: "completed", image_url: imageUrl })
        .eq("id", asset.id);

      // Fire-and-forget: re-host on ImgBB in background, then update DB with permanent URL
      uploadToImgBB(imageUrl)
        .then((imgbb) => {
          supabase
            .from("generated_assets")
            .update({ image_url: imgbb.url })
            .eq("id", asset.id)
            .then(() => {});
        })
        .catch((e) => console.error("[image-webhook] background ImgBB upload failed:", e));
    } else if (status === "failed") {
      await supabase
        .from("generated_assets")
        .update({
          status: "failed",
          metadata: {
            ...(asset.metadata || {}),
            error: errorMessage || "Generation failed",
          },
        })
        .eq("id", asset.id);
    } else {
      console.log(
        `[image-webhook] taskId=${taskId} status=${status ?? "unknown"} — no DB update`
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Webhook processing error";
    console.error("[image-webhook] error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
