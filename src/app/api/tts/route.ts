import { ElevenLabsClient } from "@elevenlabs/elevenlabs-js";
import { NextResponse, type NextRequest } from "next/server";

import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

interface TtsRequestBody {
  predictionId?: string;
  eventId?: string;
  eventDate?: string;
  audio_text?: string;
  text?: string;
}

const AUDIO_BUCKET = "astral-audio";
const AUDIO_MODEL = "eleven_multilingual_v2";
const AUDIO_FORMAT = "mp3_44100_128";
const AUDIO_URL_TTL_SECONDS = 60 * 60;
const ELEVENLABS_TEST_VOICE_ID = "pNInz6obpgDQGcFmaJgB";

function normalizeEventId(value: string) {
  const safe = value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_+|_+$/g, "");

  return safe.length > 0 ? safe.slice(0, 80) : "evento";
}

function normalizeEventDate(value: string) {
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return value;
  }

  const now = new Date();
  const yyyy = String(now.getUTCFullYear());
  const mm = String(now.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(now.getUTCDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function normalizePredictionId(value: string) {
  const safe = value.trim().toLowerCase();
  if (/^[a-f0-9-]{8,64}$/.test(safe)) {
    return safe;
  }
  return "";
}

function sanitizeNarrationText(input: string) {
  return input
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/\{[^}]*\}/g, " ")
    .replace(/\[[^\]]*\]\([^)]*\)/g, " ")
    .replace(/[#>*_~]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

async function ensureAudioBucket() {
  const admin = createAdminClient();
  const { data: buckets, error: listError } = await admin.storage.listBuckets();

  if (listError) {
    throw new Error("STORAGE_BUCKET_LIST_FAILED");
  }

  if ((buckets ?? []).some((bucket) => bucket.id === AUDIO_BUCKET)) {
    return;
  }

  const { error: createError } = await admin.storage.createBucket(AUDIO_BUCKET, {
    public: false,
    fileSizeLimit: 10 * 1024 * 1024,
    allowedMimeTypes: ["audio/mpeg"],
  });

  if (createError && !createError.message.toLowerCase().includes("already exists")) {
    throw new Error("STORAGE_BUCKET_CREATE_FAILED");
  }
}

function getErrorStatusCode(error: unknown) {
  if (typeof error === "object" && error !== null) {
    const maybeStatusCode = (error as { statusCode?: unknown }).statusCode;
    if (typeof maybeStatusCode === "number") {
      return maybeStatusCode;
    }
  }

  return null;
}

export async function POST(request: NextRequest) {
  const requestId = crypto.randomUUID();
  const startedAt = Date.now();
  const body = (await request.json().catch(() => ({}))) as TtsRequestBody;
  const predictionIdRaw = body.predictionId?.trim() ?? "";
  const eventIdRaw = body.eventId?.trim() ?? "";
  const eventDateRaw = body.eventDate?.trim() ?? "";
  const audioTextRaw = body.audio_text?.trim() ?? "";
  const textRaw = body.text?.trim() ?? "";
  const sourceTextRaw = audioTextRaw || textRaw;

  if (!sourceTextRaw || (!predictionIdRaw && (!eventIdRaw || !eventDateRaw))) {
    return NextResponse.json(
      { error: "Parâmetros obrigatórios: audio_text/text e predictionId (ou eventId + eventDate).", code: "INVALID_TTS_INPUT" },
      { status: 400 },
    );
  }

  const elevenLabsApiKey = (process.env.ELEVENLABS_API_KEY || process.env.ELEVEN_LABS_API_KEY || "").trim();
  const voiceId = (process.env.ELEVENLABS_VOICE_ID || "").trim() || ELEVENLABS_TEST_VOICE_ID;

  if (!elevenLabsApiKey) {
    return NextResponse.json(
      { error: "Narração indisponível no momento (chave ElevenLabs ausente).", code: "TTS_MISCONFIGURED" },
      { status: 500 },
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Não autenticado.", code: "AUTH_REQUIRED" }, { status: 401 });
  }

  const predictionId = predictionIdRaw ? normalizePredictionId(predictionIdRaw) : "";

  if (predictionIdRaw && !predictionId) {
    return NextResponse.json(
      { error: "predictionId inválido.", code: "INVALID_TTS_PREDICTION_ID" },
      { status: 400 },
    );
  }

  const eventId = normalizeEventId(eventIdRaw || predictionId || "evento");
  const eventDate = normalizeEventDate(eventDateRaw || new Date().toISOString().slice(0, 10));
  const narrationText = sanitizeNarrationText(sourceTextRaw);

  if (!narrationText) {
    return NextResponse.json(
      { error: "Conteúdo narrativo inválido para conversão.", code: "INVALID_TTS_TEXT" },
      { status: 400 },
    );
  }

  const narrationTextLimited = narrationText.slice(0, 5000);
  const monthFolder = eventDate.slice(0, 7).replace("-", "_");
  const fileName = predictionId ? `${predictionId}.mp3` : `briefing_${eventDate.replaceAll("-", "_")}_${eventId}.mp3`;
  const objectPath = predictionId
    ? `${user.id}/predictions/${fileName}`
    : `${user.id}/${monthFolder}/${fileName}`;
  const admin = createAdminClient();

  try {
    await ensureAudioBucket();
  } catch {
    return NextResponse.json(
      { error: "Serviço de áudio indisponível no armazenamento.", code: "STORAGE_UNAVAILABLE" },
      { status: 503 },
    );
  }

  const folderPath = predictionId ? `${user.id}/predictions` : `${user.id}/${monthFolder}`;
  const { data: existingFiles, error: listError } = await admin.storage.from(AUDIO_BUCKET).list(folderPath, {
    limit: 100,
    search: fileName,
  });

  if (listError) {
    return NextResponse.json(
      { error: "Falha ao consultar cache de áudio.", code: "STORAGE_LIST_FAILED" },
      { status: 500 },
    );
  }

  const cachedFile = (existingFiles ?? []).some((item) => item.name === fileName);

  if (cachedFile) {
    const { data: signedData, error: signedError } = await admin.storage
      .from(AUDIO_BUCKET)
      .createSignedUrl(objectPath, AUDIO_URL_TTL_SECONDS);

    if (signedError || !signedData?.signedUrl) {
      return NextResponse.json(
        { error: "Falha ao recuperar áudio em cache.", code: "STORAGE_SIGNED_URL_FAILED" },
        { status: 500 },
      );
    }

    return NextResponse.json({
      audioUrl: signedData.signedUrl,
      cached: true,
      key: objectPath,
    });
  }

  try {
    const elevenlabs = new ElevenLabsClient({
      apiKey: elevenLabsApiKey,
    });

    const audioStream = await elevenlabs.textToSpeech.convert(
      voiceId,
      {
        text: narrationTextLimited,
        modelId: AUDIO_MODEL,
        outputFormat: AUDIO_FORMAT,
      },
      {
        maxRetries: 0,
        timeoutInSeconds: 90,
      },
    );

    const audioArrayBuffer = await new Response(audioStream).arrayBuffer();
    const audioBuffer = Buffer.from(audioArrayBuffer);

    if (audioBuffer.byteLength === 0) {
      return NextResponse.json(
        { error: "Não foi possível gerar áudio agora.", code: "TTS_EMPTY_AUDIO" },
        { status: 502 },
      );
    }

    const { error: uploadError } = await admin.storage.from(AUDIO_BUCKET).upload(objectPath, audioBuffer, {
      contentType: "audio/mpeg",
      cacheControl: "2592000",
      upsert: false,
    });

    if (uploadError) {
      return NextResponse.json(
        { error: "Falha ao salvar áudio no cache.", code: "STORAGE_UPLOAD_FAILED" },
        { status: 500 },
      );
    }

    const { data: signedData, error: signedError } = await admin.storage
      .from(AUDIO_BUCKET)
      .createSignedUrl(objectPath, AUDIO_URL_TTL_SECONDS);

    if (signedError || !signedData?.signedUrl) {
      return NextResponse.json(
        { error: "Áudio gerado, mas não foi possível obter link.", code: "STORAGE_SIGNED_URL_FAILED" },
        { status: 500 },
      );
    }

    return NextResponse.json({
      audioUrl: signedData.signedUrl,
      cached: false,
      key: objectPath,
    });
  } catch (error) {
    const statusCode = getErrorStatusCode(error);
    const errorMessage = error instanceof Error ? error.message.toLowerCase() : "";
    const durationMs = Date.now() - startedAt;

    if (statusCode === 429 || statusCode === 402 || errorMessage.includes("quota")) {
      console.error("[tts] ElevenLabs 429/402", {
        requestId,
        operation: "tts_generate",
        provider: "elevenlabs",
        code: "TTS_QUOTA_EXCEEDED",
        status: statusCode ?? 429,
        statusCode,
        predictionId: predictionId || null,
        textLength: narrationTextLimited.length,
        durationMs,
      });
      return NextResponse.json(
        { error: "Limite de narração atingido no momento. Tente novamente em instantes.", code: "TTS_QUOTA_EXCEEDED" },
        { status: 429 },
      );
    }

    console.error("[tts] ElevenLabs provider error", {
      requestId,
      operation: "tts_generate",
      provider: "elevenlabs",
      code: "TTS_PROVIDER_FAILED",
      status: statusCode ?? 502,
      statusCode,
      predictionId: predictionId || null,
      textLength: narrationTextLimited.length,
      durationMs,
    });

    return NextResponse.json(
      { error: "Não foi possível gerar a narração agora.", code: "TTS_PROVIDER_FAILED" },
      { status: 502 },
    );
  }
}
