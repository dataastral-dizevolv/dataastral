import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

import { getSupabaseConfig } from "./src/lib/supabase/config";

const AUTH_ROUTES = ["/login", "/cadastro"];
const PROTECTED_ROUTES = ["/dashboard", "/calculadora", "/calendario", "/financeiro", "/perfil"];
const ADMIN_ROUTE_PREFIX = "/admin";

function isAuthRoute(pathname: string) {
  return AUTH_ROUTES.some((route) => pathname === route || pathname.startsWith(`${route}/`));
}

function isProtectedRoute(pathname: string) {
  return PROTECTED_ROUTES.some((route) => pathname === route || pathname.startsWith(`${route}/`));
}

function isAdminRoute(pathname: string) {
  return pathname === ADMIN_ROUTE_PREFIX || pathname.startsWith(`${ADMIN_ROUTE_PREFIX}/`);
}

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request });
  const { supabaseUrl, supabasePublishableKey } = getSupabaseConfig();

  const supabase = createServerClient(supabaseUrl, supabasePublishableKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, options);
        });
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;

  if (!user && (isProtectedRoute(pathname) || isAdminRoute(pathname))) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/login";
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (user && isAdminRoute(pathname)) {
    const { data: profile } = await supabase.from("user_profiles").select("active").eq("id", user.id).maybeSingle();

    if (profile?.active === false) {
      const loginUrl = request.nextUrl.clone();
      loginUrl.pathname = "/login";
      loginUrl.searchParams.set("blocked", "1");
      return NextResponse.redirect(loginUrl);
    }

    const { data: rpcData, error: rpcError } = await supabase.rpc("is_admin", { user_id: user.id });
    const isAdmin = !rpcError && rpcData === true;

    if (!isAdmin) {
      const dashboardUrl = request.nextUrl.clone();
      dashboardUrl.pathname = "/dashboard";
      dashboardUrl.search = "";
      return NextResponse.redirect(dashboardUrl);
    }
  }

  if (user && isProtectedRoute(pathname)) {
    const { data: profile } = await supabase.from("user_profiles").select("active").eq("id", user.id).maybeSingle();

    if (profile?.active === false) {
      const loginUrl = request.nextUrl.clone();
      loginUrl.pathname = "/login";
      loginUrl.searchParams.set("blocked", "1");
      return NextResponse.redirect(loginUrl);
    }
  }

  if (user && isAuthRoute(pathname)) {
    const { data: profile } = await supabase.from("user_profiles").select("active").eq("id", user.id).maybeSingle();

    if (profile?.active === false) {
      return response;
    }

    const dashboardUrl = request.nextUrl.clone();
    dashboardUrl.pathname = "/dashboard";
    dashboardUrl.search = "";
    return NextResponse.redirect(dashboardUrl);
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
