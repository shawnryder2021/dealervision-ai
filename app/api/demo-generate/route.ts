import { NextResponse } from "next/server";
import { createImageTask, getTaskStatus } from "@/lib/kie";
import { uploadToImgBB } from "@/lib/imgbb";

export async function POST(request: Request) {
  try {
    const { prompt, aspect_ratio, resolution } = await request.json();

    if (!prompt) {
      return NextResponse.json({ error: "Prompt is required" }, { status: 400 });
    }

    const result = await createImageTask({
      prompt,
      aspect_ratio: aspect_ratio || "1:1",
      resolution: resolution || "1K",
      output_format: "png",
    });

    return NextResponse.json({
      taskId: result.taskId,
      status: "processing",
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Generation failed";
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

    // Upload completed images to ImgBB for permanent storage
    if (result.status === "completed" && result.output?.image_url) {
      try {
        const imgbb = await uploadToImgBB(result.output.image_url);
        result.output.image_url = imgbb.url;
      } catch (e) {
        console.error("ImgBB upload failed, using original URL:", e);
      }
    }

    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Poll failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
