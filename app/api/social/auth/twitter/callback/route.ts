import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { TwitterClient } from "@/lib/social/clients";
import { createSocialAccount } from "@/lib/db/social";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const error = searchParams.get("error");

  if (error) {
    return NextResponse.json(
      { error: `Twitter OAuth error: ${error}` },
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
    // Get the code verifier from session
    // In production, retrieve from session/secure storage
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

    // In production, retrieve stored codeVerifier from session
    // For now, we'll generate a dummy one (this won't work in real scenarios)
    const codeVerifier = request.cookies.get("twitter_code_verifier")?.value || "";

    if (!codeVerifier) {
      return NextResponse.json(
        { error: "Missing code verifier - session expired" },
        { status: 400 }
      );
    }

    // Exchange code for token
    const twitterClient = new TwitterClient();
    const { accessToken, userId } = await twitterClient.exchangeCodeForToken(
      code,
      codeVerifier
    );

    // Save to database (Twitter handle would come from user info endpoint in production)
    await createSocialAccount(
      profile.dealership_id,
      "twitter",
      userId,
      accessToken,
      undefined // Account name would be fetched from Twitter API
    );

    // Clear the code verifier cookie
    const response = NextResponse.redirect(
      `${request.nextUrl.origin}/dashboard/settings/social-accounts?success=twitter`
    );
    response.cookies.delete("twitter_code_verifier");

    return response;
  } catch (error) {
    const message = error instanceof Error ? error.message : "OAuth failed";
    return NextResponse.redirect(
      `${request.nextUrl.origin}/dashboard/settings/social-accounts?error=${encodeURIComponent(
        message
      )}`
    );
  }
}
