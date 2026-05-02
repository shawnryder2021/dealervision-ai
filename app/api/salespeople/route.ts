import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { slugify } from "@/lib/db/salespeople";

async function resolveDealershipId(request: NextRequest, supabase: Awaited<ReturnType<typeof createClient>>) {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  const { data: profile } = await supabase.from("profiles").select("dealership_id").eq("id", user.id).single();
  if (!profile?.dealership_id) return { error: NextResponse.json({ error: "No dealership" }, { status: 400 }) };
  const headerOverride = request.headers.get("X-Dealership-Id");
  if (headerOverride) {
    const { data: admin } = await supabase.from("super_admins").select("email").eq("email", user.email!).maybeSingle();
    if (admin) return { dealershipId: headerOverride, user };
  }
  return { dealershipId: profile.dealership_id as string, user };
}

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const r = await resolveDealershipId(request, supabase);
  if ("error" in r) return r.error;
  const { data, error } = await supabase
    .from("salespeople")
    .select("*")
    .eq("dealership_id", r.dealershipId)
    .order("full_name", { ascending: true });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ salespeople: data ?? [] });
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const r = await resolveDealershipId(request, supabase);
  if ("error" in r) return r.error;
  const body = await request.json();
  if (!body.full_name?.trim()) return NextResponse.json({ error: "full_name required" }, { status: 400 });

  const baseSlug = body.slug?.trim() || slugify(body.full_name);
  // Find unique slug
  let slug = baseSlug;
  let i = 2;
  while (true) {
    const { data: existing } = await supabase
      .from("salespeople")
      .select("id")
      .eq("dealership_id", r.dealershipId)
      .eq("slug", slug)
      .maybeSingle();
    if (!existing) break;
    slug = `${baseSlug}-${i++}`;
  }

  const { data, error } = await supabase
    .from("salespeople")
    .insert({
      dealership_id: r.dealershipId,
      slug,
      full_name: body.full_name.trim(),
      title: body.title || null,
      email: body.email || null,
      phone: body.phone || null,
      photo_url: body.photo_url || null,
      bio: body.bio || null,
      years_experience: body.years_experience ?? null,
      languages: Array.isArray(body.languages) ? body.languages : [],
      specialties: Array.isArray(body.specialties) ? body.specialties : [],
      social: body.social || {},
      is_active: body.is_active !== false,
    })
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ salesperson: data });
}
