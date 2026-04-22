/**
 * Image Provider Factory
 *
 * Returns the appropriate image generation provider based on model selection
 */

import { ImageProvider } from "./base";
import { KIEProvider } from "./kie";
import { OpenAIProvider } from "./openai";
import type { ImageModelOption } from "@/lib/db/image-generation";

/**
 * Get the image provider for a given model
 * @param model - The image model to use ('kie-nano-banana' or 'openai-gpt-image-2')
 * @returns An instance of the appropriate image provider
 * @throws Error if model is unknown
 */
export function getImageProvider(model: ImageModelOption): ImageProvider {
  switch (model) {
    case "kie-nano-banana":
      return new KIEProvider();
    case "openai-gpt-image-2":
      return new OpenAIProvider();
    default:
      throw new Error(`Unknown image model: ${model}`);
  }
}

/**
 * Get the image provider for a specific dealership
 * Uses the dealership's configured model or falls back to global default
 * @param dealershipId - The dealership ID
 * @returns An instance of the appropriate image provider
 */
export async function getImageProviderForDealership(dealershipId: string): Promise<ImageProvider> {
  const { getImageModel } = await import("@/lib/db/image-generation");
  const model = await getImageModel(dealershipId);
  return getImageProvider(model);
}

// Re-export provider classes for direct use if needed
export { KIEProvider } from "./kie";
export { OpenAIProvider } from "./openai";
export type { ImageProvider } from "./base";
export type {
  CreateImageTaskInput,
  EditImageTaskInput,
  ImageTaskResult,
  ImageTaskResponse,
} from "./base";
