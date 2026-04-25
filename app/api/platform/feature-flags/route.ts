import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { normalizeFeatureFlags } from "@/lib/platform-feature-flags";

function isMissingPlatformSettingsError(errorMessage: string) {
  const normalized = errorMessage.toLowerCase();
  return (
    normalized.includes('relation "platform_settings"') ||
    normalized.includes("relation 'platform_settings'") ||
    normalized.includes('column "app_nav_flags"') ||
    normalized.includes("column 'app_nav_flags'") ||
    normalized.includes("platform_settings.app_nav_flags") ||
    normalized.includes("app_nav_flags does not exist") ||
    normalized.includes("could not find the 'app_nav_flags' column")
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
