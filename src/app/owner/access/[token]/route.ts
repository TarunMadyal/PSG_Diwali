import { createClient } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Secret access link for the owner dashboard.
 *
 * GET /owner/access/<OWNER_ACCESS_TOKEN>
 *
 * Validates the token, uses the Supabase Admin API to generate a magic-link
 * configured to redirect to /owner, then redirects the user to the Supabase
 * action link to establish the session.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token } = await params;

  const accessToken = process.env.OWNER_ACCESS_TOKEN;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const ownerEmail = process.env.OWNER_EMAIL ?? "tarunmadyal@gmail.com";

  if (!accessToken || !serviceRoleKey || !supabaseUrl || token !== accessToken) {
    return new NextResponse("Not Found", { status: 404 });
  }

  const admin = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { data, error } = await admin.auth.admin.generateLink({
    type: "magiclink",
    email: ownerEmail,
    options: {
      redirectTo: new URL("/auth/callback?next=/owner", request.url).toString(),
    },
  });

  if (error || !data.properties.action_link) {
    console.error("Owner access error:", error?.message);
    return new NextResponse("Not Found", { status: 404 });
  }

  return NextResponse.redirect(data.properties.action_link);
}
