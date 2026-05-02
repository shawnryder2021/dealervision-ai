import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

const IMGBB_API_URL = "https://api.imgbb.com/1/upload";

async function uploadBase64ToImgBB(base64NoPrefix: string): Promise<string> {
  const apiKey = process.env.IMGBB_API_KEY;
  if (!apiKey) throw new Error("IMGBB_API_KEY not configured");
  const fd = new FormData();
  fd.append("key", apiKey);
  fd.append("image", base64NoPrefix);
  const res = await fetch(IMGBB_API_URL, { method: "POST", body: fd });
  if (!res.ok) throw new Error(`ImgBB upload failed: ${await res.text()}`);
  const json = await res.json();
  if (!json.success || !json.data?.url) throw new Error("ImgBB upload returned no URL");
  return json.data.url as string;
}

export async function POST(request: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await ctx.params;
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const dataUrl: string | undefined = body.dataUrl;
    if (!dataUrl) return NextResponse.json({ error: "dataUrl required" }, { status: 400 });

    const match = dataUrl.match(/^data:image\/[a-z]+;base64,(.+)$/);
    const base64 = match ? match[1] : dataUrl;
    const url = await uploadBase64ToImgBB(base64);

    const { data: design, error: designErr } = await supabase
      .from("design_templates")
      .update({ exported_url: url, thumbnail_url: url, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select()
      .single();
    if (designErr) return NextResponse.json({ error: designErr.message }, { status: 500 });

    const { data: profile } = await supabase
      .from("profiles")
      .select("dealership_id")
      .eq("id", user.id)
      .single();

    // Best-effort asset row creation (do not fail the export if this errors).
    if (profile?.dealership_id) {
      try {
        await supabase.from("generated_assets").insert({
          dealership_id: profile.dealership_id,
          vehicle_id: design.vehicle_id,
          content_type: "custom",
          channel: design.canvas_size || "instagram-post",
          status: "completed",
          image_url: url,
          prompt: `Designed in Canvas: ${design.name}`,
          metadata: { source: "canvas", design_id: design.id },
        });
      } catch (e) {
        console.warn("Canvas asset row creation skipped:", e);
      }
    }

    return NextResponse.json({ url, design });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Export failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
