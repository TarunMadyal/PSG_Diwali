import { createClient } from "@supabase/supabase-js";
import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Secret access link for the owner dashboard.
 * GET /owner/access/<OWNER_ACCESS_TOKEN>
 *
 * The middleware (proxy.ts) exempts this path from the auth gate so it can
 * run before a session exists. It validates the secret token, generates a
 * one-time magic-link hash via the Admin API (never emailed), verifies it
 * server-side to obtain a real Supabase session, sets the session cookies on
 * the redirect response, then sends the browser straight to /owner.
 *
 * Required env vars (server-side only, never NEXT_PUBLIC_):
 *   OWNER_ACCESS_TOKEN        – the secret URL segment
 *   SUPABASE_SERVICE_ROLE_KEY – Supabase service-role key
 *   OWNER_EMAIL               – owner email (default: tarunmadyal@gmail.com)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token } = await params;

  const accessToken = process.env.OWNER_ACCESS_TOKEN;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  const ownerEmail = process.env.OWNER_EMAIL ?? "tarunmadyal@gmail.com";

  /* Wrong or missing token / config → silent 404 */
  if (!accessToken || !serviceRoleKey || !supabaseUrl || !publishableKey || token !== accessToken) {
    return new NextResponse("Not Found", { status: 404 });
  }

  /* Admin client: generate a fresh magic-link hash (never sent via email) */
  const admin = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { data: linkData, error: linkError } = await admin.auth.admin.generateLink({
    type: "magiclink",
    email: ownerEmail,
  });

  if (linkError || !linkData?.properties?.hashed_token) {
    console.error("Owner access – generateLink failed:", linkError?.message);
    return new NextResponse("Not Found", { status: 404 });
  }

  /* Prepare the redirect response first so the cookie setAll callback can
     attach session cookies to it before we return it. */
  const ownerUrl = new URL("/owner", request.url);
  const response = NextResponse.redirect(ownerUrl);

  /* SSR client: verify the OTP hash server-side → triggers setAll with
     the real Supabase session cookies. */
  const supabase = createServerClient(supabaseUrl, publishableKey, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (entries) =>
        entries.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options),
        ),
    },
  });

  const { error: verifyError } = await supabase.auth.verifyOtp({
    token_hash: linkData.properties.hashed_token,
    type: "magiclink",
  });

  if (verifyError) {
    console.error("Owner access – verifyOtp failed:", verifyError.message);
    return new NextResponse("Not Found", { status: 404 });
  }

  /* Session cookies are now on the response; browser lands on /owner
     with a valid Supabase session — no password required. */
  return response;
}
