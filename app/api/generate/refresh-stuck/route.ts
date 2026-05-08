/**
 * Refresh Stuck Assets
 *
 * Finds any "processing" or "pending" assets older than 30s for the user's
 * dealership and re-checks their status with the image provider. Updates
 * the DB if the provider says they're complete (or failed).
 *
 * Called from the library page on load so users never see permanently stuck
 * spinners when the webhook never fired.
 */

import { NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { getImageProvider } from "@/lib/image-providers";
import { uploadToImgBB, uploadBufferToImgBB } from "@/lib/imgbb";
import { compositeLogoOntoImage } from "@/lib/image-compositor";
import type { ImageModelOption } from "@/lib/db/image-generation";

export async function POST() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("dealership_id")
      .eq("id", user.id)
      .single();

    if (!profile?.dealership_id) {
      return NextResponse.json({ refreshed: 0, updated: 0 });
    }

    // Cap at 20 stuck assets per request to keep this endpoint fast
    const cutoff = new Date(Date.now() - 30 * 1000).toISOString();
    const { data: stuck } = await supabase
      .from("generated_assets")
      .select("*")
      .eq("dealership_id", profile.dealership_id)
      .in("status", ["processing", "pending"])
      .not("kie_task_id", "is", null)
      .lt("created_at", cutoff)
      .order("created_at", { ascending: false })
      .limit(20);

    if (!stuck || stuck.length === 0) {
      return NextResponse.json({ refreshed: 0, updated: 0 });
    }

    const adminSupabase = await createServiceClient();
    let updated = 0;

    await Promise.all(
      stuck.map(async (asset) => {
        try {
          const metadata = (asset.metadata as Record<string, unknown>) || {};
          const modelUsed =
            (metadata.model as ImageModelOption) || "openai-gpt-image-2";
          const provider = getImageProvider(modelUsed);

          const result = await provider.getTaskStatus(asset.kie_task_id!);

          if (result.status === "completed" && result.output?.image_url) {
            const originalUrl = result.output.image_url;
            await adminSupabase
              .from("generated_assets")
              .update({ status: "completed", image_url: originalUrl })
              .eq("id", asset.id);
            updated++;

            // Look up dealership logo for the composite step
            const { data: dealership } = await adminSupabase
              .from("dealerships")
              .select("logo_url")
              .eq("id", asset.dealership_id)
              .single();

            // Run composite + ImgBB upload SYNCHRONOUSLY — fire-and-forget is
            // killed by serverless (Netlify) before it completes.
            try {
              let finalUrl = originalUrl;
              if (dealership?.logo_url) {
                try {
                  const composited = await compositeLogoOntoImage({
                    baseImageUrl: originalUrl,
                    logoUrl: dealership.logo_url,
                  });
                  const imgbb = await uploadBufferToImgBB(composited);
                  finalUrl = imgbb.url;
                  console.log(`[refresh-stuck] composite succeeded for asset ${asset.id}: ${finalUrl}`);
                } catch (e) {
                  console.error("[refresh-stuck] composite failed, using base:", e instanceof Error ? e.message : String(e));
                  const imgbb = await uploadToImgBB(originalUrl);
                  finalUrl = imgbb.url;
                }
              } else {
                const imgbb = await uploadToImgBB(originalUrl);
                finalUrl = imgbb.url;
              }
              if (finalUrl !== originalUrl) {
                await adminSupabase
                  .from("generated_assets")
                  .update({ image_url: finalUrl })
                  .eq("id", asset.id);
              }
            } catch (e) {
              console.error("[refresh-stuck] processing failed:", e instanceof Error ? e.message : String(e));
            }
          } else if (result.status === "failed") {
            await adminSupabase
              .from("generated_assets")
              .update({
                status: "failed",
                metadata: {
                  ...(asset.metadata || {}),
                  error: result.error || "Generation failed",
                },
              })
              .eq("id", asset.id);
            updated++;
          }
        } catch (err) {
          console.error(
            `[refresh-stuck] failed to check asset ${asset.id}:`,
            err
          );
        }
      })
    );

    return NextResponse.json({ refreshed: stuck.length, updated });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Internal server error";
    console.error("[refresh-stuck] error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
