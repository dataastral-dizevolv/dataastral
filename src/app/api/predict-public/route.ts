import { NextResponse, type NextRequest } from "next/server";

import { getEngineRequestHeaders } from "@/lib/engine/request-headers";
import { FREE_QUESTIONS_LIMIT, GUEST_ID_COOKIE } from "@/lib/guest/constants";
import { enrichText } from "@/lib/enrichText";
import { getClientIp } from "@/lib/http/client-ip";
import { RATE_LIMITS, consumeRateLimit, rateLimitJson } from "@/lib/rate-limit";
import { createAdminClient } from "@/lib/supabase/admin";
import { isUuid } from "@/lib/validation/fields";
import { parseApiBody } from "@/lib/validation/parse-body";
import { CALIBRATION_THEMES, predictPublicBodySchema } from "@/lib/validation/predict";

export const runtime = "nodejs";

interface EngineFunctionSuccessResponse {
  prediction: string;
  prediction_text?: string;
  audio_text?: string;
  whatsapp_text?: string;
  eventDate: string;
  eventDateIso: string;
  code?: string;
}

interface EngineFunctionErrorResponse {
  error?: string;
  code?: string;
}

interface PredictPublicSuccessResponse {
  prediction: string;
  prediction_text: string;
  audio_text: string;
  whatsapp_text: string;
  eventDate: string;
  eventDateIso: string;
  remainingCredits: number;
  remainingFreeQuestions: number;
  cached: boolean;
  engineCode?: string;
  requestId: string;
}

const ENGINE_TIMEOUT_MS = 20_000;
const GUEST_COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 90;

function withGuestCookie(response: NextResponse, guestId: string, shouldSetGuestCookie: boolean) {
  if (!shouldSetGuestCookie) {
    return response;
  }

  const isSecure = process.env.NODE_ENV === "production" || process.env.VERCEL_ENV === "production";
  response.cookies.set({
    name: GUEST_ID_COOKIE,
    value: guestId,
    httpOnly: true,
    sameSite: "lax",
    secure: isSecure,
    path: "/",
    maxAge: GUEST_COOKIE_MAX_AGE_SECONDS,
  });
  return response;
}

