import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

async function authed(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  return { supabase, user };
}

export async function GET(request: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const a = await authed(request);
  if ("error" in a) return a.error;
  const { data, error } = await a.supabase.from("design_templates").select("*").eq("id", id).maybeSingle();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!data) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ design: data });
}

export async function PATCH(request: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const a = await authed(request);
  if ("error" in a) return a.error;
  const body = await request.json();
  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
  for (const key of [
    "name",
    "kind",
    "thumbnail_url",
    "exported_url",
    "canvas_size",
    "canvas_width",
    "canvas_height",
    "vehicle_id",
    "elements",
    "background_color",
  ]) {
    if (key in body) updates[key] = body[key];
  }
  if (body.metadata?.backgroundColor && !("background_color" in updates)) {
    updates.background_color = body.metadata.backgroundColor;
  }
  const { data, error } = await a.supabase
    .from("design_templates")
    .update(updates)
    .eq("id", id)
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ design: data });
}

export async function DELETE(request: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const a = await authed(request);
  if ("error" in a) return a.error;
  const { error } = await a.supabase.from("design_templates").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
