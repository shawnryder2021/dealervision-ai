/**
 * Image Generation Model Management
 *
 * Handles dealership-level image model preferences.
 * Dealerships can choose between KIE.ai and OpenAI models.
 */

import { createClient } from "@/lib/supabase/client";

export type ImageModelOption = "kie-nano-banana" | "openai-gpt-image-2";

const GLOBAL_DEFAULT_MODEL: ImageModelOption = "openai-gpt-image-2";

/**
 * Get the image model to use for a dealership
 * Returns the dealership-specific model if set, otherwise returns the global default
 *
 * @param dealershipId - The dealership ID
 * @returns The image model to use (e.g., 'kie-nano-banana' or 'openai-gpt-image-2')
 */
export async function getImageModel(
  dealershipId: string
): Promise<ImageModelOption> {
  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("dealerships")
      .select("image_model")
      .eq("id", dealershipId)
      .single();

    if (error || !data) {
      console.warn(
        `Failed to get image model for dealership ${dealershipId}:`,
        error
      );
      return GLOBAL_DEFAULT_MODEL;
    }

    return (data.image_model || GLOBAL_DEFAULT_MODEL) as ImageModelOption;
  } catch (err) {
    console.error("Error fetching image model:", err);
    return GLOBAL_DEFAULT_MODEL;
  }
}

/**
 * Set the image model for a specific dealership
 * Requires admin authentication
 *
 * @param dealershipId - The dealership ID
 * @param model - The model to use ('kie-nano-banana' or 'openai-gpt-image-2')
 * @returns Success status and any error message
 */
export async function setImageModel(
  dealershipId: string,
  model: ImageModelOption
): Promise<{ success: boolean; error?: string }> {
  try {
    // Validate model option
    if (!["kie-nano-banana", "openai-gpt-image-2"].includes(model)) {
      return {
        success: false,
        error: `Invalid image model: ${model}`,
      };
    }

    const supabase = createClient();
    const { error } = await supabase
      .from("dealerships")
      .update({ image_model: model })
      .eq("id", dealershipId);

    if (error) {
      console.error(`Failed to set image model for dealership ${dealershipId}:`, error);
      return {
        success: false,
        error: error.message || "Failed to update image model",
      };
    }

    return { success: true };
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    console.error("Error setting image model:", err);
    return {
      success: false,
      error: errorMessage,
    };
  }
}

/**
 * Get the global default image model
 * This is a fallback used when dealership-specific settings are not available
 *
 * In the future, this could be enhanced to read from a platform configuration table
 *
 * @returns The global default image model
 */
export function getGlobalDefaultModel(): ImageModelOption {
  return GLOBAL_DEFAULT_MODEL;
}

/**
 * Get model information for display purposes
 * Returns pricing, capabilities, and other metadata about a model
 *
 * @param model - The image model
 * @returns Model information object
 */
export function getModelInfo(model: ImageModelOption) {
  const modelInfo = {
    "kie-nano-banana": {
      name: "KIE.ai nano-banana-2",
      displayName: "KIE.ai nano-banana-2",
      description: "Optimized for high-quality automotive imagery. Supports image editing with google/nano-banana-edit.",
      pricing: "$0.04-0.09 per generation",
      capabilities: ["Text-to-image", "Image editing", "Multiple aspect ratios", "PNG/JPEG output"],
      async: true,
      provider: "KIE.ai",
      supportedFeatures: ["generation", "editing"],
    },
    "openai-gpt-image-2": {
      name: "OpenAI GPT-Image-2",
      displayName: "OpenAI GPT-Image-2",
      description: "Advanced general-purpose image generation with content filtering. Available through KIE.ai marketplace.",
      pricing: "$0.04-0.10 per generation",
      capabilities: ["Text-to-image", "Content filtering", "Multiple aspect ratios", "Auto aspect ratio"],
      async: true,
      provider: "OpenAI (via KIE.ai)",
      supportedFeatures: ["generation"],
      limitations: ["No image editing support"],
    },
  };

  return modelInfo[model] || modelInfo["openai-gpt-image-2"];
}
