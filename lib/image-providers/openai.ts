/**
 * OpenAI Image Generation Provider
 *
 * Provides image generation using OpenAI's gpt-image-2 model through KIE.ai's API
 * Uses the same async task-based API as KIE.ai with webhook callbacks
 */

import { ImageProvider, CreateImageTaskInput, EditImageTaskInput, ImageTaskResponse, ImageTaskResult } from "./base";

const KIE_API_BASE = "https://api.kie.ai/api/v1/jobs";

export class OpenAIProvider extends ImageProvider {
  /**
   * Create an image generation task with OpenAI gpt-image-2
   */
  async createImageTask(input: CreateImageTaskInput): Promise<ImageTaskResponse> {
    if (!process.env.KIE_API_KEY) {
      throw new Error("KIE_API_KEY not configured. OpenAI gpt-image-2 requires KIE API credentials.");
    }

    const callbackUrl = `${process.env.KIE_CALLBACK_BASE_URL}/api/webhooks/image-generation`;

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
          nsfw_checker: true, // Enable content filtering
        },
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`OpenAI API error: ${response.status} - ${error}`);
    }

    // Response format: { code: 200, msg: "success", data: { taskId, recordId } }
    const json = await response.json();
    if (json.code !== 200 || !json.data?.taskId) {
      throw new Error(`OpenAI error: ${json.msg || "Unknown error"}`);
    }

    return { taskId: json.data.taskId, status: "processing" };
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
