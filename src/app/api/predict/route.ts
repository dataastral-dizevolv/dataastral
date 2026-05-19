import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

import { createAdminClient } from "@/lib/supabase/admin";
import { getSupabaseConfig } from "@/lib/supabase/config";
import type { ThemeId } from "@/types/calculator";

export const runtime = "nodejs";

interface PredictRequestBody {
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
  targetBirthDate?: string;
  targetBirthTime?: string;
  targetBirthTimezone?: string | null;
  conflictDate?: string;
  dynamicAnswers?: Record<string, unknown>;
}

interface StoredPrediction {
  id: string;
  prediction_text: string;
  audio_text?: string | null;
  whatsapp_text?: string | null;
  event_date: string | null;
  birth_data: Record<string, unknown>;
}

interface EngineFunctionSuccessResponse {
  prediction: string;
  prediction_text?: string;
  audio_text?: string;
  whatsapp_text?: string;
  eventDate: string;
  eventDateIso: string;
  code?: string;
  technicalDetails?: Record<string, unknown>;
  transitPlanet?: string;
  natalPlanet?: string;
  orbDelta?: number;
  aspectAngle?: number;
}

interface EngineFunctionErrorResponse {
  error?: string;
  code?: string;
}

interface PredictApiResponse {
  prediction: string;
  prediction_text: string;
  audio_text: string;
  whatsapp_text: string;
  eventDate: string;
  eventDateIso: string;
  remainingCredits: number;
  cached: boolean;
  engineCode?: string;
  requestId: string;
  predictionId?: string;
}

const VALID_THEMES: ThemeId[] = ["amor", "carreira", "financas", "saude", "familia", "viagens"];
const CALIBRATION_THEMES = new Set<ThemeId>(["carreira", "saude", "familia", "viagens"]);
const AUTH_REQUIRED_ERROR = "Entre na sua conta para continuar.";
const INSUFFICIENT_CREDITS_ERROR = "Você não possui créditos suficientes para gerar esta previsão.";
const ENGINE_TIMEOUT_MS = 20_000;

function sanitizeErrorCode(value: string | undefined, fallback: string) {
  if (!value) {
    return fallback;
  }

  const normalized = value.trim().toUpperCase();
  return /^[A-Z0-9_]{2,64}$/.test(normalized) ? normalized : fallback;
}

function maskUserId(value: string) {
  if (value.length <= 10) {
    return "***";
  }

  return `${value.slice(0, 6)}***${value.slice(-4)}`;
}

function getFriendlyErrorMessage(code: string, details: string): string {
  const normalizedCode = code.trim().toUpperCase();
  const normalizedDetails = details.trim().toUpperCase();

  if (normalizedCode === "INSUFFICIENT_CREDITS") {
    return INSUFFICIENT_CREDITS_ERROR;
  }

  if (normalizedCode === "AUTH_REQUIRED") {
    return AUTH_REQUIRED_ERROR;
  }

  const engineErrorCodes = new Set(["ENGINE_ERROR", "PREDICTION_ENGINE_FAILED", "ENGINE_UNKNOWN"]);
  const engineDetailsHints = [
    "ENGINE_ERROR",
    "PREDICTION_ENGINE_FAILED",
    "ENGINE_UNKNOWN",
    "PYTHON",
    "MOTOR ASTROLOGICO",
    "EDGE FUNCTION",
    "FETCH FAILED",
    "ECONNREFUSED",
    "ETIMEDOUT",
  ];

  if (
    engineErrorCodes.has(normalizedCode) ||
    normalizedCode.startsWith("ENGINE_") ||
    engineDetailsHints.some((hint) => normalizedDetails.includes(hint))
  ) {
    return "A Iris está temporariamente offline. Tente novamente em alguns minutos.";
  }

  if (normalizedCode === "CREDIT_DEBIT_FAILED" || normalizedCode === "SERVER_MISCONFIGURED") {
    return "Erro interno. Tente novamente em instantes.";
  }

  if (normalizedCode === "PREDICTION_PERSIST_FAILED") {
    return "Previsão gerada, mas não foi possível salvar. Entre em contato com o suporte.";
  }

  return "Não foi possível gerar sua previsão agora. Tente novamente em instantes.";
}

function isValidTheme(value: string): value is ThemeId {
  return VALID_THEMES.includes(value as ThemeId);
}

function getStartOfTodayUtcIso() {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0, 0, 0)).toISOString();
}

