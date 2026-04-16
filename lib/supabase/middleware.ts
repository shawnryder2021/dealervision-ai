import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey || !supabaseUrl.startsWith("http")) {
    return supabaseResponse;
  }

  const supabase = createServerClient(
    supabaseUrl,
    supabaseKey,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Allow demo mode (skip auth check when ?demo param is present)
  const isDemo = request.nextUrl.searchParams.has("demo");

  // Redirect unauthenticated users to login (except public routes)
  const publicPaths = ["/", "/login", "/signup", "/auth/callback"];
  const publicPrefixes = ["/api/webhooks", "/api/demo-generate", "/api/vin-decode", "/api/onboard", "/api/auth/", "/p/", "/resources"];
  const isPublicPath =
    publicPaths.includes(request.nextUrl.pathname) ||
    publicPrefixes.some((prefix) => request.nextUrl.pathname.startsWith(prefix));

  if (!user && !isPublicPath && !isDemo) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  // ─── Admin route protection ────────────────────────────────────────────────
  // Verify user is super admin before allowing access to /dashboard/admin/*
  if (user && request.nextUrl.pathname.startsWith("/dashboard/admin")) {
    const { data: superAdmin } = await supabase
      .from("super_admins")
      .select("id")
      .eq("email", user.email)
      .is("revoked_at", null)
      .single();

    // Not a super admin - deny access
    if (!superAdmin) {
      const url = request.nextUrl.clone();
      url.pathname = "/dashboard";
      return NextResponse.redirect(url);
    }
  }

  return supabaseResponse;
}