export async function POST(request: NextRequest) {
  const requestId = crypto.randomUUID();
  const ip = getClientIp(request);

  if (!(await consumeRateLimit(`predict-public:ip:${ip}`, RATE_LIMITS.predictPublic.max, RATE_LIMITS.predictPublic.windowMs))) {
    return rateLimitJson("RATE_LIMIT_EXCEEDED", requestId);
  }

  const parsed = parseApiBody(predictPublicBodySchema, await request.json().catch(() => ({})));
  if (!parsed.ok) {
    return NextResponse.json({ error: parsed.error, code: parsed.code, requestId }, { status: 400 });
  }

  const { theme, question, birthDate, birthTime, birthTimezone, dynamicAnswers, gender } = parsed.data;

  if (CALIBRATION_THEMES.has(theme)) {
    return NextResponse.json(
      { error: "Este tema está em calibração e será liberado em breve. Nenhum crédito foi cobrado.", code: "THEME_IN_CALIBRATION", requestId },
      { status: 422 },
    );
  }

  const rawGuestId = request.cookies.get(GUEST_ID_COOKIE)?.value?.trim() ?? "";
  const hasValidGuestId = isUuid(rawGuestId);
  const guestId = hasValidGuestId ? rawGuestId : crypto.randomUUID();
  const shouldSetGuestCookie = !hasValidGuestId;

  let remainingFreeQuestions = 0;

  try {
    const admin = createAdminClient();
    const { data, error } = await admin.rpc("consume_guest_question", { p_guest_id: guestId });

    if (error) {
      return withGuestCookie(
        NextResponse.json(
          { error: "Não foi possível validar seu acesso gratuito agora. Tente novamente em instantes.", code: "FREE_LIMIT_CHECK_FAILED", requestId },
          { status: 500 },
        ),
        guestId,
        shouldSetGuestCookie,
      );
    }

    if (data === null) {
      return withGuestCookie(
        NextResponse.json(
          {
            error: `Você já usou suas ${FREE_QUESTIONS_LIMIT} leituras gratuitas. Entre ou crie uma conta para continuar.`,
            code: "FREE_LIMIT_REACHED",
            remainingFreeQuestions: 0,
            requestId,
          },
          { status: 403 },
        ),
        guestId,
        shouldSetGuestCookie,
      );
    }

    remainingFreeQuestions = typeof data === "number" ? data : 0;
  } catch {
    return withGuestCookie(
      NextResponse.json(
        { error: "Não foi possível validar seu acesso gratuito agora. Tente novamente em instantes.", code: "FREE_LIMIT_CHECK_FAILED", requestId },
        { status: 500 },
      ),
      guestId,
      shouldSetGuestCookie,
    );
  }

  const edgeRequestPayload = {
    theme,
    question,
    birthDate,
    birthTime,
    gender,
    birthTimezone,
    ...(dynamicAnswers ? { dynamicAnswers } : {}),
  };

  const engineUrl = process.env.PYTHON_ENGINE_URL ?? `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/iris-predict`;
  const internalEngineToken = process.env.ENGINE_INTERNAL_TOKEN?.trim() || "";
  const isProduction = process.env.VERCEL_ENV === "production" || process.env.NODE_ENV === "production";

  if (isProduction && !internalEngineToken) {
    return NextResponse.json(
      { error: "Serviço temporariamente indisponível.", code: "ENGINE_NOT_CONFIGURED", requestId },
      { status: 500 },
    );
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), ENGINE_TIMEOUT_MS);
    const edgeResponse = await fetch(engineUrl, {
      method: "POST",
      headers: getEngineRequestHeaders(requestId),
      body: JSON.stringify(edgeRequestPayload),
      signal: controller.signal,
    }).finally(() => clearTimeout(timeout));

    const rawEdgeResponse = await edgeResponse.text();
    let edgePayload: EngineFunctionSuccessResponse | EngineFunctionErrorResponse = {};

    try {
      edgePayload = JSON.parse(rawEdgeResponse) as EngineFunctionSuccessResponse | EngineFunctionErrorResponse;
    } catch {
      edgePayload = {};
    }

    if (!edgeResponse.ok) {
      const code = (edgePayload as EngineFunctionErrorResponse).code ?? "PREDICTION_ENGINE_FAILED";
      return NextResponse.json(
        { error: "Não foi possível gerar sua previsão agora. Tente novamente em instantes.", code, requestId },
        { status: 500 },
      );
    }

    const edgeSuccessPayload = edgePayload as EngineFunctionSuccessResponse;
    const predictionText = (edgeSuccessPayload.prediction_text ?? edgeSuccessPayload.prediction ?? "").trim();
    const audioText = (edgeSuccessPayload.audio_text ?? predictionText).trim();
    const whatsappText = (edgeSuccessPayload.whatsapp_text ?? predictionText).trim();

    if (!predictionText) {
      return NextResponse.json(
        { error: "Resposta inválida do motor de previsão.", code: "PREDICTION_ENGINE_FAILED", requestId },
        { status: 500 },
      );
    }

    console.info("[predict-public] Engine code para enrichText", { engineCode: edgeSuccessPayload.code });
    const finalPrediction = await enrichText({
      predictionText,
      eventDate: edgeSuccessPayload.eventDate ?? "",
    });

    return withGuestCookie(NextResponse.json({
      prediction: finalPrediction,
      prediction_text: finalPrediction,
      audio_text: audioText || predictionText,
      whatsapp_text: whatsappText || predictionText,
      eventDate: edgeSuccessPayload.eventDate ?? "",
      eventDateIso: edgeSuccessPayload.eventDateIso ?? "",
      remainingCredits: 0,
      remainingFreeQuestions,
      cached: false,
      engineCode: edgeSuccessPayload.code,
      requestId,
    } satisfies PredictPublicSuccessResponse), guestId, shouldSetGuestCookie);
  } catch (error) {
    const code = error instanceof Error && error.name === "AbortError" ? "ENGINE_TIMEOUT" : "PREDICTION_ENGINE_FAILED";
    return NextResponse.json(
      { error: "Falha de conexão ao gerar a previsão.", code, requestId },
      { status: 500 },
    );
  }
}
