import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getImageProvider } from "@/lib/image-providers";
import { uploadToImgBB } from "@/lib/imgbb";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ taskId: string }> }
) {
  try {
    const { taskId } = await params;
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // First check if we already have the result in our DB (from webhook)
    const { data: asset } = await supabase
      .from("generated_assets")
      .select("*")
      .eq("id", taskId)
      .single();

    if (!asset) {
      return NextResponse.json({ error: "Asset not found" }, { status: 404 });
    }

    // If already completed or failed, return from DB
    if (asset.status === "completed" || asset.status === "failed") {
      return NextResponse.json(asset);
    }

    // Poll the appropriate image provider for status
    if (asset.kie_task_id) {
      try {
        // Determine which provider to use
        // Prefer the model stored in metadata, fall back to dealership's configured model
        const metadata = asset.metadata as Record<string, unknown> || {};
        const modelUsed = (metadata.model as string) || "kie-nano-banana";
        const provider = getImageProvider(modelUsed as "kie-nano-banana" | "openai-gpt-image-2");

        const providerResult = await provider.getTaskStatus(asset.kie_task_id);

        if (providerResult.status === "completed" && providerResult.output?.image_url) {
          const originalUrl = providerResult.output.image_url;

          // Update asset with original URL immediately so user sees the image fast
          const { data: updated } = await supabase
            .from("generated_assets")
            .update({
              status: "completed",
              image_url: originalUrl,
            })
            .eq("id", asset.id)
            .select()
            .single();

          // Fire-and-forget: upload to ImgBB in background, then update DB with permanent URL
          uploadToImgBB(originalUrl)
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

          return NextResponse.json(updated || asset);
        }

        if (providerResult.status === "failed") {
          await supabase
            .from("generated_assets")
            .update({ status: "failed" })
            .eq("id", asset.id);

          return NextResponse.json({ ...asset, status: "failed" });
        }
      } catch {
        // Provider polling error, return current status
      }
    }

    return NextResponse.json(asset);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
