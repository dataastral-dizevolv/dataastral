import { ElevenLabsClient } from "@elevenlabs/elevenlabs-js";
import { NextResponse, type NextRequest } from "next/server";

export const runtime = "nodejs";

const IRIS_VOICE_ID = "ZP7ctTmcovXNUmOj695o";
const AUDIO_MODEL = "eleven_multilingual_v2";
const AUDIO_FORMAT = "mp3_44100_128";

interface ExportAudioRequestBody {
  audio_text?: string;
  text?: string;
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

export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => ({}))) as ExportAudioRequestBody;
  const sourceText = body.audio_text?.trim() || body.text?.trim() || "";
  const text = sanitizeNarrationText(sourceText);

  if (!text) {
    return NextResponse.json({ error: "Texto da previsão é obrigatório." }, { status: 400 });
  }

  if (text.length > 5000) {
    return NextResponse.json({ error: "Texto muito longo para gerar áudio." }, { status: 400 });
  }

  const apiKey = (process.env.ELEVENLABS_API_KEY || process.env.ELEVEN_LABS_API_KEY || "").trim();

  if (!apiKey) {
    return NextResponse.json({ error: "Serviço de áudio indisponível no momento." }, { status: 500 });
  }

  try {
    const elevenlabs = new ElevenLabsClient({ apiKey });
    const audioStream = await elevenlabs.textToSpeech.convert(
      IRIS_VOICE_ID,
      {
        text,
        modelId: AUDIO_MODEL,
        outputFormat: AUDIO_FORMAT,
      },
      {
        maxRetries: 2,
        timeoutInSeconds: 90,
      },
    );

    const audioBuffer = await new Response(audioStream).arrayBuffer();

    return new NextResponse(audioBuffer, {
      status: 200,
      headers: {
        "Content-Type": "audio/mpeg",
        "Cache-Control": "no-store",
      },
    });
  } catch {
    return NextResponse.json({ error: "Não foi possível gerar o áudio agora." }, { status: 502 });
  }
}
