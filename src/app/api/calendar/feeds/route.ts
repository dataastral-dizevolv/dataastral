import { NextResponse, type NextRequest } from "next/server";

import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { normalizeIcalUrl } from "@/lib/planner/safeIcalUrl";
import type { ICalFeed } from "@/types/calendar";

const PRESET_COLORS = new Set([
  "hsl(211 45% 53%)",
  "hsl(330 20% 40%)",
  "hsl(155 25% 62%)",
  "hsl(35 68% 58%)",
  "hsl(10 55% 50%)",
  "hsl(210 30% 58%)",
]);

interface CreateFeedBody {
  label?: string;
  url?: string;
  color?: string;
}

async function ensureProfile(userId: string) {
  const admin = createAdminClient();
  const { error } = await admin.from("profiles").upsert(
    { id: userId, updated_at: new Date().toISOString() },
    { onConflict: "id" },
  );
  if (error) {
    throw error;
  }
}

function mapFeed(row: ICalFeed): ICalFeed {
  return {
    id: row.id,
    label: row.label,
    url: row.url,
    color: row.color,
    active: row.active,
  };
}

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }

  const { data, error } = await supabase
    .from("user_ical_feeds")
    .select("id,label,url,color,active")
    .eq("user_id", user.id)
    .order("created_at", { ascending: true });

  if (error) {
    return NextResponse.json({ error: "Falha ao carregar agendas." }, { status: 500 });
  }

  return NextResponse.json((data ?? []).map((row) => mapFeed(row as ICalFeed)));
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }

  const body = (await request.json().catch(() => ({}))) as CreateFeedBody;
  const label = body.label?.trim() ?? "";
  const color = PRESET_COLORS.has(body.color ?? "") ? (body.color as string) : "hsl(211 45% 53%)";
  const parsedUrl = normalizeIcalUrl(body.url ?? "");

  if (label.length < 1 || label.length > 80) {
    return NextResponse.json({ error: "Informe um rótulo de até 80 caracteres." }, { status: 400 });
  }

  if (!parsedUrl) {
    return NextResponse.json({ error: "Informe uma URL iCal pública válida (https)." }, { status: 400 });
  }

  try {
    await ensureProfile(user.id);
  } catch {
    return NextResponse.json({ error: "Falha ao preparar o perfil para agendas." }, { status: 500 });
  }

  const { data, error } = await supabase
    .from("user_ical_feeds")
    .insert({
      user_id: user.id,
      label,
      url: parsedUrl.toString(),
      color,
      active: true,
    })
    .select("id,label,url,color,active")
    .single();

  if (error || !data) {
    return NextResponse.json({ error: "Não foi possível salvar a agenda." }, { status: 500 });
  }

  return NextResponse.json(mapFeed(data as ICalFeed));
}

export async function DELETE(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }

  const id = request.nextUrl.searchParams.get("id")?.trim() ?? "";
  if (!/^[0-9a-f-]{36}$/i.test(id)) {
    return NextResponse.json({ error: "Identificador inválido." }, { status: 400 });
  }

  const { error } = await supabase.from("user_ical_feeds").delete().eq("id", id).eq("user_id", user.id);

  if (error) {
    return NextResponse.json({ error: "Erro ao remover agenda." }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
