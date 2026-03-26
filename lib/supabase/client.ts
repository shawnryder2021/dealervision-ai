import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey || !supabaseUrl.startsWith("http")) {
    // Return a mock during build/SSG — real client is only needed at runtime.
    // Using a Proxy so any property access throws a clear error instead of
    // "Cannot read properties of null" which is hard to debug.
    return new Proxy({} as ReturnType<typeof createBrowserClient>, {
      get(_target, prop) {
        if (prop === "then") return undefined; // not a Promise
        throw new Error(
          `Supabase is not configured. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to your environment variables (Netlify → Site Settings → Environment Variables).`
        );
      },
    });
  }

  return createBrowserClient(supabaseUrl, supabaseKey);
}
