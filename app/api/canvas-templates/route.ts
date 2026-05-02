import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

async function resolveDealership(request: NextRequest, supabase: Awaited<ReturnType<typeof createClient>>) {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  const { data: profile } = await supabase
    .from("profiles")
    .select("dealership_id")
    .eq("id", user.id)
    .single();
  if (!profile?.dealership_id) return { error: NextResponse.json({ error: "No dealership" }, { status: 400 }) };
  const headerOverride = request.headers.get("X-Dealership-Id");
  if (headerOverride) {
    const { data: admin } = await supabase
      .from("super_admins")
      .select("email")
      .eq("email", user.email!)
      .maybeSingle();
    if (admin) return { dealershipId: headerOverride, userId: user.id };
  }
  return { dealershipId: profile.dealership_id as string, userId: user.id };
}

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const r = await resolveDealership(request, supabase);
  if ("error" in r) return r.error;
  const url = new URL(request.url);
  const kind = url.searchParams.get("kind");
  let q = supabase
    .from("design_templates")
    .select("*")
    .eq("dealership_id", r.dealershipId)
    .order("updated_at", { ascending: false });
  if (kind === "template" || kind === "draft") q = q.eq("kind", kind);
  const { data, error } = await q;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ designs: data ?? [] });
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const r = await resolveDealership(request, supabase);
  if ("error" in r) return r.error;
  const body = await request.json();
  const insert = {
    dealership_id: r.dealershipId,
    created_by: r.userId,
    name: body.name?.trim() || "Untitled design",
    kind: body.kind === "template" ? "template" : "draft",
    canvas_size: body.canvas_size || "instagram-post",
    canvas_width: body.canvas_width || 1080,
    canvas_height: body.canvas_height || 1080,
    vehicle_id: body.vehicle_id || null,
    elements: Array.isArray(body.elements) ? body.elements : [],
    thumbnail_url: body.thumbnail_url || null,
    background_color: body.background_color || body.metadata?.backgroundColor || "#ffffff",
  };
  const { data, error } = await supabase.from("design_templates").insert(insert).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ design: data });
}
