import { NextResponse, type NextRequest } from "next/server";

import { getEngineRequestHeaders } from "@/lib/engine/request-headers";
import { FREE_QUESTIONS_LIMIT, GUEST_ID_COOKIE } from "@/lib/guest/constants";
import { enrichText } from "@/lib/enrichText";
import { createAdminClient } from "@/lib/supabase/admin";
import type { ThemeId } from "@/types/calculator";

export const runtime = "nodejs";

interface PredictPublicRequestBody {
  theme?: string;
  question?: string;
  birthDate?: string;
  birthTime?: string;
  gender?: string | null;
  birthLocation?: string;
  birthTimezone?: string | null;
  birthLat?: number | null;
  birthLng?: number | null;
  placeQuery?: string;
  dynamicAnswers?: Record<string, unknown>;
}

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

const VALID_THEMES: ThemeId[] = ["amor", "carreira", "financas", "saude", "familia", "viagens"];
const CALIBRATION_THEMES = new Set<ThemeId>(["carreira", "saude", "familia", "viagens"]);
const MAX_QUESTION_LENGTH = 300;
const MAX_LOCATION_LENGTH = 200;
const MAX_TIMEZONE_LENGTH = 80;
const MAX_PLACE_QUERY_LENGTH = 200;
const ENGINE_TIMEOUT_MS = 20_000;
const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000;
const RATE_LIMIT_MAX_REQUESTS = 12;
const GUEST_COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 90;
// TODO: Este rate-limit em memória é por processo/instância.
// Em produção com múltiplas instâncias, o controle pode ficar inconsistente.
// Migrar para solução distribuída (ex.: Redis/KV) para enforcement global.
const ipRequestMap = new Map<string, number[]>();

function isValidTheme(value: string): value is ThemeId {
  return VALID_THEMES.includes(value as ThemeId);
}

function isValidDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }

  const date = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

function isValidTime(value: string) {
  if (value.length === 0) {
    return true;
  }

  return /^([01]\d|2[0-3]):[0-5]\d$/.test(value);
}

function getClientIp(request: NextRequest) {
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) {
    return forwardedFor.split(",")[0]?.trim() || "unknown";
  }

  return request.headers.get("x-real-ip")?.trim() || "unknown";
}

function checkRateLimit(ip: string) {
  const now = Date.now();
  const current = ipRequestMap.get(ip) ?? [];
  const recent = current.filter((value) => now - value <= RATE_LIMIT_WINDOW_MS);

  if (recent.length >= RATE_LIMIT_MAX_REQUESTS) {
    ipRequestMap.set(ip, recent);
    return false;
  }

  recent.push(now);
  ipRequestMap.set(ip, recent);
  return true;
}

function isValidUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

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

function normalizeDynamicAnswers(input: unknown) {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    return null;
  }

  const entries = Object.entries(input as Record<string, unknown>).slice(0, 50);
  const output: Record<string, unknown> = {};

  for (const [key, value] of entries) {
    const safeKey = key.trim().slice(0, 80);

    if (!safeKey) {
      continue;
    }

    if (typeof value === "string") {
      output[safeKey] = value.slice(0, 500);
      continue;
    }

    if (Array.isArray(value)) {
      output[safeKey] = value
        .filter((item): item is string => typeof item === "string")
        .slice(0, 20)
        .map((item) => item.slice(0, 200));
      continue;
    }

    output[safeKey] = value;
  }

  return output;
}

export async function POST(request: NextRequest) {
  const requestId = crypto.randomUUID();
  const ip = getClientIp(request);

  if (!checkRateLimit(ip)) {
    return NextResponse.json(
      { error: "Muitas tentativas em pouco tempo. Aguarde alguns minutos.", code: "RATE_LIMIT_EXCEEDED", requestId },
      { status: 429 },
    );
  }

  const body = (await request.json().catch(() => ({}))) as PredictPublicRequestBody;
  const theme = typeof body.theme === "string" ? body.theme.trim().toLowerCase() : "";
  const question = typeof body.question === "string" ? body.question.trim() : "";
  const birthDate = typeof body.birthDate === "string" ? body.birthDate.trim() : "";
  const birthTime = typeof body.birthTime === "string" ? body.birthTime.trim() : "";
  const birthTimezone = typeof body.birthTimezone === "string" ? body.birthTimezone.trim() : "";
  const birthLocation = typeof body.birthLocation === "string" ? body.birthLocation.trim() : "";
  const placeQuery = typeof body.placeQuery === "string" ? body.placeQuery.trim() : "";
  const dynamicAnswers = normalizeDynamicAnswers(body.dynamicAnswers);

  if (!isValidTheme(theme)) {
    return NextResponse.json({ error: "Tema inválido.", code: "INVALID_THEME", requestId }, { status: 400 });
  }

  if (CALIBRATION_THEMES.has(theme)) {
    return NextResponse.json(
      { error: "Este tema está em calibração e será liberado em breve. Nenhum crédito foi cobrado.", code: "THEME_IN_CALIBRATION", requestId },
      { status: 422 },
    );
  }

  if (!question || question.length > MAX_QUESTION_LENGTH) {
    return NextResponse.json({ error: "Pergunta inválida.", code: "INVALID_QUESTION", requestId }, { status: 400 });
  }

  if (!isValidDate(birthDate)) {
    return NextResponse.json({ error: "Data de nascimento inválida.", code: "INVALID_BIRTH_DATE", requestId }, { status: 400 });
  }

  if (!isValidTime(birthTime)) {
    return NextResponse.json({ error: "Hora deve estar no formato HH:mm.", code: "INVALID_BIRTH_TIME", requestId }, { status: 400 });
  }

  if (!birthTimezone || birthTimezone.length > MAX_TIMEZONE_LENGTH) {
    return NextResponse.json({ error: "Timezone inválido.", code: "INVALID_BIRTH_TIMEZONE", requestId }, { status: 400 });
  }

  if (!birthLocation || birthLocation.length > MAX_LOCATION_LENGTH) {
    return NextResponse.json({ error: "Local de nascimento inválido.", code: "INVALID_BIRTH_LOCATION", requestId }, { status: 400 });
  }

  if (placeQuery.length > MAX_PLACE_QUERY_LENGTH) {
    return NextResponse.json({ error: "Consulta de local muito longa.", code: "INVALID_PLACE_QUERY", requestId }, { status: 400 });
  }

  const rawGuestId = request.cookies.get(GUEST_ID_COOKIE)?.value?.trim() ?? "";
  const hasValidGuestId = isValidUuid(rawGuestId);
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
    gender: body.gender || null,
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
