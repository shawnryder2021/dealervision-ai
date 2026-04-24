import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { normalizeFeatureFlags } from "@/lib/platform-feature-flags";

function isMissingPlatformSettingsError(errorMessage: string) {
  return (
    errorMessage.includes('relation "platform_settings"') ||
    errorMessage.includes('column "app_nav_flags"')
  );
}

export async function GET() {
  try {
    const service = await createServiceClient();
    const { data, error } = await service
      .from("platform_settings")
      .select("app_nav_flags")
      .eq("id", 1)
      .maybeSingle();

    if (error) {
      if (isMissingPlatformSettingsError(error.message)) {
        return NextResponse.json({ success: true, featureFlags: normalizeFeatureFlags(null) });
      }
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, featureFlags: normalizeFeatureFlags(data?.app_nav_flags) });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
