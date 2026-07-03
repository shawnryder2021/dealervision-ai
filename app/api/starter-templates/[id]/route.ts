/**
 * Starter Template item API.
 *
 * PATCH  /api/starter-templates/[id]   — update fields / toggle is_active
 * DELETE /api/starter-templates/[id]   — remove a template
 *
 * Allowed for: super admins (any row) OR the owning dealership (its own rows).
 * NOTE (Next.js 16): route `params` is a Promise and must be awaited.
 */
import { NextRequest, NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { isSuperAdmin } from "@/lib/db/admin";

async function resolveCaller() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { user: null, dealershipId: null as string | null, isAdmin: false };

  const isAdmin = user.email ? await isSuperAdmin(user.email) : false;
  const { data: profile } = await supabase
    .from("profiles")
    .select("dealership_id")
    .eq("id", user.id)
    .single();

  return { user, dealershipId: profile?.dealership_id ?? null, isAdmin };
}

/** Loads the row and checks the caller may modify it. */
async function authorize(id: string) {
  const { user, dealershipId, isAdmin } = await resolveCaller();
  if (!user) return { ok: false as const, status: 401, error: "Unauthorized" };

  const service = await createServiceClient();
  const { data: row } = await service
    .from("starter_templates")
    .select("id, dealership_id")
    .eq("id", id)
    .maybeSingle();

  if (!row) return { ok: false as const, status: 404, error: "Not found" };

  const isOwner = !!row.dealership_id && row.dealership_id === dealershipId;
  if (!isAdmin && !isOwner) {
    return { ok: false as const, status: 403, error: "Forbidden" };
  }
  return { ok: true as const, service, isAdmin };
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
  "collection",
  "starts_at",
  "ends_at",
  "channels",
  "sort_order",
  "is_active",
] as const;

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const auth = await authorize(id);
    if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

    const body = await request.json();
    const update: Record<string, unknown> = { updated_at: new Date().toISOString() };
    for (const key of EDITABLE_FIELDS) {
      if (key in body) update[key] = body[key];
    }

    const { data, error } = await auth.service
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
    const { id } = await params;
    const auth = await authorize(id);
    if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

    const { error } = await auth.service.from("starter_templates").delete().eq("id", id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
