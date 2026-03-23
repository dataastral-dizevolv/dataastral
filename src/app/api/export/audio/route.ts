import OpenAI from "openai";
import { NextResponse, type NextRequest } from "next/server";

export const runtime = "nodejs";

interface ExportAudioRequestBody {
  text?: string;
}

export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => ({}))) as ExportAudioRequestBody;
  const text = body.text?.trim() ?? "";

  if (!text) {
    return NextResponse.json({ error: "Texto da previsão é obrigatório." }, { status: 400 });
  }

  if (text.length > 5000) {
    return NextResponse.json({ error: "Texto muito longo para gerar áudio." }, { status: 400 });
  }

  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    return NextResponse.json({ error: "Serviço de áudio indisponível no momento." }, { status: 500 });
  }

  try {
    const openai = new OpenAI({ apiKey });
    const speech = await openai.audio.speech.create({
      model: "gpt-4o-mini-tts",
      voice: "alloy",
      response_format: "mp3",
      input: text,
    });

    const audioBuffer = await speech.arrayBuffer();

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
