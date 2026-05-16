import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isSuperAdmin } from "@/lib/db/admin";
import {
  createReferenceVehicle,
  listReferenceVehicles,
} from "@/lib/db/reference-vehicles";

/** Returns the authed user only if they are a super admin. */
async function requireSuperAdmin(): Promise<
  | { ok: true; email: string }
  | { ok: false; response: NextResponse }
> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.email) {
    return {
      ok: false,
      response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }
  if (!(await isSuperAdmin(user.email))) {
    return {
      ok: false,
      response: NextResponse.json({ error: "Forbidden" }, { status: 403 }),
    };
  }
  return { ok: true, email: user.email };
}

export async function GET(request: NextRequest) {
  const auth = await requireSuperAdmin();
  if (!auth.ok) return auth.response;

  try {
    const { searchParams } = new URL(request.url);
    const make = searchParams.get("make") ?? undefined;
    const model = searchParams.get("model") ?? undefined;
    const yearParam = searchParams.get("year");
    const year = yearParam ? parseInt(yearParam, 10) : undefined;

    const vehicles = await listReferenceVehicles({ make, model, year });
    return NextResponse.json({ vehicles });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to list reference vehicles";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const auth = await requireSuperAdmin();
  if (!auth.ok) return auth.response;

  try {
    const body = await request.json();
    const { year, make, model, trim, color, image_url, thumbnail_url, notes } = body;

    // Validate required fields
    if (!year || typeof year !== "number" || year < 1900 || year > 2100) {
      return NextResponse.json({ error: "Valid year is required" }, { status: 400 });
    }
    if (!make || typeof make !== "string" || !make.trim()) {
      return NextResponse.json({ error: "Make is required" }, { status: 400 });
    }
    if (!model || typeof model !== "string" || !model.trim()) {
      return NextResponse.json({ error: "Model is required" }, { status: 400 });
    }
    if (!image_url || typeof image_url !== "string" || !image_url.trim()) {
      return NextResponse.json({ error: "Image URL is required" }, { status: 400 });
    }

    const vehicle = await createReferenceVehicle(
      {
        year,
        make,
        model,
        trim,
        color,
        image_url,
        thumbnail_url,
        notes,
      },
      auth.email
    );

    return NextResponse.json({ vehicle });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to create reference vehicle";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
