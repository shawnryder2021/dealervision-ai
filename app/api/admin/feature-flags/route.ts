import { NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { isSuperAdmin } from "@/lib/db/admin";
import { normalizeFeatureFlags } from "@/lib/platform-feature-flags";

function isMissingPlatformSettingsError(errorMessage: string) {
  return (
    errorMessage.includes("relation \"platform_settings\"") ||
    errorMessage.includes("column \"app_nav_flags\"")
  );
}

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

export async function GET() {
  try {
    const auth = await requireSuperAdmin();
    if ("error" in auth) return auth.error;

    const supabase = await createClient();
    const { data, error } = await supabase
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

export async function POST(request: Request) {
  try {
    const auth = await requireSuperAdmin();
    if ("error" in auth) return auth.error;
    const { user } = auth;

    const body = await request.json();
    const featureFlags = normalizeFeatureFlags(body?.featureFlags);

    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return NextResponse.json(
        {
          error:
            "Server configuration is missing SUPABASE_SERVICE_ROLE_KEY. Add it to enable saving feature flags.",
        },
        { status: 500 }
      );
    }

    const service = await createServiceClient();
    const payload = {
      app_nav_flags: featureFlags,
      updated_at: new Date().toISOString(),
      updated_by: user.email,
    };

    const { data: existingSettings, error: loadError } = await service
      .from("platform_settings")
      .select("id")
      .eq("id", 1)
      .maybeSingle();

    if (loadError) {
      if (isMissingPlatformSettingsError(loadError.message)) {
        return NextResponse.json(
          {
            error:
              "The platform_settings table is missing required columns. Run the latest Supabase migrations and try again.",
          },
          { status: 500 }
        );
      }
      return NextResponse.json({ error: loadError.message }, { status: 500 });
    }

    const { error } = existingSettings
      ? await service.from("platform_settings").update(payload).eq("id", 1)
      : await service.from("platform_settings").insert({ id: 1, ...payload });

    if (error) {
      if (isMissingPlatformSettingsError(error.message)) {
        return NextResponse.json(
          {
            error:
              "The platform_settings table is missing required columns. Run the latest Supabase migrations and try again.",
          },
          { status: 500 }
        );
      }
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, featureFlags });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
