import { NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { isSuperAdmin } from "@/lib/db/admin";

const VALID_MODELS = ["kie-nano-banana", "openai-gpt-image-2"] as const;

async function requireSuperAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.email) {
    return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }

  const isAdmin = await isSuperAdmin(user.email);
  if (!isAdmin) {
    return { error: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
  }

  return { user };
}

async function getGlobalModel(service: Awaited<ReturnType<typeof createServiceClient>>) {
  const { data } = await service
    .from("platform_settings")
    .select("default_image_model")
    .eq("id", 1)
    .maybeSingle();

  return (data?.default_image_model || "openai-gpt-image-2") as (typeof VALID_MODELS)[number];
}

export async function GET() {
  try {
    const auth = await requireSuperAdmin();
    if ("error" in auth) return auth.error;

    const service = await createServiceClient();
    const globalModel = await getGlobalModel(service);

    return NextResponse.json({ success: true, globalModel });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const auth = await requireSuperAdmin();
    if ("error" in auth) return auth.error;
    const { user } = auth;

    const { dealershipId, model } = await request.json();

    // model: null is allowed when clearing a per-dealership override
    const clearOverride = model === null;
    if (!clearOverride && !VALID_MODELS.includes(model)) {
      return NextResponse.json({ error: `Invalid model. Must be one of: ${VALID_MODELS.join(", ")} (or null to clear)` }, { status: 400 });
    }

    const service = await createServiceClient();

    if (!dealershipId) {
      if (clearOverride) {
        return NextResponse.json({ error: "Global default cannot be null" }, { status: 400 });
      }
      const { error } = await service
        .from("platform_settings")
        .upsert(
          {
            id: 1,
            default_image_model: model,
            updated_at: new Date().toISOString(),
            updated_by: user.email,
          },
          { onConflict: "id" }
        );

      if (error) {
        console.error("Failed to update global image model:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json({ success: true, globalModel: model });
    }

    const { error } = await service
      .from("dealerships")
      .update({ image_model: clearOverride ? null : model })
      .eq("id", dealershipId);

    if (error) {
      console.error("Failed to update image model:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, dealershipId, model });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
