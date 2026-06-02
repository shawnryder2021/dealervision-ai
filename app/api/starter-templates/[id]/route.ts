/**
 * Starter Template item API (super admin only).
 *
 * PATCH  /api/starter-templates/[id]   — update fields / toggle is_active
 * DELETE /api/starter-templates/[id]   — remove a template
 *
 * NOTE (Next.js 16): route `params` is a Promise and must be awaited.
 */
import { NextRequest, NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { isSuperAdmin } from "@/lib/db/admin";

async function requireAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false as const, status: 401, error: "Unauthorized" };
  if (!user.email || !(await isSuperAdmin(user.email))) {
    return { ok: false as const, status: 403, error: "Forbidden" };
  }
  return { ok: true as const };
}

const EDITABLE_FIELDS = [
  "name",
  "description",
  "category",
  "preview_image_url",
  "content_type",
  "channel",
  "style",
  "scene_location",
  "headline",
  "subheadline",
  "cta",
  "prompt_notes",
  "sort_order",
  "is_active",
] as const;

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAdmin();
    if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

    const { id } = await params;
    const body = await request.json();

    const update: Record<string, unknown> = { updated_at: new Date().toISOString() };
    for (const key of EDITABLE_FIELDS) {
      if (key in body) update[key] = body[key];
    }

    const service = await createServiceClient();
    const { data, error } = await service
      .from("starter_templates")
      .update(update)
      .eq("id", id)
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ template: data });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAdmin();
    if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

    const { id } = await params;
    const service = await createServiceClient();
    const { error } = await service.from("starter_templates").delete().eq("id", id);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