function stableStringify(input: unknown): string {
  if (Array.isArray(input)) {
    return `[${input.map((item) => stableStringify(item)).join(",")}]`;
  }

  if (input && typeof input === "object") {
    const entries = Object.entries(input as Record<string, unknown>)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, value]) => `${JSON.stringify(key)}:${stableStringify(value)}`);

    return `{${entries.join(",")}}`;
  }

  return JSON.stringify(input);
}

function buildBirthData(body: PredictRequestBody, birthDate: string, birthTime: string, birthTimezone: string) {
  const dynamicAnswers =
    body.dynamicAnswers && typeof body.dynamicAnswers === "object" && !Array.isArray(body.dynamicAnswers)
      ? body.dynamicAnswers
      : null;

  return {
    birthDate,
    birthTime,
    gender: body.gender || null,
    birthTimezone,
    birthLocation: body.birthLocation || null,
    birthLat: typeof body.birthLat === "number" && Number.isFinite(body.birthLat) ? body.birthLat : null,
    birthLng: typeof body.birthLng === "number" && Number.isFinite(body.birthLng) ? body.birthLng : null,
    placeQuery: body.placeQuery || null,
    targetBirthDate: body.targetBirthDate || null,
    targetBirthTime: body.targetBirthTime || null,
    targetBirthTimezone: body.targetBirthTimezone || null,
    conflictDate: body.conflictDate || null,
    dynamicAnswers,
  };
}

