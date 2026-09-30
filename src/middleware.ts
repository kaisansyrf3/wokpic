import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

import type { Database } from "@/types/database";

const ADMIN_ROOT = "/admin";
const LOGIN_PATH = "/admin/login";

function isAdmin(user: { app_metadata?: Record<string, unknown> } | null): boolean {
  return user?.app_metadata?.role === "admin";
}

export async function middleware(request: NextRequest) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    // Without the Supabase env there is no way to verify anyone, so the whole
    // admin area stays shut rather than falling open.
    return NextResponse.redirect(new URL("/admin/login?reason=config", request.url));
  }

  const response = NextResponse.next({ request });

  const supabase = createServerClient<Database>(url, anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        for (const { name, value } of cookiesToSet) {
          request.cookies.set(name, value);
        }
        for (const { name, value, options } of cookiesToSet) {
          response.cookies.set(name, value, options);
        }
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;
  const onLoginPage = pathname === LOGIN_PATH;

  if (onLoginPage) {
    if (isAdmin(user)) {
      return NextResponse.redirect(new URL(ADMIN_ROOT, request.url));
    }
    return response;
  }

  if (!user) {
    const target = new URL(LOGIN_PATH, request.url);
    target.searchParams.set("next", pathname);
    return NextResponse.redirect(target);
  }

  if (!isAdmin(user)) {
    const target = new URL(LOGIN_PATH, request.url);
    target.searchParams.set("reason", "notadmin");
    return NextResponse.redirect(target);
  }

  return response;
}

export const config = {
  matcher: ["/admin", "/admin/:path*"],
};
