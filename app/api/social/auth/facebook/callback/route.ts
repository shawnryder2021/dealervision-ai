import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { MetaClient } from "@/lib/social/clients";
import { createSocialAccount } from "@/lib/db/social";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const error = searchParams.get("error");

  if (error) {
    return NextResponse.json(
      { error: `Facebook OAuth error: ${error}` },
      { status: 400 }
    );
  }

  if (!code || !state) {
    return NextResponse.json(
      { error: "Missing code or state" },
      { status: 400 }
    );
  }

  try {
    // Verify state from session/cache
    // In production, check against stored state for CSRF protection
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("dealership_id")
      .eq("id", user.id)
      .single();

    if (!profile) {
      return NextResponse.json(
        { error: "No dealership found" },
        { status: 400 }
      );
    }

    // Exchange code for token
    const metaClient = new MetaClient();
    const { accessToken, userId } = await metaClient.exchangeCodeForToken(code);

    // Get user's pages
    const pages = await metaClient.getPages(accessToken);

    if (pages.length === 0) {
      return NextResponse.json(
        { error: "No Facebook pages found. Please create a page first." },
        { status: 400 }
      );
    }

    // Use the first page's access token for posting
    const page = pages[0];

    // Save to database
    await createSocialAccount(
      profile.dealership_id,
      "facebook",
      page.id,
      page.access_token,
      page.name
    );

    // Redirect to settings page
    return NextResponse.redirect(
      `${request.nextUrl.origin}/dashboard/settings/social-accounts?success=facebook`
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "OAuth failed";
    return NextResponse.redirect(
      `${request.nextUrl.origin}/dashboard/settings/social-accounts?error=${encodeURIComponent(
        message
      )}`
    );
  }
}
