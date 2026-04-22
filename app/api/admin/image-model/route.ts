import { NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { isSuperAdmin } from "@/lib/db/admin";

const VALID_MODELS = ["kie-nano-banana", "openai-gpt-image-2"] as const;

export async function POST(request: Request) {
  try {
    // Verify caller is a super admin
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const isAdmin = await isSuperAdmin(user.email);
    if (!isAdmin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { dealershipId, model } = await request.json();

    if (!dealershipId) {
      return NextResponse.json({ error: "dealershipId is required" }, { status: 400 });
    }

    if (!VALID_MODELS.includes(model)) {
      return NextResponse.json({ error: `Invalid model. Must be one of: ${VALID_MODELS.join(", ")}` }, { status: 400 });
    }

    // Use service client to bypass RLS
    const service = await createServiceClient();
    const { error } = await service
      .from("dealerships")
      .update({ image_model: model })
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
