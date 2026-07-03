/**
 * Starter Templates API — the template gallery.
 *
 * GET  /api/starter-templates
 *        Returns active platform templates (dealership_id NULL) + the caller's
 *        own dealer-saved templates, filtered to their visibility window, with
 *        a `favorited` flag per row.
 *        ?all=1  (super admin) returns everything, including inactive/out-of-window.
 * POST /api/starter-templates
 *        Super admins create GLOBAL templates (dealership_id NULL).
 *        Dealers create their OWN templates ("Save as Template") — dealership_id
 *        is forced to the caller's dealership.
 *
 * Writes go through the service-role client; RLS blocks all other writes.
 */
import { NextRequest, NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { isSuperAdmin } from "@/lib/db/admin";

async function resolveCaller(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { user: null, dealershipId: null as string | null, isAdmin: false };

  const isAdmin = user.email ? await isSuperAdmin(user.email) : false;
  const headerDealershipId = request.headers.get("X-Dealership-Id");
  if (isAdmin && headerDealershipId) {
    return { user, dealershipId: headerDealershipId, isAdmin };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("dealership_id")
    .eq("id", user.id)
    .single();

  return { user, dealershipId: profile?.dealership_id ?? null, isAdmin };
}

export async function GET(request: NextRequest) {
  try {
    const { user, dealershipId, isAdmin } = await resolveCaller(request);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const wantAll = new URL(request.url).searchParams.get("all") === "1";
    const service = await createServiceClient();

    let query = service
      .from("starter_templates")
      .select("*")
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: false });

    if (wantAll && isAdmin) {
      // Admin manager: everything.
    } else {
      const nowIso = new Date().toISOString();
      query = query
        .eq("is_active", true)
        .or(`starts_at.is.null,starts_at.lte.${nowIso}`)
        .or(`ends_at.is.null,ends_at.gte.${nowIso}`);
      // Global templates + the caller's own.
      query = dealershipId
        ? query.or(`dealership_id.is.null,dealership_id.eq.${dealershipId}`)
        : query.is("dealership_id", null);
    }

    const { data, error } = await query;
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    // Attach favorited flags for the caller's dealership.
    let favoriteIds = new Set<string>();
    if (dealershipId) {
      const { data: favs } = await service
        .from("template_favorites")
        .select("template_id")
        .eq("dealership_id", dealershipId);
      favoriteIds = new Set((favs ?? []).map((f) => f.template_id as string));
    }

    const templates = (data ?? []).map((t) => ({
      ...t,
      favorited: favoriteIds.has(t.id as string),
    }));

    return NextResponse.json({ templates });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { user, dealershipId, isAdmin } = await resolveCaller(request);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    if (!body.name || !body.preview_image_url || !body.content_type) {
      return NextResponse.json(
        { error: "name, preview_image_url, and content_type are required" },
        { status: 400 }
      );
    }

    // Admins create global templates; dealers always create their own.
    let ownerDealershipId: string | null;
    if (isAdmin) {
      ownerDealershipId = body.dealership_id ?? null;
    } else {
      if (!dealershipId) {
        return NextResponse.json({ error: "No dealership on profile" }, { status: 403 });
      }
      ownerDealershipId = dealershipId;
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
        collection: body.collection ?? null,
        starts_at: body.starts_at ?? null,
        ends_at: body.ends_at ?? null,
        channels: Array.isArray(body.channels) && body.channels.length ? body.channels : null,
        dealership_id: ownerDealershipId,
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
