interface EnrichInput {
  predictionText: string;
  eventDate: string;
}

const MODEL = "deepseek/deepseek-v4-flash:free";
const TIMEOUT_MS = 30_000;

export async function enrichText(input: EnrichInput): Promise<string> {
  if (!process.env.OPENROUTER_API_KEY) {
    return input.predictionText;
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  const prompt = `Você é uma astróloga com escrita poética e acolhedora.
Com base nos dados astrológicos abaixo, reescreva a interpretação em um parágrafo único de 3 a 5 linhas, fluido e envolvente.

REGRAS OBRIGATÓRIAS:
- Preserve EXATAMENTE os planetas, aspectos e datas mencionados no texto original
- Não invente informações astrológicas
- Incorpore naturalmente o texto de base no parágrafo
- Tom: caloroso, esperançoso, direto ao ponto
- Idioma: português brasileiro

Dados:
- Data do evento: ${input.eventDate}
- Interpretação de base: ${input.predictionText}

Retorne apenas o parágrafo, sem título, sem introdução, sem aspas.`;

  try {
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
        "HTTP-Referer": process.env.NEXT_PUBLIC_APP_URL ?? process.env.NEXT_PUBLIC_SITE_URL ?? "https://localhost:3000",
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 300,
        messages: [{ role: "user", content: prompt }],
      }),
      signal: controller.signal,
    });

    const rawText = await response.text();

    if (!response.ok) {
      console.log("[enrichText] Erro HTTP, usando original", { status: response.status });
      return input.predictionText;
    }

    let json: { choices?: { message?: { content?: string } }[] };
    try {
      json = JSON.parse(rawText) as typeof json;
    } catch {
      console.log("[enrichText] JSON inválido, usando original");
      return input.predictionText;
    }

    const enriched = json?.choices?.[0]?.message?.content?.trim();
    if (!enriched) {
      console.log("[enrichText] Resposta vazia, usando original");
      return input.predictionText;
    }

    console.log("[enrichText] Sucesso", { chars: enriched.length });
    return enriched;
  } catch (err: unknown) {
    const isTimeout = err instanceof Error && err.name === "AbortError";
    console.log("[enrichText] Falha, usando original", {
      motivo: isTimeout ? "timeout 30s" : "erro de rede",
    });
    return input.predictionText;
  } finally {
    clearTimeout(timer);
  }
}
