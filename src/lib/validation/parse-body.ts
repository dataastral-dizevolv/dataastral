import type { z } from "zod";

const FIELD_ERRORS: Record<string, { code: string; error: string }> = {
  theme: { code: "INVALID_THEME", error: "Tema inválido." },
  question: { code: "INVALID_QUESTION", error: "Pergunta inválida." },
  birthDate: { code: "INVALID_BIRTH_DATE", error: "Data de nascimento inválida." },
  birthTime: { code: "INVALID_BIRTH_TIME", error: "Hora deve estar no formato HH:mm." },
  birthTimezone: { code: "INVALID_BIRTH_TIMEZONE", error: "Timezone inválido." },
  birthLocation: { code: "INVALID_BIRTH_LOCATION", error: "Local de nascimento inválido." },
  placeQuery: { code: "INVALID_PLACE_QUERY", error: "Consulta de local muito longa." },
  birthLat: { code: "INVALID_BIRTH_COORDINATES", error: "Coordenadas inválidas." },
  birthLng: { code: "INVALID_BIRTH_COORDINATES", error: "Coordenadas inválidas." },
  targetBirthDate: { code: "INVALID_TARGET_BIRTH_DATE", error: "Data da outra pessoa inválida." },
  targetBirthTime: { code: "INVALID_TARGET_BIRTH_TIME", error: "Hora da outra pessoa deve estar no formato HH:mm." },
  targetBirthTimezone: { code: "INVALID_TARGET_BIRTH_TIMEZONE", error: "Timezone da outra pessoa inválido." },
  conflictDate: { code: "INVALID_CONFLICT_DATE", error: "Data do conflito inválida." },
  packageId: { code: "INVALID_PACKAGE", error: "Pacote de créditos inválido ou inativo." },
  uiMode: { code: "INVALID_UI_MODE", error: "Modo de checkout inválido." },
  userId: { code: "INVALID_USER_ID", error: "Usuário inválido." },
  amount: { code: "INVALID_AMOUNT", error: "Parâmetros inválidos para crédito." },
};

export function parseApiBody<S extends z.ZodTypeAny>(schema: S, raw: unknown) {
  const result = schema.safeParse(raw);

  if (result.success) {
    return { ok: true as const, data: result.data as z.infer<S> };
  }

  const path = result.error.issues[0]?.path[0];
  const mapped =
    typeof path === "string" && FIELD_ERRORS[path]
      ? FIELD_ERRORS[path]
      : { code: "INVALID_BODY", error: "Dados inválidos." };

  return { ok: false as const, code: mapped.code, error: mapped.error };
}
