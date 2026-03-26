import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * Handles the OAuth/email-confirmation code exchange.
 * Supabase redirects here after a user clicks their confirmation email link.
 * We exchange the one-time `code` for a real session, then send the user on.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/dashboard";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }

    console.error("[auth/callback] Code exchange failed:", error.message);
  }

  // Something went wrong — send to login with an error hint
  return NextResponse.redirect(`${origin}/login?error=confirmation_failed`);
}
