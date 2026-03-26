import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { uploadToImgBB } from "@/lib/imgbb";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const taskId = body.taskId || body.task_id;
    const status = body.status;
    const imageUrl = body.output?.image_url || body.image_url || body.output?.url;

    if (!taskId) {
      return NextResponse.json(
        { error: "Missing taskId" },
        { status: 400 }
      );
    }

    const supabase = await createServiceClient();

    // Find asset by kie_task_id
    const { data: asset } = await supabase
      .from("generated_assets")
      .select("id")
      .eq("kie_task_id", taskId)
      .single();

    if (!asset) {
      return NextResponse.json(
        { error: "Asset not found for task" },
        { status: 404 }
      );
    }

    if (status === "completed" && imageUrl) {
      // Save with original URL immediately
      await supabase
        .from("generated_assets")
        .update({
          status: "completed",
          image_url: imageUrl,
        })
        .eq("id", asset.id);

      // Fire-and-forget: upload to ImgBB in background, then update DB
      uploadToImgBB(imageUrl)
        .then((imgbb) => {
          supabase
            .from("generated_assets")
            .update({ image_url: imgbb.url })
            .eq("id", asset.id)
            .then(() => {});
        })
        .catch((e) =>
          console.error("Background ImgBB upload failed:", e)
        );
    } else if (status === "failed") {
      await supabase
        .from("generated_assets")
        .update({
          status: "failed",
          metadata: { error: body.error || "Generation failed" },
        })
        .eq("id", asset.id);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Webhook processing error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
