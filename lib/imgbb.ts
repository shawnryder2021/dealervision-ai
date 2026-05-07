const IMGBB_API_URL = "https://api.imgbb.com/1/upload";

interface ImgBBUploadResult {
  url: string;
  display_url: string;
  delete_url: string;
}

/**
 * Upload an image to ImgBB from a URL.
 * Returns the permanent ImgBB URL.
 */
export async function uploadToImgBB(imageUrl: string): Promise<ImgBBUploadResult> {
  const apiKey = process.env.IMGBB_API_KEY;
  if (!apiKey) {
    throw new Error("IMGBB_API_KEY is not configured");
  }

  const formData = new FormData();
  formData.append("key", apiKey);
  formData.append("image", imageUrl);

  const response = await fetch(IMGBB_API_URL, {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`ImgBB upload failed: ${response.status} - ${error}`);
  }

  const json = await response.json();
  if (!json.success || !json.data?.url) {
    throw new Error(`ImgBB upload error: ${json.error?.message || "Unknown error"}`);
  }

  return {
    url: json.data.url,
    display_url: json.data.display_url,
    delete_url: json.data.delete_url,
  };
}

/**
 * Upload an image to ImgBB from a raw Buffer (e.g. composited output).
 * ImgBB accepts base64 — convert and upload.
 */
export async function uploadBufferToImgBB(buffer: Buffer): Promise<ImgBBUploadResult> {
  const apiKey = process.env.IMGBB_API_KEY;
  if (!apiKey) {
    throw new Error("IMGBB_API_KEY is not configured");
  }

  const base64 = buffer.toString("base64");
  const formData = new FormData();
  formData.append("key", apiKey);
  formData.append("image", base64);

  const response = await fetch(IMGBB_API_URL, {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`ImgBB upload failed: ${response.status} - ${error}`);
  }

  const json = await response.json();
  if (!json.success || !json.data?.url) {
    throw new Error(`ImgBB upload error: ${json.error?.message || "Unknown error"}`);
  }

  return {
    url: json.data.url,
    display_url: json.data.display_url,
    delete_url: json.data.delete_url,
  };
}
