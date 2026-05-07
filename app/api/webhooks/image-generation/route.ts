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
import { uploadToImgBB, uploadBufferToImgBB } from "@/lib/imgbb";
import { compositeLogoOntoImage } from "@/lib/image-compositor";

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
      // Save with original URL immediately so the user sees something fast
      await supabase
        .from("generated_assets")
        .update({ status: "completed", image_url: imageUrl })
        .eq("id", asset.id);

      // Fetch the dealership to see if a logo overlay is needed
      const { data: dealership } = await supabase
        .from("dealerships")
        .select("logo_url")
        .eq("id", asset.dealership_id)
        .single();

      // Background processing: composite logo (if any) and re-host to ImgBB
      processImageInBackground(asset.id, imageUrl, dealership?.logo_url || null, supabase);
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

/**
 * Background pipeline: composite the dealership logo (if any) onto the
 * AI-generated image, then upload the result to ImgBB and update the asset.
 * This guarantees a pixel-perfect logo regardless of which AI model was used,
 * and eliminates the duplicate-watermark problem because we don't depend on
 * the AI to honor logo instructions.
 */
async function processImageInBackground(
  assetId: string,
  imageUrl: string,
  logoUrl: string | null,
  supabase: Awaited<ReturnType<typeof createServiceClient>>,
) {
  try {
    let finalUrl = imageUrl;

    if (logoUrl) {
      try {
        const composited = await compositeLogoOntoImage({
          baseImageUrl: imageUrl,
          logoUrl,
        });
        const imgbb = await uploadBufferToImgBB(composited);
        finalUrl = imgbb.url;
      } catch (e) {
        console.error("[image-webhook] logo composite failed, falling back to base image:", e);
        // Fall back to re-hosting the original AI image without the overlay
        try {
          const imgbb = await uploadToImgBB(imageUrl);
          finalUrl = imgbb.url;
        } catch (e2) {
          console.error("[image-webhook] fallback ImgBB upload failed:", e2);
        }
      }
    } else {
      // No logo to overlay — just re-host the original
      try {
        const imgbb = await uploadToImgBB(imageUrl);
        finalUrl = imgbb.url;
      } catch (e) {
        console.error("[image-webhook] ImgBB upload failed:", e);
      }
    }

    if (finalUrl !== imageUrl) {
      await supabase
        .from("generated_assets")
        .update({ image_url: finalUrl })
        .eq("id", assetId);
    }
  } catch (e) {
    console.error("[image-webhook] processImageInBackground error:", e);
  }
}
