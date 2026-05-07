import { NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { getImageProvider } from "@/lib/image-providers";
import { uploadToImgBB, uploadBufferToImgBB } from "@/lib/imgbb";
import { compositeLogoOntoImage } from "@/lib/image-compositor";

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
        const modelUsed = (metadata.model as string) || "openai-gpt-image-2";
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

          // Fire-and-forget: composite logo (if any) + upload to ImgBB in background
          (async () => {
            try {
              const adminSupabase = await createServiceClient();
              const { data: dealership } = await adminSupabase
                .from("dealerships")
                .select("logo_url")
                .eq("id", asset.dealership_id)
                .single();

              let finalUrl = originalUrl;
              if (dealership?.logo_url) {
                try {
                  console.log(`[poll] compositing logo for asset ${asset.id}: baseImage=${originalUrl}, logo=${dealership.logo_url}`);
                  const composited = await compositeLogoOntoImage({
                    baseImageUrl: originalUrl,
                    logoUrl: dealership.logo_url,
                  });
                  console.log(`[poll] composite succeeded, uploading ${composited.length} bytes to ImgBB`);
                  const imgbb = await uploadBufferToImgBB(composited);
                  finalUrl = imgbb.url;
                  console.log(`[poll] composite image hosted at ${finalUrl}`);
                } catch (e) {
                  console.error("[poll] composite failed, falling back:", e instanceof Error ? e.message : String(e));
                  const imgbb = await uploadToImgBB(originalUrl);
                  finalUrl = imgbb.url;
                  console.log(`[poll] fallback image hosted at ${finalUrl}`);
                }
              } else {
                console.log(`[poll] no logo for asset ${asset.id}, re-hosting original image`);
                const imgbb = await uploadToImgBB(originalUrl);
                finalUrl = imgbb.url;
                console.log(`[poll] original image hosted at ${finalUrl}`);
              }

              console.log(`[poll] updating asset ${asset.id} with final URL: ${finalUrl}`);
              await adminSupabase
                .from("generated_assets")
                .update({ image_url: finalUrl })
                .eq("id", asset.id);
            } catch (e) {
              console.error("[poll] background processing failed:", e instanceof Error ? e.message : String(e));
            }
          })();

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
