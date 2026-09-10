export const THEME_IDS = ["amor", "carreira", "financas", "saude", "familia", "viagens"] as const;
export type ThemeId = (typeof THEME_IDS)[number];
export const CALIBRATION_THEMES = new Set<ThemeId>(["carreira", "saude", "familia", "viagens"]);
export const GENDER_IDS = ["homem", "mulher", "nao_binario"] as const;

export const MAX_QUESTION_LENGTH = 300;
export const MAX_LOCATION_LENGTH = 200;
export const MAX_TIMEZONE_LENGTH = 80;
export const MAX_PLACE_QUERY_LENGTH = 200;
export const MAX_PACKAGE_ID_LENGTH = 64;

export const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function isCalendarDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }

  const date = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

export function isClockTime(value: string) {
  if (value.length === 0) {
    return true;
  }

  return /^([01]\d|2[0-3]):[0-5]\d$/.test(value);
}

export function isUuid(value: string) {
  return UUID_RE.test(value);
}

export function normalizeDynamicAnswers(input: unknown) {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    return null;
  }

  const entries = Object.entries(input as Record<string, unknown>).slice(0, 50);
  const output: Record<string, unknown> = {};

  for (const [key, value] of entries) {
    const safeKey = key.trim().slice(0, 80);

    if (!safeKey) {
      continue;
    }

    if (typeof value === "string") {
      output[safeKey] = value.slice(0, 500);
      continue;
    }

    if (Array.isArray(value)) {
      output[safeKey] = value
        .filter((item): item is string => typeof item === "string")
        .slice(0, 20)
        .map((item) => item.slice(0, 200));
      continue;
    }

    if (typeof value === "number" && Number.isFinite(value)) {
      output[safeKey] = value;
      continue;
    }

    if (typeof value === "boolean" || value === null) {
      output[safeKey] = value;
    }
  }

  return Object.keys(output).length > 0 ? output : null;
}
