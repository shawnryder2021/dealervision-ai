/**
 * OpenAI Image Generation Provider
 *
 * Provides image generation using OpenAI's gpt-image-2 model through KIE.ai's API
 * Uses the same async task-based API as KIE.ai with webhook callbacks
 */

import { ImageProvider, CreateImageTaskInput, EditImageTaskInput, ImageTaskResponse, ImageTaskResult } from "./base";

const KIE_API_BASE = "https://api.kie.ai/api/v1/jobs";
const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 2000;

/** Sleep helper for retry backoff */
function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export class OpenAIProvider extends ImageProvider {
  /**
   * Create an image generation task with OpenAI gpt-image-2.
   * Retries up to MAX_RETRIES times on upstream timeout errors.
   */
  async createImageTask(input: CreateImageTaskInput): Promise<ImageTaskResponse> {
    if (!process.env.KIE_API_KEY) {
      throw new Error("KIE_API_KEY not configured. OpenAI gpt-image-2 requires KIE API credentials.");
    }

    const callbackUrl = `${process.env.KIE_CALLBACK_BASE_URL}/api/webhooks/image-generation`;

    let lastError: Error = new Error("Unknown error");

    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      try {
        const response = await fetch(`${KIE_API_BASE}/createTask`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${process.env.KIE_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "gpt-image-2-text-to-image",
            callBackUrl: callbackUrl,
            input: {
              prompt: input.prompt,
              aspect_ratio: input.aspect_ratio || "auto",
              nsfw_checker: false,
              // KIE.ai may use image_input for image-to-image generation;
              // pass it through if provided (logo + reference photos)
              ...(input.image_input && input.image_input.length > 0
                ? { image_input: input.image_input }
                : {}),
            },
          }),
        });

        if (!response.ok) {
          const error = await response.text();
          throw new Error(`OpenAI API error: ${response.status} - ${error}`);
        }

        const json = await response.json();

        if (json.code !== 200 || !json.data?.taskId) {
          const msg: string = json.msg || "Unknown error";
          // Upstream timeout — worth retrying
          if (msg.toLowerCase().includes("timed out") || msg.toLowerCase().includes("timeout")) {
            lastError = new Error(msg);
            if (attempt < MAX_RETRIES) {
              console.warn(`OpenAI gpt-image-2 timeout (attempt ${attempt}/${MAX_RETRIES}), retrying in ${RETRY_DELAY_MS}ms...`);
              await sleep(RETRY_DELAY_MS * attempt);
              continue;
            }
            throw new Error(`OpenAI generation timed out after ${MAX_RETRIES} attempts. Please try again in a moment.`);
          }
          throw new Error(msg);
        }

        return { taskId: json.data.taskId, status: "processing" };

      } catch (err) {
        lastError = err instanceof Error ? err : new Error(String(err));
        // Only retry on timeout-related errors
        if (!lastError.message.toLowerCase().includes("timed out") &&
            !lastError.message.toLowerCase().includes("timeout")) {
          throw lastError;
        }
        if (attempt < MAX_RETRIES) {
          await sleep(RETRY_DELAY_MS * attempt);
        }
      }
    }

    throw lastError;
  }

  /**
   * Create an image editing task with OpenAI
   * Note: OpenAI gpt-image-2 does not currently support editing
   */
  async createEditTask(input: EditImageTaskInput): Promise<ImageTaskResponse> {
    throw new Error(
      "OpenAI gpt-image-2 does not support image editing. " +
      "Use KIE.ai nano-banana-2 for image editing capabilities."
    );
  }

  /**
   * Get the status of an OpenAI task
   */
  async getTaskStatus(taskId: string): Promise<ImageTaskResult> {
    if (!process.env.KIE_API_KEY) {
      throw new Error("KIE_API_KEY not configured.");
    }

    const response = await fetch(`${KIE_API_BASE}/recordInfo?taskId=${taskId}`, {
      headers: {
        Authorization: `Bearer ${process.env.KIE_API_KEY}`,
      },
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`OpenAI API error: ${response.status} - ${error}`);
    }

    // Response format: { code: 200, msg: "success", data: { taskId, state, resultJson, ... } }
    const json = await response.json();
    if (json.code !== 200 || !json.data) {
      throw new Error(`OpenAI error: ${json.msg || "Unknown error"}`);
    }

    const data = json.data;
    const state = data.state as string;

    // Parse resultJson to extract image URLs
    let imageUrl: string | undefined;
    if (state === "success" && data.resultJson) {
      try {
        const result = typeof data.resultJson === "string"
          ? JSON.parse(data.resultJson)
          : data.resultJson;
        if (result.resultUrls && result.resultUrls.length > 0) {
          imageUrl = result.resultUrls[0];
        }
      } catch {
        // resultJson parse failed
      }
    }

    // Map KIE.ai states to our status
    let status: ImageTaskResult["status"];
    if (state === "success") {
      status = "completed";
    } else if (state === "fail") {
      status = "failed";
    } else {
      // waiting, queuing, generating
      status = "processing";
    }

    return {
      taskId: data.taskId || taskId,
      status,
      output: imageUrl ? { image_url: imageUrl } : undefined,
      error: state === "fail" ? (data.failMsg || "Generation failed") : undefined,
    };
  }

  /**
   * Handle webhook callback from OpenAI (via KIE.ai)
   */
  async handleWebhook(
    signature: string,
    payload: Record<string, unknown>
  ): Promise<{ taskId: string; status: string }> {
    const taskId = payload.taskId as string;
    const state = payload.state as string;

    let status = "processing";
    if (state === "success") {
      status = "completed";
    } else if (state === "fail") {
      status = "failed";
    }

    return { taskId, status };
  }

  /**
   * Get the cost for a generation at a given resolution
   */
  getResolutionCost(resolution: string): number {
    // OpenAI gpt-image-2 pricing (per generation)
    const costs: Record<string, number> = {
      "1K": 0.04,
      "2K": 0.06,
      "4K": 0.10,
    };
    return costs[resolution] || 0.04;
  }

  /**
   * Get provider name
   */
  getProviderName(): string {
    return "OpenAI";
  }
}
