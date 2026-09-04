import { NextResponse, type NextRequest } from "next/server";

import { createClient } from "@/lib/supabase/server";
import { normalizeIcalUrl } from "@/lib/planner/safeIcalUrl";

const MAX_ICS_BYTES = 2_000_000;

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }

  const body = (await request.json().catch(() => ({}))) as { url?: string };
  const parsedUrl = normalizeIcalUrl(body.url ?? "");

  if (!parsedUrl) {
    return NextResponse.json({ error: "URL iCal inválida." }, { status: 400 });
  }

  const { data: owned } = await supabase
    .from("user_ical_feeds")
    .select("id")
    .eq("user_id", user.id)
    .eq("url", parsedUrl.toString())
    .maybeSingle();

  if (!owned) {
    return NextResponse.json({ error: "Agenda não encontrada nesta conta." }, { status: 403 });
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10_000);
    const upstream = await fetch(parsedUrl.toString(), {
      headers: { Accept: "text/calendar, text/plain, */*" },
      signal: controller.signal,
      redirect: "follow",
    }).finally(() => clearTimeout(timeout));

    if (!upstream.ok) {
      return NextResponse.json({ error: "Não foi possível ler a agenda externa." }, { status: 502 });
    }

    const buffer = await upstream.arrayBuffer();
    if (buffer.byteLength > MAX_ICS_BYTES) {
      return NextResponse.json({ error: "Arquivo iCal grande demais." }, { status: 413 });
    }

    const ics = new TextDecoder().decode(buffer);
    if (!/BEGIN:VCALENDAR/i.test(ics)) {
      return NextResponse.json({ error: "O endereço não devolveu um calendário iCal." }, { status: 422 });
    }

    return NextResponse.json({ ics });
  } catch {
    return NextResponse.json({ error: "Falha ao sincronizar a agenda." }, { status: 502 });
  }
}
