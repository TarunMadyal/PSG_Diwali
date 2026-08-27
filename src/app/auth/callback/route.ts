import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const code = searchParams.get("code");
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  // `next` is set by magic-link logins (e.g. /owner); absent for password recovery.
  const rawNext = searchParams.get("next") ?? "/auth/reset-password";
  // Only allow same-origin redirects to prevent open-redirect attacks.
  const next = rawNext.startsWith("/") ? rawNext : "/auth/reset-password";

  const fallback = NextResponse.redirect(new URL(next, origin));
  if (!code || !url || !key) return fallback;

  const response = NextResponse.redirect(new URL(next, origin));
  const supabase = createServerClient(url, key, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (entries) =>
        entries.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options),
        ),
    },
  });
  await supabase.auth.exchangeCodeForSession(code);
  return response;
}
