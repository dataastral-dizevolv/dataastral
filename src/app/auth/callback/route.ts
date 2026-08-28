import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

import { attributeReferralForUser, REFERRAL_COOKIE } from "@/lib/referrals";
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
  const rawReferral = request.cookies.get(REFERRAL_COOKIE)?.value ?? "";
  let referralCode = rawReferral;
  try {
    referralCode = decodeURIComponent(rawReferral);
  } catch {
    referralCode = rawReferral;
  }
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

  const { error, data } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    return NextResponse.redirect(new URL("/login?error=oauth_failed", request.url));
  }

  if (data.user && referralCode) {
    await attributeReferralForUser(data.user.id, referralCode);
  }

  const redirectResponse = NextResponse.redirect(new URL(safeNext, request.url));
  response.cookies.getAll().forEach((cookie) => {
    redirectResponse.cookies.set(cookie);
  });

  if (referralCode) {
    redirectResponse.cookies.set(REFERRAL_COOKIE, "", {
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 0,
    });
  }

  return redirectResponse;
}
