import { NextResponse, type NextRequest } from "next/server";

import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { isLikelyPhone, isLikelyWhatsapp, normalizePhoneCountry, toStoredPhone, toStoredWhatsapp } from "@/lib/profile/phone";

interface UpdateProfileBody {
  fullName?: string;
  birthDate?: string;
  birthTime?: string;
  birthLocation?: string;
  birthTimezone?: string;
  birthLat?: number;
  birthLng?: number;
  phone?: string;
  phoneCountry?: string;
  whatsapp?: string;
}

function isValidDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }

  const date = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

function isValidTime(value: string) {
  return /^([01]\d|2[0-3]):[0-5]\d$/.test(value);
}

export async function PATCH(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }

  const body = (await request.json().catch(() => ({}))) as UpdateProfileBody;
  const fullName = body.fullName?.trim() ?? "";
  const birthDate = body.birthDate?.trim() ?? "";
  const birthTime = body.birthTime?.trim() ?? "";
  const birthLocation = body.birthLocation?.trim() ?? "";
  const birthTimezone = body.birthTimezone?.trim() ?? "";
  const birthLat = body.birthLat;
  const birthLng = body.birthLng;
  const hasPhoneFields = Object.hasOwn(body, "phone") || Object.hasOwn(body, "phoneCountry");
  const hasWhatsappField = Object.hasOwn(body, "whatsapp");
  const phoneCountry = hasPhoneFields ? normalizePhoneCountry(body.phoneCountry ?? "+55") : undefined;
  const phone = hasPhoneFields ? toStoredPhone(phoneCountry ?? "+55", body.phone ?? "") : undefined;
  const whatsapp = hasWhatsappField ? toStoredWhatsapp(body.whatsapp ?? "", phoneCountry ?? "+55") : undefined;

  if (birthDate.length > 0 && !isValidDate(birthDate)) {
    return NextResponse.json({ error: "Data de nascimento inválida." }, { status: 400 });
  }

  if (birthTime.length > 0 && !isValidTime(birthTime)) {
    return NextResponse.json({ error: "Hora deve estar no formato HH:mm." }, { status: 400 });
  }

  if ((birthLat != null && !Number.isFinite(birthLat)) || (birthLng != null && !Number.isFinite(birthLng))) {
    return NextResponse.json({ error: "Coordenadas inválidas." }, { status: 400 });
  }

  if (birthLocation.length > 0 && (birthLat == null || birthLng == null || birthTimezone.length === 0)) {
    return NextResponse.json({ error: "Selecione uma localização válida da lista." }, { status: 400 });
  }

  if (phone !== undefined && !isLikelyPhone(phone)) {
    return NextResponse.json({ error: "Informe um celular válido." }, { status: 400 });
  }

  if (whatsapp !== undefined && !isLikelyWhatsapp(whatsapp)) {
    return NextResponse.json({ error: "Informe um WhatsApp válido, com DDI." }, { status: 400 });
  }

  let adminClient: ReturnType<typeof createAdminClient>;

  try {
    adminClient = createAdminClient();
  } catch {
    return NextResponse.json({ error: "Servidor sem permissão de atualização." }, { status: 500 });
  }

  const profilePayload = {
    id: user.id,
    full_name: fullName.length > 0 ? fullName : null,
    birth_date: birthDate.length > 0 ? birthDate : null,
    birth_time: birthTime.length > 0 ? birthTime : null,
    birth_location: birthLocation.length > 0 ? birthLocation : null,
    birth_timezone: birthTimezone.length > 0 ? birthTimezone : null,
    birth_lat: birthLat ?? null,
    birth_lng: birthLng ?? null,
    updated_at: new Date().toISOString(),
    ...(hasPhoneFields ? { phone, phone_country: phoneCountry } : {}),
    ...(hasWhatsappField ? { whatsapp } : {}),
  };

  const { error: profileError } = await adminClient.from("profiles").upsert(profilePayload, { onConflict: "id" });

  if (profileError) {
    if (profileError.code === "23505") {
      return NextResponse.json({ error: "Este celular já está em uso em outra conta." }, { status: 409 });
    }

    return NextResponse.json({ error: "Falha ao salvar perfil." }, { status: 500 });
  }

  const { error: userProfileError } = await adminClient
    .from("user_profiles")
    .upsert({ id: user.id, full_name: profilePayload.full_name }, { onConflict: "id" });

  if (userProfileError) {
    return NextResponse.json({ error: "Perfil salvo parcialmente." }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
