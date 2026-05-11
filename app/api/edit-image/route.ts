import { NextResponse } from "next/server";
import { getImageProvider } from "@/lib/image-providers";
import { uploadToImgBB } from "@/lib/imgbb";

export async function POST(request: Request) {
  try {
    const { prompt, image_url, image_urls, image_size, model } = await request.json();

    if (!prompt) {
      return NextResponse.json({ error: "Edit prompt is required" }, { status: 400 });
    }

    // Accept either a single image_url or an array of image_urls.
    // Multiple images are supported for reference-based edits (e.g., using a
    // custom saved background as a visual reference alongside the vehicle photo).
    const finalImageUrls: string[] = Array.isArray(image_urls) && image_urls.length > 0
      ? image_urls.filter((u: unknown): u is string => typeof u === "string" && u.length > 0)
      : image_url
        ? [image_url]
        : [];

    if (finalImageUrls.length === 0) {
      return NextResponse.json({ error: "Source image is required" }, { status: 400 });
    }

    // Image editing is KIE.ai-only — OpenAI gpt-image-2 only supports generation.
    // Always force KIE.ai for edit tasks regardless of the requested model.
    const imageModel = "kie-nano-banana" as const;
    const provider = getImageProvider(imageModel);

    // Uses the provider's edit task (e.g., google/nano-banana-edit for KIE.ai)
    const result = await provider.createEditTask({
      prompt,
      image_urls: finalImageUrls,
      image_size: image_size || "1:1",
      output_format: "png",
    });

    return NextResponse.json({
      taskId: result.taskId,
      status: "processing",
      model: imageModel,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Edit failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const taskId = searchParams.get("taskId");
    if (!taskId) {
      return NextResponse.json({ error: "taskId required" }, { status: 400 });
    }

    // Edit tasks always use KIE.ai — ignore any model param
    const provider = getImageProvider("kie-nano-banana");
    const result = await provider.getTaskStatus(taskId);

    // Return the image immediately — upload to ImgBB in background (don't block)
    if (result.status === "completed" && result.output?.image_url) {
      const originalUrl = result.output.image_url;

      // Fire-and-forget: upload to ImgBB in the background
      uploadToImgBB(originalUrl).catch((e) =>
        console.error("Background ImgBB upload failed:", e)
      );

      // Return original URL right away so the user sees the image fast
      return NextResponse.json(result);
    }

    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Poll failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
