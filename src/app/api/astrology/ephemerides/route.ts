import { NextResponse, type NextRequest } from "next/server";

import { createClient } from "@/lib/supabase/server";
import type { EphemerisEvent } from "@/types/dashboard";

interface EphemeridesResponse {
  events: EphemerisEvent[];
}

interface EphemeridesError {
  error: string;
  code?: string;
}

function maskUserId(value: string) {
  if (value.length <= 10) return "***";
  return `${value.slice(0, 6)}***${value.slice(-4)}`;
}

export async function GET(request: NextRequest) {
  const requestId = crypto.randomUUID();
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }

  const year = Number(request.nextUrl.searchParams.get("year") ?? "");
  const month = Number(request.nextUrl.searchParams.get("month") ?? "");

  if (!Number.isFinite(year) || !Number.isFinite(month) || year < 1900 || year > 2200 || month < 1 || month > 12) {
    return NextResponse.json({ error: "Parâmetros inválidos." }, { status: 400 });
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("birth_date, birth_time, birth_timezone")
    .eq("id", user.id)
    .maybeSingle();

  if (profileError) {
    return NextResponse.json({ error: "Falha ao carregar dados natais do perfil." }, { status: 500 });
  }

  const hasBirthData = Boolean(profile?.birth_date && profile.birth_timezone);

  console.info("[ephemerides] Buscando efemerides", {
    userIdMasked: maskUserId(user.id),
    birthDataStatus: hasBirthData ? "OK" : "Faltando",
    year,
    month,
  });

  if (!profile?.birth_date || !profile.birth_timezone) {
    return NextResponse.json(
      {
        error: "Para ver seu calendário personalizado, complete seus dados de nascimento no Perfil.",
        code: "MISSING_BIRTH_DATA",
      },
      { status: 422 },
    );
  }

  const pythonBaseUrl = process.env.PYTHON_ENGINE_URL?.replace(/\/api\/engine$/, "") ??
    (process.env.VERCEL_URL ? `http://${process.env.VERCEL_URL}` : "http://localhost:5000");
  const internalEngineToken = process.env.ENGINE_INTERNAL_TOKEN?.trim() || "";
  const isProduction = process.env.VERCEL_ENV === "production" || process.env.NODE_ENV === "production";

  if (isProduction && !internalEngineToken) {
    return NextResponse.json(
      { error: "Serviço temporariamente indisponível.", code: "ENGINE_NOT_CONFIGURED", requestId },
      { status: 500 },
    );
  }

  let response: Response;
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 20_000);
    response = await fetch(`${pythonBaseUrl}/api/ephemerides`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-request-id": requestId,
        "x-internal-engine-token": internalEngineToken,
      },
      body: JSON.stringify({
        year,
        month,
        birthDate: profile.birth_date,
        birthTime: profile.birth_time,
        birthTimezone: profile.birth_timezone,
      }),
      signal: controller.signal,
    }).finally(() => clearTimeout(timeout));
  } catch (error) {
    const code = error instanceof Error && error.name === "AbortError" ? "ENGINE_TIMEOUT" : "EPHEMERIDES_FAILED";
    return NextResponse.json(
      { error: "Falha ao calcular efemérides.", code, requestId },
      { status: 500 },
    );
  }

  const payload = (await response.json().catch(() => ({}))) as EphemeridesResponse | EphemeridesError;

  if (!response.ok) {
    return NextResponse.json(
      { error: "Falha ao calcular efemérides.", code: "EPHEMERIDES_FAILED", requestId },
      { status: 500 },
    );
  }

  const successPayload = payload as EphemeridesResponse;
  const allowedTypes = new Set(["harmonia", "tensao", "portal", "neutro"]);

  const events = (successPayload.events ?? []).flatMap((event, index) => {
    if (!event || typeof event !== "object") {
      return [];
    }

    const id = typeof event.id === "string" && event.id.length > 0 ? event.id : `${year}-${month}-${index}`;
    const data = typeof event.data === "string" ? event.data : "";
    const titulo = typeof event.titulo === "string" ? event.titulo : "Evento astrológico";
    const descricao = typeof event.descricao === "string" ? event.descricao : "Sem descrição detalhada para esta data.";
    const tipo = typeof event.tipo === "string" && allowedTypes.has(event.tipo) ? event.tipo : "neutro";

    if (!/^\d{4}-\d{2}-\d{2}$/.test(data)) {
      return [];
    }

    return [
      {
        id,
        data,
        titulo,
        descricao,
        tipo,
        planeta: event.planeta,
        aspecto: event.aspecto,
      } satisfies EphemerisEvent,
    ];
  });

  return NextResponse.json(events);
}
