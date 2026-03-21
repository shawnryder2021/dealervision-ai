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
  const publicPaths = ["/", "/login", "/signup", "/api/webhooks", "/api/demo-generate", "/api/vin-decode"];
  const isPublicPath = publicPaths.some(
    (path) => request.nextUrl.pathname === path ||
      request.nextUrl.pathname.startsWith("/api/webhooks") ||
      request.nextUrl.pathname.startsWith("/api/demo-generate") ||
      request.nextUrl.pathname.startsWith("/api/vin-decode")
  );

  if (!user && !isPublicPath && !isDemo) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}
