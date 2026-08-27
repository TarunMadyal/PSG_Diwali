import { createClient } from "@supabase/supabase-js";
import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Secret access link for the owner dashboard.
 *
 * GET /owner/access/<OWNER_ACCESS_TOKEN>
 *
 * Validates the token, uses the Supabase Admin API to generate a magic-link
 * token (never sent via email), exchanges it for a real auth session with
 * cookies, and redirects to /owner. All existing RLS policies and RPCs
 * continue to work because the browser holds a genuine Supabase session.
 *
 * Environment variables (server-side only, set in Vercel):
 *   OWNER_ACCESS_TOKEN        – the secret URL token
 *   SUPABASE_SERVICE_ROLE_KEY  – Supabase service-role key
 *   OWNER_EMAIL                – owner email (default: tarunmadyal@gmail.com)
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

  /* ── guard: misconfigured or wrong token → generic 404 ── */
  if (!accessToken || !serviceRoleKey || !supabaseUrl || !publishableKey) {
    return new NextResponse("Not Found", { status: 404 });
  }
  if (token !== accessToken) {
    return new NextResponse("Not Found", { status: 404 });
  }

  /* ── step 1: admin client generates a magic-link OTP (never emailed) ── */
  const admin = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { data: linkData, error: linkError } =
    await admin.auth.admin.generateLink({
      type: "magiclink",
      email: ownerEmail,
    });

  if (linkError || !linkData?.properties?.hashed_token) {
    console.error("Owner access: link generation failed", linkError?.message);
    return new NextResponse("Not Found", { status: 404 });
  }

  /* ── step 2: exchange the OTP for a real session with cookies ── */
  const redirectUrl = new URL("/owner", request.url);
  const response = NextResponse.redirect(redirectUrl);

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
    console.error("Owner access: OTP verify failed", verifyError.message);
    return new NextResponse("Not Found", { status: 404 });
  }

  return response;
}
