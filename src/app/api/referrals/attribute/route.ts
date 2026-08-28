import { NextResponse, type NextRequest } from "next/server";

import { attributeReferralForUser, REFERRAL_COOKIE } from "@/lib/referrals";
import { createClient } from "@/lib/supabase/server";

interface AttributeBody {
  code?: string;
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }

  const body = (await request.json().catch(() => ({}))) as AttributeBody;
  const codeFromBody = typeof body.code === "string" ? body.code : "";
  const rawCookie = request.cookies.get(REFERRAL_COOKIE)?.value ?? "";
  let codeFromCookie = rawCookie;
  try {
    codeFromCookie = decodeURIComponent(rawCookie);
  } catch {
    codeFromCookie = rawCookie;
  }
  const code = codeFromBody.trim() || codeFromCookie.trim();

  if (!code) {
    return NextResponse.json({ error: "Código de indicação ausente.", reason: "missing_code" }, { status: 400 });
  }

  const result = await attributeReferralForUser(user.id, code);

  const response = NextResponse.json({
    success: result.ok,
    reason: result.reason,
    pointsAwarded: result.pointsAwarded,
  });

  if (result.ok || result.reason === "invalid_code" || result.reason === "self_referral") {
    response.cookies.set(REFERRAL_COOKIE, "", {
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 0,
    });
  }

  if (!result.ok && result.reason === "error") {
    return NextResponse.json({ error: "Falha ao atribuir indicação.", reason: result.reason }, { status: 500 });
  }

  return response;
}
