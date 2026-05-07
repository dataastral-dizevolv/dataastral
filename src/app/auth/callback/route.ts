import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

import { getSupabaseConfig } from "@/lib/supabase/config";

function getSafeRedirectPath(rawNext: string | null) {
  if (!rawNext) {
    return "/dashboard";
  }

  if (!rawNext.startsWith("/") || rawNext.startsWith("//")) {
    return "/dashboard";
  }

  return rawNext;
}

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  const safeNext = getSafeRedirectPath(request.nextUrl.searchParams.get("next"));
  const { supabaseUrl, supabasePublishableKey } = getSupabaseConfig();

  let response = NextResponse.next({ request });

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

  if (!code) {
    return NextResponse.redirect(new URL("/login?error=oauth_failed", request.url));
  }

  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    return NextResponse.redirect(new URL("/login?error=oauth_failed", request.url));
  }

  const redirectResponse = NextResponse.redirect(new URL(safeNext, request.url));
  response.cookies.getAll().forEach((cookie) => {
    redirectResponse.cookies.set(cookie);
  });

  return redirectResponse;
}
