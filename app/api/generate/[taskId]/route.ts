import { NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { getImageProvider } from "@/lib/image-providers";
import { uploadToImgBB, uploadBufferToImgBB } from "@/lib/imgbb";
import { compositeLogoOntoImage } from "@/lib/image-compositor";

/**
 * Composite logo onto image and re-host to ImgBB — runs synchronously
 * so it completes before the serverless function returns.
 */
async function processAndHostImage(
  assetId: string,
  originalUrl: string,
  dealershipId: string,
): Promise<string> {
  const adminSupabase = await createServiceClient();
  const { data: dealership } = await adminSupabase
    .from("dealerships")
    .select("logo_url")
    .eq("id", dealershipId)
    .single();

  let finalUrl = originalUrl;

  if (dealership?.logo_url) {
    try {
      console.log(`[poll] compositing logo for asset ${assetId}: logo=${dealership.logo_url}`);
      const composited = await compositeLogoOntoImage({
        baseImageUrl: originalUrl,
        logoUrl: dealership.logo_url,
      });
      console.log(`[poll] composite succeeded (${composited.length} bytes), uploading to ImgBB`);
      const imgbb = await uploadBufferToImgBB(composited);
      finalUrl = imgbb.url;
      console.log(`[poll] composite hosted at ${finalUrl}`);
    } catch (e) {
      console.error("[poll] composite failed, falling back to plain re-host:", e instanceof Error ? e.message : String(e));
      try {
        const imgbb = await uploadToImgBB(originalUrl);
        finalUrl = imgbb.url;
        console.log(`[poll] fallback image hosted at ${finalUrl}`);
      } catch (e2) {
        console.error("[poll] ImgBB fallback also failed:", e2 instanceof Error ? e2.message : String(e2));
      }
    }
  } else {
    console.log(`[poll] no logo for asset ${assetId}, re-hosting original`);
    try {
      const imgbb = await uploadToImgBB(originalUrl);
      finalUrl = imgbb.url;
      console.log(`[poll] original hosted at ${finalUrl}`);
    } catch (e) {
      console.error("[poll] ImgBB upload failed:", e instanceof Error ? e.message : String(e));
    }
  }

  // Update the DB with the final permanent URL
  if (finalUrl !== originalUrl) {
    console.log(`[poll] updating asset ${assetId} → ${finalUrl}`);
    await adminSupabase
      .from("generated_assets")
      .update({ image_url: finalUrl })
      .eq("id", assetId);
  }

  return finalUrl;
}

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
        const metadata = asset.metadata as Record<string, unknown> || {};
        const modelUsed = (metadata.model as string) || "openai-gpt-image-2";
        const provider = getImageProvider(modelUsed as "kie-nano-banana" | "openai-gpt-image-2");

        const providerResult = await provider.getTaskStatus(asset.kie_task_id);

        if (providerResult.status === "completed" && providerResult.output?.image_url) {
          const originalUrl = providerResult.output.image_url;

          // Mark completed with original URL first so status is visible immediately
          await supabase
            .from("generated_assets")
            .update({ status: "completed", image_url: originalUrl })
            .eq("id", asset.id);

          // Run composite + ImgBB upload SYNCHRONOUSLY before returning — this
          // is required in serverless (Netlify) because fire-and-forget tasks are
          // killed the moment the response is sent.
          const finalUrl = await processAndHostImage(
            asset.id,
            originalUrl,
            asset.dealership_id,
          );

          // Return the asset with the final (composited) URL
          const finalAsset = { ...asset, status: "completed", image_url: finalUrl };
          return NextResponse.json(finalAsset);
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
