import { NextResponse } from "next/server";

const IMGBB_API_URL = "https://api.imgbb.com/1/upload";

export async function POST(request: Request) {
  try {
    const apiKey = process.env.IMGBB_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "Image upload service not configured" },
        { status: 500 }
      );
    }

    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Convert file to base64
    const bytes = await file.arrayBuffer();
    const base64 = Buffer.from(bytes).toString("base64");

    // Upload to ImgBB
    const imgbbForm = new FormData();
    imgbbForm.append("key", apiKey);
    imgbbForm.append("image", base64);
    imgbbForm.append("name", file.name.replace(/\.[^.]+$/, ""));

    const response = await fetch(IMGBB_API_URL, {
      method: "POST",
      body: imgbbForm,
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`ImgBB upload failed: ${response.status} - ${error}`);
    }

    const json = await response.json();
    if (!json.success || !json.data?.url) {
      throw new Error(
        `ImgBB upload error: ${json.error?.message || "Unknown error"}`
      );
    }

    return NextResponse.json({
      url: json.data.url,
      display_url: json.data.display_url,
      thumbnail_url: json.data.thumb?.url || json.data.display_url,
      delete_url: json.data.delete_url,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Upload failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
