import type { KieCreateTaskResponse, KieTaskResult } from "./types";

const KIE_API_BASE = "https://api.kie.ai/api/v1/jobs";

interface CreateTaskInput {
  prompt: string;
  image_input?: string[];
  aspect_ratio: string;
  resolution: string;
  output_format?: string;
}

export async function createImageTask(input: CreateTaskInput): Promise<KieCreateTaskResponse> {
  const callbackUrl = `${process.env.KIE_CALLBACK_BASE_URL}/api/webhooks/kie`;

  const response = await fetch(`${KIE_API_BASE}/createTask`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.KIE_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "nano-banana-2",
      callBackUrl: callbackUrl,
      input: {
        prompt: input.prompt,
        image_input: input.image_input || [],
        aspect_ratio: input.aspect_ratio,
        resolution: input.resolution,
        output_format: input.output_format || "png",
      },
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Kie.ai API error: ${response.status} - ${error}`);
  }

  // Response format: { code: 200, msg: "success", data: { taskId, recordId } }
  const json = await response.json();
  if (json.code !== 200 || !json.data?.taskId) {
    throw new Error(`Kie.ai error: ${json.msg || "Unknown error"}`);
  }

  return { taskId: json.data.taskId, status: "processing" };
}

interface EditTaskInput {
  prompt: string;
  image_urls: string[];
  image_size?: string;
  output_format?: string;
}

export async function createEditTask(input: EditTaskInput): Promise<KieCreateTaskResponse> {
  const callbackUrl = `${process.env.KIE_CALLBACK_BASE_URL}/api/webhooks/kie`;

  const response = await fetch(`${KIE_API_BASE}/createTask`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.KIE_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "google/nano-banana-edit",
      callBackUrl: callbackUrl,
      input: {
        prompt: input.prompt,
        image_urls: input.image_urls,
        image_size: input.image_size || "1:1",
        output_format: input.output_format || "png",
      },
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Kie.ai Edit API error: ${response.status} - ${error}`);
  }

  const json = await response.json();
  if (json.code !== 200 || !json.data?.taskId) {
    throw new Error(`Kie.ai edit error: ${json.msg || "Unknown error"}`);
  }

  return { taskId: json.data.taskId, status: "processing" };
}

export async function getTaskStatus(taskId: string): Promise<KieTaskResult> {
  const response = await fetch(`${KIE_API_BASE}/recordInfo?taskId=${taskId}`, {
    headers: {
      Authorization: `Bearer ${process.env.KIE_API_KEY}`,
    },
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Kie.ai API error: ${response.status} - ${error}`);
  }

  // Response format: { code: 200, msg: "success", data: { taskId, state, resultJson, ... } }
  const json = await response.json();
  if (json.code !== 200 || !json.data) {
    throw new Error(`Kie.ai error: ${json.msg || "Unknown error"}`);
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

  // Map Kie.ai states to our status
  let status: KieTaskResult["status"];
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

export function getResolutionCost(resolution: string): number {
  const costs: Record<string, number> = {
    "1K": 0.04,
    "2K": 0.06,
    "4K": 0.09,
  };
  return costs[resolution] || 0.04;
}
