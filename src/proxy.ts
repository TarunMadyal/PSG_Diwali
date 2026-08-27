import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function proxy(request: NextRequest) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key || process.env.NEXT_PUBLIC_DEMO_MODE === "true") return NextResponse.next();

  let response = NextResponse.next({ request });
  const supabase = createServerClient(url, key, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (entries) => {
        entries.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        entries.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      },
    },
  });
  const { data } = await supabase.auth.getClaims();
  const pathname = request.nextUrl.pathname;
  if (pathname.startsWith("/owner") && pathname !== "/owner/login" && !pathname.startsWith("/owner/access/") && !data?.claims) {
    return NextResponse.redirect(new URL("/owner/login", request.url));
  }
  return response;
}

export const config = {
  matcher: ["/owner/:path*", "/auth/:path*"],
};
