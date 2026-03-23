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
  birthLocation?: string;
  birthTimezone?: string | null;
  birthLat?: number | null;
  birthLng?: number | null;
  placeQuery?: string;
  targetBirthDate?: string;
  targetBirthTime?: string;
  targetBirthTimezone?: string | null;
  conflictDate?: string;
}

interface StoredPrediction {
  prediction_text: string;
  event_date: string | null;
  birth_data: Record<string, unknown>;
}

interface EngineFunctionSuccessResponse {
  prediction: string;
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

const VALID_THEMES: ThemeId[] = ["amor", "carreira", "financas", "saude", "familia", "viagens"];
const AUTH_REQUIRED_ERROR = "Entre na sua conta para continuar.";
const INSUFFICIENT_CREDITS_ERROR = "Você não possui créditos suficientes para gerar esta previsão.";

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
  return {
    birthDate,
    birthTime,
    birthTimezone,
    birthLocation: body.birthLocation || null,
    birthLat: typeof body.birthLat === "number" && Number.isFinite(body.birthLat) ? body.birthLat : null,
    birthLng: typeof body.birthLng === "number" && Number.isFinite(body.birthLng) ? body.birthLng : null,
    placeQuery: body.placeQuery || null,
    targetBirthDate: body.targetBirthDate || null,
    targetBirthTime: body.targetBirthTime || null,
    targetBirthTimezone: body.targetBirthTimezone || null,
    conflictDate: body.conflictDate || null,
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

  console.info("[predict] Incoming request", {
    requestId,
    theme,
    questionLength: question?.length ?? 0,
    birthDate,
    birthTime,
    birthTimezone,
  });

  function errorResponse(
    status: number,
    code: string,
    details: string,
    message?: string,
    extra?: Record<string, unknown>,
  ) {
    const resolvedMessage = message ?? getFriendlyErrorMessage(code, details);

    console.error("[predict] Returning error response", {
      requestId,
      status,
      code,
      details,
      ...extra,
    });

    return NextResponse.json(
      {
        error: resolvedMessage,
        code,
        details,
        requestId,
        ...extra,
      },
      { status },
    );
  }

  if (!theme || !isValidTheme(theme)) {
    return errorResponse(400, "INVALID_THEME", `theme recebido: ${String(theme ?? "")}`);
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
    technicalDetails?: Record<string, unknown>;
  }) {
    if (!adminClient) {
      return;
    }

    const executionTimeMs = Date.now() - requestStartedAtMs;

    try {
      const { error: auditError } = await serviceClient.from("engine_audit_logs").insert({
        user_id: authUser.id,
        theme,
        question,
        success: input.success,
        engine_code: input.engineCode,
        execution_time_ms: executionTimeMs,
        technical_details: {
          requestId,
          cache: false,
          ...(input.technicalDetails ?? {}),
        },
      });

      if (auditError) {
        console.error("[predict] Failed to insert engine audit log", {
          requestId,
          code: auditError.code,
          message: auditError.message,
        });
      }
    } catch (unexpectedError) {
      console.error("[predict] Unexpected audit logging failure", {
        requestId,
        details: unexpectedError instanceof Error ? unexpectedError.message : String(unexpectedError),
      });
    }
  }

  const normalizedBirthData = buildBirthData(body, birthDate, birthTime, birthTimezone);
  const normalizedBirthDataKey = stableStringify(normalizedBirthData);
  const todayStart = getStartOfTodayUtcIso();

