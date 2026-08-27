import { createClient } from "@supabase/supabase-js";
import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token } = await params;

  const accessToken = process.env.OWNER_ACCESS_TOKEN?.trim();
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim();
  const ownerEmail = process.env.OWNER_EMAIL?.trim() || "tarunmadyal@gmail.com";

  if (!accessToken) {
    return new NextResponse("Error: OWNER_ACCESS_TOKEN is not configured in Vercel.", { status: 500 });
  }
  if (!serviceRoleKey) {
    return new NextResponse("Error: SUPABASE_SERVICE_ROLE_KEY is not configured in Vercel.", { status: 500 });
  }
  if (!supabaseUrl || !publishableKey) {
    return new NextResponse("Error: Supabase URL or publishable key is not configured.", { status: 500 });
  }
  if (token.trim() !== accessToken) {
    return new NextResponse("Error: Invalid access token.", { status: 403 });
  }

  // 1. Admin client generates a magic-link token
  const admin = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { data: linkData, error: linkError } = await admin.auth.admin.generateLink({
    type: "magiclink",
    email: ownerEmail,
  });

  if (linkError || !linkData?.properties?.hashed_token) {
    return new NextResponse(`Error generating magic link: ${linkError?.message ?? "no hashed_token returned"}`, { status: 500 });
  }

  // 2. Prepare redirect response to /owner
  const ownerUrl = new URL("/owner", request.url);
  const response = NextResponse.redirect(ownerUrl);

  // 3. Create SSR server client and exchange the OTP server-side to set cookies directly
  const supabase = createServerClient(supabaseUrl, publishableKey, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (entries) =>
        entries.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options),
        ),
    },
  });

  const verifyResult = await supabase.auth.verifyOtp({
    token_hash: linkData.properties.hashed_token,
    type: "magiclink",
  });

  let session = verifyResult.data?.session;

  if (verifyResult.error) {
    // Try type: "email" if magiclink type is rejected
    const retry = await supabase.auth.verifyOtp({
      token_hash: linkData.properties.hashed_token,
      type: "email",
    });
    if (retry.error) {
      return new NextResponse(`Error verifying session OTP: ${verifyResult.error.message} (retry: ${retry.error.message})`, { status: 500 });
    }
    session = retry.data?.session;
  }

  if (!session) {
    return new NextResponse("Error: No session returned from Supabase.", { status: 500 });
  }

  return response;
}
