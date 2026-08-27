import { createClient } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token } = await params;

  const accessToken = process.env.OWNER_ACCESS_TOKEN?.trim();
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const ownerEmail = (process.env.OWNER_EMAIL?.trim()) || "tarunmadyal@gmail.com";

  if (!accessToken) {
    return new NextResponse("Error: OWNER_ACCESS_TOKEN is not configured in Vercel environment variables.", { status: 500 });
  }
  if (!serviceRoleKey) {
    return new NextResponse("Error: SUPABASE_SERVICE_ROLE_KEY is not configured in Vercel environment variables.", { status: 500 });
  }
  if (!supabaseUrl) {
    return new NextResponse("Error: NEXT_PUBLIC_SUPABASE_URL is not configured.", { status: 500 });
  }
  if (token.trim() !== accessToken) {
    return new NextResponse("Error: Invalid access token.", { status: 403 });
  }

  const admin = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const origin = request.nextUrl.origin;
  const redirectTo = `${origin}/auth/callback?next=/owner`;

  const { data: linkData, error: linkError } = await admin.auth.admin.generateLink({
    type: "magiclink",
    email: ownerEmail,
    options: { redirectTo },
  });

  if (linkError || !linkData?.properties?.action_link) {
    console.error("Owner access link generation failed:", linkError?.message);
    return new NextResponse(`Error generating session: ${linkError?.message ?? "unknown error"}`, { status: 500 });
  }

  // Redirect the browser to Supabase's action link.
  // Supabase verifies the one-time token and redirects back to /auth/callback?next=/owner
  // which sets the auth cookies and lands on /owner.
  return NextResponse.redirect(linkData.properties.action_link);
}
