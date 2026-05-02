import { NextResponse, type NextRequest } from "next/server";

// Streams a remote image with CORS headers so Konva can load it with
// `crossOrigin="anonymous"` and the canvas can still be exported via
// `toDataURL` without tainting. Used by the Design Studio for any image
// element (library asset, uploaded photo, vehicle photo).

export async function GET(request: NextRequest) {
  try {
    const url = request.nextUrl.searchParams.get("url");
    if (!url) return NextResponse.json({ error: "url required" }, { status: 400 });
    let parsed: URL;
    try {
      parsed = new URL(url);
    } catch {
      return NextResponse.json({ error: "invalid url" }, { status: 400 });
    }
    if (parsed.protocol !== "https:" && parsed.protocol !== "http:") {
      return NextResponse.json({ error: "unsupported protocol" }, { status: 400 });
    }

    const upstream = await fetch(parsed.toString(), {
      headers: { "User-Agent": "DealerVisionDesigner/1.0" },
    });
    if (!upstream.ok) {
      return NextResponse.json({ error: `upstream ${upstream.status}` }, { status: 502 });
    }

    const contentType = upstream.headers.get("content-type") || "image/png";
    const body = await upstream.arrayBuffer();
    return new NextResponse(body, {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=600",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, OPTIONS",
      },
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "proxy failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
    },
  });
}
