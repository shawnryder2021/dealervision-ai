import { NextResponse } from "next/server";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const imageUrl = searchParams.get("url");

    if (!imageUrl) {
      return NextResponse.json({ error: "url parameter required" }, { status: 400 });
    }

    // Fetch the image server-side (no CORS issues)
    const res = await fetch(imageUrl);
    if (!res.ok) {
      return NextResponse.json({ error: "Failed to fetch image" }, { status: 502 });
    }

    const contentType = res.headers.get("content-type") || "image/png";
    const buffer = await res.arrayBuffer();

    return new NextResponse(buffer, {
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": `attachment; filename="dealeradgen-${Date.now()}.png"`,
        "Cache-Control": "no-cache",
      },
    });
  } catch {
    return NextResponse.json({ error: "Download failed" }, { status: 500 });
  }
}
