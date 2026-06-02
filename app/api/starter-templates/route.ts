/**
 * Starter Templates API — the platform-curated gallery.
 *
 * GET  /api/starter-templates            — list templates
 *        ?all=1  (super admin) returns inactive ones too, for the admin manager
 * POST /api/starter-templates            — create (super admin only)
 *
 * Reads are available to any authenticated user. Writes require super admin and
 * go through the service-role client (RLS blocks all other writes).
 */
import { NextRequest, NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { isSuperAdmin } from "@/lib/db/admin";

async function getUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

export async function GET(request: NextRequest) {
  try {
    const user = await getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const wantAll = new URL(request.url).searchParams.get("all") === "1";
    const admin = user.email ? await isSuperAdmin(user.email) : false;

    const service = await createServiceClient();
    let query = service
      .from("starter_templates")
      .select("*")
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: false });

    // Only super admins viewing the manager see inactive templates.
    if (!(wantAll && admin)) {
      query = query.eq("is_active", true);
    }

    const { data, error } = await query;
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ templates: data ?? [] });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (!user.email || !(await isSuperAdmin(user.email))) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    if (!body.name || !body.preview_image_url || !body.content_type) {
      return NextResponse.json(
        { error: "name, preview_image_url, and content_type are required" },
        { status: 400 }
      );
    }

    const service = await createServiceClient();
    const { data, error } = await service
      .from("starter_templates")
      .insert({
        name: body.name,
        description: body.description ?? null,
        category: body.category ?? null,
        preview_image_url: body.preview_image_url,
        content_type: body.content_type,
        channel: body.channel ?? null,
        style: body.style ?? null,
        scene_location: body.scene_location ?? null,
        headline: body.headline ?? null,
        subheadline: body.subheadline ?? null,
        cta: body.cta ?? null,
        prompt_notes: body.prompt_notes ?? null,
        sort_order: typeof body.sort_order === "number" ? body.sort_order : 0,
        is_active: body.is_active !== false,
        created_by: user.email,
      })
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ template: data });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