  const { data: cachedRows, error: cacheError } = await serviceClient
    .from("user_predictions")
    .select("prediction_text, event_date, birth_data")
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
      message: cacheError.message,
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
      technicalDetails: {
        cache: true,
        source: "user_predictions",
      },
    });

    const response = NextResponse.json({
      prediction: cachedPrediction.prediction_text,
      eventDate: cachedPrediction.event_date || "",
      eventDateIso: "",
      remainingCredits,
      cached: true,
      requestId,
    });

    authResponse.cookies.getAll().forEach((cookie) => {
      response.cookies.set(cookie);
    });

    return response;
  }

  const { data: remainingAfterDebit, error: debitError } = await serviceClient.rpc("consume_profile_credit", {
    p_user_id: authUser.id,
    p_description: `Uso de crédito na calculadora (${theme})`,
  });

  if (debitError) {
    await writeAuditLog({
      success: false,
      engineCode: "CREDIT_DEBIT_FAILED",
      technicalDetails: {
        cache: false,
        debitErrorCode: debitError.code ?? "NO_CODE",
        debitErrorMessage: debitError.message,
      },
    });

    return errorResponse(
      500,
      "CREDIT_DEBIT_FAILED",
      `consume_profile_credit falhou: ${debitError.code ?? "NO_CODE"} ${debitError.message}`,
    );
  }

  if (remainingAfterDebit === null) {
    const remainingCredits = await getRemainingCredits();

    await writeAuditLog({
      success: false,
      engineCode: "INSUFFICIENT_CREDITS",
      technicalDetails: {
        cache: false,
        remainingCredits,
      },
    });

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

  let debitApplied = true;

  async function refundIfNeeded() {
    if (!debitApplied) {
      return;
    }

    const { error: refundError } = await serviceClient.rpc("add_profile_credits", {
      p_user_id: authUser.id,
      p_amount: 1,
      p_type: "bonus",
      p_description: "Estorno por falha ao gerar previsão",
    });

    if (!refundError) {
      debitApplied = false;
    }
  }

  const edgeRequestPayload = {
    theme,
    question,
    birthDate,
    birthTime,
    birthTimezone,
    ...(body.targetBirthDate ? { targetBirthDate: body.targetBirthDate } : {}),
    ...(body.targetBirthTime ? { targetBirthTime: body.targetBirthTime } : {}),
    ...(body.targetBirthTimezone ? { targetBirthTimezone: body.targetBirthTimezone } : {}),
    ...(body.conflictDate ? { conflictDate: body.conflictDate } : {}),
  };

  console.info("[predict] Sending payload to edge", {
    requestId,
    payload: edgeRequestPayload,
  });

  const engineUrl = process.env.PYTHON_ENGINE_URL ?? `${process.env.VERCEL_URL ? `http://${process.env.VERCEL_URL}` : "http://localhost:5000"}/api/engine`;

  let enginePrediction: {
    explanation: string;
    date: string;
    dateIso: string;
    code?: string;
  };
  let enginePayloadForAudit: Record<string, unknown> | null = null;

  try {
    const edgeResponse = await fetch(engineUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-request-id": requestId,
      },
      body: JSON.stringify(edgeRequestPayload),
    });

    const rawEdgeResponse = await edgeResponse.text();
    let edgePayload: EngineFunctionSuccessResponse | EngineFunctionErrorResponse = {};

    try {
      edgePayload = JSON.parse(rawEdgeResponse) as EngineFunctionSuccessResponse | EngineFunctionErrorResponse;
    } catch {
      edgePayload = {};
    }

    console.info("[predict] Raw edge response", {
      requestId,
      status: edgeResponse.status,
      ok: edgeResponse.ok,
      rawEdgeResponse,
    });

    if (edgePayload && typeof edgePayload === "object") {
      enginePayloadForAudit = edgePayload as Record<string, unknown>;
    }

    if (!edgeResponse.ok) {
      const edgeErrorPayload = edgePayload as EngineFunctionErrorResponse;
      throw new Error(`${edgeErrorPayload.code ?? "PREDICTION_ENGINE_FAILED"}: ${edgeErrorPayload.error ?? "Falha no motor astrológico (edge function)."}`);
    }

    const edgeSuccessPayload = edgePayload as EngineFunctionSuccessResponse;

    if (!edgeSuccessPayload.prediction) {
      throw new Error("PREDICTION_ENGINE_FAILED: Resposta inválida da edge function (prediction ausente).");
    }

    enginePrediction = {
      explanation: edgeSuccessPayload.prediction,
      date: edgeSuccessPayload.eventDate,
      dateIso: edgeSuccessPayload.eventDateIso,
      code: edgeSuccessPayload.code,
    };
  } catch (error) {
    const details = error instanceof Error ? error.message : String(error);
    await refundIfNeeded();
    const [codeFromDetails] = details.split(":");
    const code = codeFromDetails && codeFromDetails.length > 0 ? codeFromDetails : "PREDICTION_ENGINE_FAILED";

    await writeAuditLog({
      success: false,
      engineCode: code,
      technicalDetails: {
        cache: false,
        details,
        enginePayload: enginePayloadForAudit,
        refundAttempted: true,
      },
    });

    return errorResponse(500, code, details);
  }

  const interpretedPrediction = enginePrediction.explanation;

  const { error: insertPredictionError } = await serviceClient.from("user_predictions").insert({
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
  });

  if (insertPredictionError) {
    await refundIfNeeded();

    await writeAuditLog({
      success: false,
      engineCode: "PREDICTION_PERSIST_FAILED",
      technicalDetails: {
        cache: false,
        stage: "user_predictions",
        details: `${insertPredictionError.code ?? "NO_CODE"} ${insertPredictionError.message}`,
        enginePayload: enginePayloadForAudit,
        refundAttempted: true,
      },
    });

    return errorResponse(
      500,
      "PREDICTION_PERSIST_FAILED",
      `insert user_predictions falhou: ${insertPredictionError.code ?? "NO_CODE"} ${insertPredictionError.message}`,
    );
  }

  const { error: insertHistoryError } = await serviceClient.from("user_prediction_history").insert({
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
  });

  if (insertHistoryError) {
    await refundIfNeeded();

    await writeAuditLog({
      success: false,
      engineCode: "PREDICTION_PERSIST_FAILED",
      technicalDetails: {
        cache: false,
        stage: "user_prediction_history",
        details: `${insertHistoryError.code ?? "NO_CODE"} ${insertHistoryError.message}`,
        enginePayload: enginePayloadForAudit,
        refundAttempted: true,
      },
    });

    return errorResponse(
      500,
      "PREDICTION_PERSIST_FAILED",
      `insert user_prediction_history falhou: ${insertHistoryError.code ?? "NO_CODE"} ${insertHistoryError.message}`,
    );
  }

  const response = NextResponse.json({
    prediction: interpretedPrediction,
    eventDate: enginePrediction.date,
    eventDateIso: enginePrediction.dateIso,
    remainingCredits: remainingAfterDebit,
    cached: false,
    engineCode: enginePrediction.code,
    requestId,
  });

  authResponse.cookies.getAll().forEach((cookie) => {
    response.cookies.set(cookie);
  });

  await writeAuditLog({
    success: true,
    engineCode: enginePrediction.code ?? "ASPECT_FOUND",
    technicalDetails: {
      cache: false,
      enginePayload: enginePayloadForAudit,
      transitPlanet: enginePayloadForAudit?.transitPlanet,
      natalPlanet: enginePayloadForAudit?.natalPlanet,
      orbDelta: enginePayloadForAudit?.orbDelta,
      aspectAngle: enginePayloadForAudit?.aspectAngle,
    },
  });

  return response;
}