export async function POST(request: NextRequest) {
  const requestId = crypto.randomUUID();
  const requestStartedAtMs = Date.now();
  const body = (await request.json().catch(() => ({}))) as PredictRequestBody;
  const theme = body.theme;
  const question = body.question?.trim();
  const birthDate = body.birthDate;
  const birthTime = body.birthTime?.trim() || "";
  const birthTimezone = typeof body.birthTimezone === "string" ? body.birthTimezone.trim() : "";

  console.info("[predict] Incoming request", { requestId, theme, hasBody: Object.keys(body).length > 0 });

  function errorResponse(
    status: number,
    code: string,
    details: string,
    message?: string,
  ) {
    const resolvedMessage = message ?? getFriendlyErrorMessage(code, details);

    console.error("[predict] Returning error response", {
      requestId,
      status,
      code,
      theme,
      durationMs: Date.now() - requestStartedAtMs,
    });

    return NextResponse.json(
      {
        error: resolvedMessage,
        code,
        requestId,
      },
      { status },
    );
  }

  if (!theme || !isValidTheme(theme)) {
    return errorResponse(400, "INVALID_THEME", `theme recebido: ${String(theme ?? "")}`);
  }

  if (CALIBRATION_THEMES.has(theme)) {
    return errorResponse(422, "THEME_IN_CALIBRATION", `Tema ${theme} em calibração.`, "Este tema está em calibração e será liberado em breve. Nenhum crédito foi cobrado.");
  }

  if (!question) {
    return errorResponse(400, "INVALID_QUESTION", "question ausente ou vazia.");
  }

  if (!birthDate) {
    return errorResponse(400, "INVALID_BIRTH_DATE", "birthDate ausente.");
  }

  if (!birthTimezone) {
    return errorResponse(400, "INVALID_BIRTH_TIMEZONE", "birthTimezone ausente ou vazio.");
  }

  const { supabaseUrl, supabasePublishableKey } = getSupabaseConfig();
  let authResponse = NextResponse.next({ request });

  const authClient = createServerClient(supabaseUrl, supabasePublishableKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        authResponse = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => {
          authResponse.cookies.set(name, value, options);
        });
      },
    },
  });

  const {
    data: { user },
  } = await authClient.auth.getUser();

  if (!user) {
    return errorResponse(401, "AUTH_REQUIRED", "Usuário não autenticado na rota /api/predict.", AUTH_REQUIRED_ERROR);
  }

  const authUser = user;
  const maskedUserId = maskUserId(authUser.id);

  let adminClient: ReturnType<typeof createAdminClient> | null = null;
  try {
    adminClient = createAdminClient();
  } catch {
    return errorResponse(500, "SERVER_MISCONFIGURED", "createAdminClient falhou: service role ausente/inválida.");
  }

  const serviceClient = adminClient;

  const { data: userProfileState } = await serviceClient.from("user_profiles").select("active").eq("id", authUser.id).maybeSingle();

  if (userProfileState?.active === false) {
    return errorResponse(403, "ACCOUNT_DISABLED", "Conta desativada para uso da calculadora.", "Sua conta está temporariamente desativada.");
  }

  async function writeAuditLog(input: {
    success: boolean;
    engineCode: string;
    status: number;
    code: string;
    engineStatus: "ok" | "failed" | "cache";
    hasResponse: boolean;
    responseSize: number;
  }) {
    if (!adminClient) {
      return;
    }

    const executionTimeMs = Date.now() - requestStartedAtMs;

    try {
      const { error: auditError } = await serviceClient.from("engine_audit_logs").insert({
        user_id: authUser.id,
        theme,
        question: null,
        success: input.success,
        engine_code: input.engineCode,
        execution_time_ms: executionTimeMs,
        technical_details: {
          status: input.status,
          code: input.code,
          requestId,
          durationMs: executionTimeMs,
          engineStatus: input.engineStatus,
          hasResponse: input.hasResponse,
          responseSize: input.responseSize,
        },
      });

      if (auditError) {
        console.error("[predict] Failed to insert engine audit log", {
          requestId,
          code: auditError.code,
          userId: maskedUserId,
        });
      }
    } catch {
      console.error("[predict] Unexpected audit logging failure", {
        requestId,
        userId: maskedUserId,
      });
    }
  }

  const normalizedBirthData = buildBirthData(body, birthDate, birthTime, birthTimezone);
  const normalizedBirthDataKey = stableStringify(normalizedBirthData);
  const todayStart = getStartOfTodayUtcIso();

  const { data: cachedRows, error: cacheError } = await serviceClient
    .from("user_predictions")
    .select("id, prediction_text, event_date, birth_data")
    .eq("user_id", authUser.id)
    .eq("theme", theme)
    .eq("question", question)
    .gte("created_at", todayStart)
    .order("created_at", { ascending: false })
    .limit(30);

  if (cacheError) {
    console.error("[predict] Failed to check cache", {
      requestId,
      code: cacheError.code,
      userId: maskedUserId,
    });
  }

  const cachedPrediction = (cachedRows as StoredPrediction[] | null)?.find(
    (row) => stableStringify(row.birth_data) === normalizedBirthDataKey,
  );

  async function getRemainingCredits() {
    const { data: profile } = await serviceClient.from("profiles").select("credits").eq("id", authUser.id).maybeSingle();
    return profile?.credits ?? 0;
  }

  if (cachedPrediction) {
    const remainingCredits = await getRemainingCredits();

    await writeAuditLog({
      success: true,
      engineCode: "CACHE_HIT",
      status: 200,
      code: "CACHE_HIT",
      engineStatus: "cache",
      hasResponse: true,
      responseSize: cachedPrediction.prediction_text.length,
    });

    const response = NextResponse.json({
      prediction: cachedPrediction.prediction_text,
      prediction_text: cachedPrediction.prediction_text,
      audio_text: cachedPrediction.prediction_text,
      whatsapp_text: cachedPrediction.prediction_text,
      eventDate: cachedPrediction.event_date || "",
      eventDateIso: "",
      remainingCredits,
      cached: true,
      requestId,
      predictionId: cachedPrediction.id,
    } satisfies PredictApiResponse);

    authResponse.cookies.getAll().forEach((cookie) => {
      response.cookies.set(cookie);
    });

    return response;
  }

  const creditsBeforeExecution = await getRemainingCredits();
  if (creditsBeforeExecution <= 0) {
    await writeAuditLog({
      success: false,
      engineCode: "INSUFFICIENT_CREDITS",
      status: 402,
      code: "INSUFFICIENT_CREDITS",
      engineStatus: "failed",
      hasResponse: false,
      responseSize: 0,
    });

    return NextResponse.json(
      {
        error: INSUFFICIENT_CREDITS_ERROR,
        code: "INSUFFICIENT_CREDITS",
        remainingCredits: creditsBeforeExecution,
        requestId,
      },
      { status: 402 },
    );
  }

  const edgeRequestPayload = {
    theme,
    question,
    birthDate,
    birthTime,
    gender: body.gender || null,
    birthTimezone,
    ...(body.targetBirthDate ? { targetBirthDate: body.targetBirthDate } : {}),
    ...(body.targetBirthTime ? { targetBirthTime: body.targetBirthTime } : {}),
    ...(body.targetBirthTimezone ? { targetBirthTimezone: body.targetBirthTimezone } : {}),
    ...(body.conflictDate ? { conflictDate: body.conflictDate } : {}),
    ...(body.dynamicAnswers && typeof body.dynamicAnswers === "object" && !Array.isArray(body.dynamicAnswers)
      ? { dynamicAnswers: body.dynamicAnswers }
      : {}),
  };

  console.info("[predict] Sending request to engine", {
    requestId,
    theme,
    userId: maskedUserId,
  });

  const engineUrl = process.env.PYTHON_ENGINE_URL ?? `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/iris-predict`;
  const internalEngineToken = process.env.ENGINE_INTERNAL_TOKEN?.trim() || "";
  const isProduction = process.env.VERCEL_ENV === "production" || process.env.NODE_ENV === "production";

  if (isProduction && !internalEngineToken) {
    return errorResponse(500, "ENGINE_NOT_CONFIGURED", "ENGINE_INTERNAL_TOKEN ausente em produção.");
  }

  let enginePrediction: {
    predictionText: string;
    audioText: string;
    whatsappText: string;
    date: string;
    dateIso: string;
    code?: string;
  };
  let engineResponseSize = 0;
  let engineResponseReceived = false;
  let engineHttpStatus: number | null = null;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), ENGINE_TIMEOUT_MS);
    const edgeResponse = await fetch(engineUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-request-id": requestId,
        "x-internal-engine-token": internalEngineToken,
      },
      body: JSON.stringify(edgeRequestPayload),
      signal: controller.signal,
    }).finally(() => clearTimeout(timeout));

    const rawEdgeResponse = await edgeResponse.text();
    engineResponseReceived = rawEdgeResponse.length > 0;
    engineResponseSize = rawEdgeResponse.length;
    engineHttpStatus = edgeResponse.status;
    let edgePayload: EngineFunctionSuccessResponse | EngineFunctionErrorResponse = {};

    try {
      edgePayload = JSON.parse(rawEdgeResponse) as EngineFunctionSuccessResponse | EngineFunctionErrorResponse;
    } catch {
      edgePayload = {};
    }

    console.info("[predict] Engine response metadata", { requestId, status: edgeResponse.status, responseSize: rawEdgeResponse.length, ok: edgeResponse.ok });

    if (!edgeResponse.ok) {
      const edgeErrorPayload = edgePayload as EngineFunctionErrorResponse;
      const code = sanitizeErrorCode(edgeErrorPayload.code, "PREDICTION_ENGINE_FAILED");
      await writeAuditLog({
        success: false,
        engineCode: code,
        status: 500,
        code,
        engineStatus: "failed",
        hasResponse: engineResponseReceived,
        responseSize: engineResponseSize,
      });

      return errorResponse(500, code, "ENGINE_HTTP_ERROR");
    }

    const edgeSuccessPayload = edgePayload as EngineFunctionSuccessResponse;

    const predictionText = (edgeSuccessPayload.prediction_text ?? edgeSuccessPayload.prediction ?? "").trim();
    const audioText = (edgeSuccessPayload.audio_text ?? predictionText).trim();
    const whatsappText = (edgeSuccessPayload.whatsapp_text ?? predictionText).trim();

    if (!predictionText) {
      throw new Error("PREDICTION_ENGINE_FAILED: Resposta inválida da edge function (prediction ausente).");
    }

    enginePrediction = {
      predictionText,
      audioText: audioText || predictionText,
      whatsappText: whatsappText || predictionText,
      date: edgeSuccessPayload.eventDate,
      dateIso: edgeSuccessPayload.eventDateIso,
      code: edgeSuccessPayload.code,
    };
  } catch (error) {
    const code = error instanceof Error && error.name === "AbortError" ? "ENGINE_TIMEOUT" : "PREDICTION_ENGINE_FAILED";

    await writeAuditLog({
      success: false,
      engineCode: code,
      status: 500,
      code,
      engineStatus: "failed",
      hasResponse: engineResponseReceived,
      responseSize: engineResponseSize,
    });

    console.error("[predict] Engine request failed", {
      requestId,
      userId: maskedUserId,
      theme,
      engineStatus: engineHttpStatus,
      durationMs: Date.now() - requestStartedAtMs,
    });

    return errorResponse(500, code, "ENGINE_REQUEST_FAILED");
  }

  const interpretedPrediction = enginePrediction.predictionText;

  const { data: insertedPrediction, error: insertPredictionError } = await serviceClient.from("user_predictions").insert({
    user_id: authUser.id,
    theme,
    question,
    birth_data: normalizedBirthData,
    prediction_text: interpretedPrediction,
    event_date: enginePrediction.date || null,
    target_birth_date: body.targetBirthDate || null,
    target_birth_time: body.targetBirthTime || null,
    target_birth_timezone: body.targetBirthTimezone || null,
    conflict_date: body.conflictDate || null,
  }).select("id").single();

  if (insertPredictionError) {
    await writeAuditLog({
      success: false,
      engineCode: "PREDICTION_PERSIST_FAILED",
      status: 500,
      code: "PREDICTION_PERSIST_FAILED",
      engineStatus: "ok",
      hasResponse: true,
      responseSize: engineResponseSize,
    });

    return errorResponse(
      500,
      "PREDICTION_PERSIST_FAILED",
      `insert user_predictions falhou: ${insertPredictionError.code ?? "NO_CODE"} ${insertPredictionError.message}`,
    );
  }

  const { data: insertedHistory, error: insertHistoryError } = await serviceClient.from("user_prediction_history").insert({
    user_id: authUser.id,
    theme,
    question,
    prediction: interpretedPrediction,
    event_date: enginePrediction.dateIso || null,
    birth_date: birthDate,
    birth_time: birthTime || null,
    birth_timezone: birthTimezone,
    target_birth_date: body.targetBirthDate || null,
    target_birth_time: body.targetBirthTime || null,
    target_birth_timezone: body.targetBirthTimezone || null,
    conflict_date: body.conflictDate || null,
  }).select("id").single();

  if (insertHistoryError) {
    await serviceClient.from("user_predictions").delete().eq("id", insertedPrediction.id).eq("user_id", authUser.id);
    await writeAuditLog({
      success: false,
      engineCode: "PREDICTION_PERSIST_FAILED",
      status: 500,
      code: "PREDICTION_PERSIST_FAILED",
      engineStatus: "ok",
      hasResponse: true,
      responseSize: engineResponseSize,
    });

    return errorResponse(
      500,
      "PREDICTION_PERSIST_FAILED",
      `insert user_prediction_history falhou: ${insertHistoryError.code ?? "NO_CODE"} ${insertHistoryError.message}`,
    );
  }

  const { data: remainingAfterDebit, error: debitError } = await serviceClient.rpc("consume_profile_credit", {
    p_user_id: authUser.id,
    p_description: `Uso de crédito na calculadora (${theme})`,
  });

  if (debitError || remainingAfterDebit === null) {
    const [predRollback, histRollback] = await Promise.all([
      serviceClient.from("user_predictions").delete().eq("id", insertedPrediction.id).eq("user_id", authUser.id),
      serviceClient.from("user_prediction_history").delete().eq("id", insertedHistory.id).eq("user_id", authUser.id),
    ]);
    if (predRollback.error) {
      console.error("[predict] Rollback user_predictions failed", {
        requestId,
        code: predRollback.error.code,
        message: predRollback.error.message,
      });
    }
    if (histRollback.error) {
      console.error("[predict] Rollback user_prediction_history failed", {
        requestId,
        code: histRollback.error.code,
        message: histRollback.error.message,
      });
    }
    const remainingCredits = await getRemainingCredits();

    await writeAuditLog({
      success: false,
      engineCode: debitError ? "CREDIT_DEBIT_FAILED" : "INSUFFICIENT_CREDITS",
      status: debitError ? 500 : 402,
      code: debitError ? "CREDIT_DEBIT_FAILED" : "INSUFFICIENT_CREDITS",
      engineStatus: "ok",
      hasResponse: true,
      responseSize: engineResponseSize,
    });

    if (remainingAfterDebit === null) {
      return NextResponse.json(
        {
          error: INSUFFICIENT_CREDITS_ERROR,
          code: "INSUFFICIENT_CREDITS",
          remainingCredits,
          requestId,
        },
        { status: 402 },
      );
    }

    return errorResponse(
      500,
      "CREDIT_DEBIT_FAILED",
      `consume_profile_credit falhou: ${debitError?.code ?? "NO_CODE"} ${debitError?.message ?? "erro desconhecido"}`,
      "Falha ao confirmar consumo de crédito.",
    );
  }

  const response = NextResponse.json({
    prediction: interpretedPrediction,
    prediction_text: interpretedPrediction,
    audio_text: enginePrediction.audioText,
    whatsapp_text: enginePrediction.whatsappText,
    eventDate: enginePrediction.date,
    eventDateIso: enginePrediction.dateIso,
    remainingCredits: remainingAfterDebit,
    cached: false,
    engineCode: enginePrediction.code,
    requestId,
    predictionId: insertedPrediction?.id,
  } satisfies PredictApiResponse);

  authResponse.cookies.getAll().forEach((cookie) => {
    response.cookies.set(cookie);
  });

  await writeAuditLog({
    success: true,
    engineCode: enginePrediction.code ?? "ASPECT_FOUND",
    status: 200,
    code: enginePrediction.code ?? "ASPECT_FOUND",
    engineStatus: "ok",
    hasResponse: true,
    responseSize: engineResponseSize,
  });

  return response;
}
