import { NextRequest, NextResponse } from "next/server";
import { MetaClient, TwitterClient, generatePKCE } from "@/lib/social/clients";
import crypto from "crypto";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const provider = searchParams.get("provider");

  if (!provider || !["facebook", "instagram", "twitter"].includes(provider)) {
    return NextResponse.json(
      { error: "Invalid provider" },
      { status: 400 }
    );
  }

  const state = crypto.randomBytes(32).toString("hex");
  const response = new NextResponse();

  try {
    if (provider === "facebook" || provider === "instagram") {
      const metaClient = new MetaClient();
      const authUrl = metaClient.getAuthorizationUrl(state);

      // Store state in a short-lived cookie for CSRF protection
      const res = NextResponse.json({ authUrl });
      res.cookies.set("oauth_state", state, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 600, // 10 minutes
      });

      return res;
    } else if (provider === "twitter") {
      const { codeChallenge, codeVerifier } = generatePKCE();
      const twitterClient = new TwitterClient();
      const authUrl = twitterClient.getAuthorizationUrl(state, codeChallenge);

      const res = NextResponse.json({ authUrl });

      // Store state and code verifier in cookies
      res.cookies.set("oauth_state", state, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 600,
      });

      res.cookies.set("twitter_code_verifier", codeVerifier, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 600,
      });

      return res;
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Auth URL generation failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }

  return NextResponse.json({ error: "Unknown error" }, { status: 500 });
}
