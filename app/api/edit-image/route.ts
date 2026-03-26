import { NextResponse } from "next/server";
import { createEditTask, getTaskStatus } from "@/lib/kie";
import { uploadToImgBB } from "@/lib/imgbb";

export async function POST(request: Request) {
  try {
    const { prompt, image_url, image_size } = await request.json();

    if (!prompt) {
      return NextResponse.json({ error: "Edit prompt is required" }, { status: 400 });
    }
    if (!image_url) {
      return NextResponse.json({ error: "Source image is required" }, { status: 400 });
    }

    // Uses google/nano-banana-edit model (4 credits vs 8 for generation)
    const result = await createEditTask({
      prompt,
      image_urls: [image_url],
      image_size: image_size || "1:1",
      output_format: "png",
    });

    return NextResponse.json({
      taskId: result.taskId,
      status: "processing",
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

    const result = await getTaskStatus(taskId);

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
