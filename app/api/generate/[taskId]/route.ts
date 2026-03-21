import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getTaskStatus } from "@/lib/kie";
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

    // Poll Kie.ai for status
    if (asset.kie_task_id) {
      try {
        const kieResult = await getTaskStatus(asset.kie_task_id);

        if (kieResult.status === "completed" && kieResult.output?.image_url) {
          // Upload to ImgBB for permanent storage
          let finalUrl = kieResult.output.image_url;
          try {
            const imgbb = await uploadToImgBB(finalUrl);
            finalUrl = imgbb.url;
          } catch (e) {
            console.error("ImgBB upload failed, using original URL:", e);
          }

          // Update asset with result
          const { data: updated } = await supabase
            .from("generated_assets")
            .update({
              status: "completed",
              image_url: finalUrl,
            })
            .eq("id", asset.id)
            .select()
            .single();

          return NextResponse.json(updated || asset);
        }

        if (kieResult.status === "failed") {
          await supabase
            .from("generated_assets")
            .update({ status: "failed" })
            .eq("id", asset.id);

          return NextResponse.json({ ...asset, status: "failed" });
        }
      } catch {
        // Kie.ai polling error, return current status
      }
    }

    return NextResponse.json(asset);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
