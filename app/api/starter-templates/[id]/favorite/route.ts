/**
 * Template favorites (dealership-scoped).
 *
 * POST   /api/starter-templates/[id]/favorite   — star a template
 * DELETE /api/starter-templates/[id]/favorite   — unstar
 */
import { NextRequest, NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";

async function resolveDealership() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("dealership_id")
    .eq("id", user.id)
    .single();

  return profile?.dealership_id ?? null;
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const dealershipId = await resolveDealership();
    if (!dealershipId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const service = await createServiceClient();
    const { error } = await service
      .from("template_favorites")
      .upsert(
        { dealership_id: dealershipId, template_id: id },
        { onConflict: "dealership_id,template_id", ignoreDuplicates: true }
      );

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ favorited: true });
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
    const dealershipId = await resolveDealership();
    if (!dealershipId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const service = await createServiceClient();
    const { error } = await service
      .from("template_favorites")
      .delete()
      .eq("dealership_id", dealershipId)
      .eq("template_id", id);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ favorited: false });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
