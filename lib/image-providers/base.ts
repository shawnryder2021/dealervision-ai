/**
 * Base interface for image generation providers
 *
 * All image generation providers must implement this interface to be used
 * interchangeably in the application.
 */

export interface CreateImageTaskInput {
  prompt: string;
  image_input?: string[];
  aspect_ratio: string;
  resolution: string;
  output_format?: string;
}

export interface EditImageTaskInput {
  prompt: string;
  image_urls: string[];
  image_size?: string;
  output_format?: string;
}

export interface ImageTaskResult {
  taskId: string;
  status: "pending" | "processing" | "completed" | "failed";
  output?: {
    image_url?: string;
  };
  error?: string;
}

export interface ImageTaskResponse {
  taskId: string;
  status: string;
}

/**
 * Base class for image generation providers
 * Defines the interface that all providers must implement
 */
export abstract class ImageProvider {
  /**
   * Create an image generation task
   */
  abstract createImageTask(input: CreateImageTaskInput): Promise<ImageTaskResponse>;

  /**
   * Create an image editing task
   */
  abstract createEditTask(input: EditImageTaskInput): Promise<ImageTaskResponse>;

  /**
   * Get the status of a task and retrieve results if available
   */
  abstract getTaskStatus(taskId: string): Promise<ImageTaskResult>;

  /**
   * Handle webhook callback from the provider
   * Should verify signature and update task status in database
   */
  abstract handleWebhook(
    signature: string,
    payload: Record<string, unknown>
  ): Promise<{ taskId: string; status: string }>;

  /**
   * Get the cost for a generation at a given resolution
   */
  abstract getResolutionCost(resolution: string): number;

  /**
   * Get provider name for display purposes
   */
  abstract getProviderName(): string;
}
