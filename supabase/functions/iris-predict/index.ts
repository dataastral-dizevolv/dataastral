import { fromZonedTime } from "npm:date-fns-tz@3.2.0";
import { createClient } from "npm:@supabase/supabase-js@2";

type ThemeId = "amor" | "carreira" | "financas" | "saude" | "familia" | "viagens";
type SwissEph = Awaited<ReturnType<(typeof import("npm:@fusionstrings/swiss-eph"))["load"]>>;

interface AstrologyRule {
  id: number;
  theme_id: ThemeId;
  transit_planet_id: number;
  natal_planets: number[];
  aspect_angle: number;
  search_days: number;
  orb: number;
  template_text: string;
  priority: number;
  synastry_mode: boolean;
  requires_conflict_date: boolean;
  retrograde_logic: boolean;
}

const PLANET_IDS = {
  sun: 0,
  moon: 1,
  mercury: 2,
  venus: 3,
  mars: 4,
  jupiter: 5,
  saturn: 6,
  uranus: 7,
  neptune: 8,
  pluto: 9,
  chiron: 15,
} as const;

const PLANET_LABELS: Record<number, string> = {
  [PLANET_IDS.sun]: "Sol",
  [PLANET_IDS.moon]: "Lua",
  [PLANET_IDS.mercury]: "Mercúrio",
  [PLANET_IDS.venus]: "Vênus",
  [PLANET_IDS.mars]: "Marte",
  [PLANET_IDS.jupiter]: "Júpiter",
  [PLANET_IDS.saturn]: "Saturno",
  [PLANET_IDS.uranus]: "Urano",
  [PLANET_IDS.neptune]: "Netuno",
  [PLANET_IDS.pluto]: "Plutão",
  [PLANET_IDS.chiron]: "Quíron",
};

const ASPECT_LABELS: Record<number, string> = {
  0: "conjunção",
  60: "sextil",
  90: "quadratura",
  120: "trígono",
  150: "quincúncio",
  180: "oposição",
};

const SWISS_FLAGS = 2 | 256;
const SE_GREG_CAL = 1;
const JD_UNIX_EPOCH = 2440587.5;
const SWISS_WASM_URL = `${Deno.env.get("SUPABASE_URL") ?? ""}/storage/v1/object/public/engine-assets/swiss/swiss_eph.wasm`;

let ephPromise: Promise<SwissEph> | null = null;

const supabaseUrl = Deno.env.get("SUPABASE_URL");
const supabaseServiceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

const supabase =
  supabaseUrl && supabaseServiceRoleKey
    ? createClient(supabaseUrl, supabaseServiceRoleKey, {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
        },
      })
    : null;

class IrisEngineError extends Error {
  code: string;

  constructor(code: string, message: string) {
    super(message);
    this.code = code;
    this.name = "IrisEngineError";
  }
}

async function getEph() {
  if (!ephPromise) {
    ephPromise = (async () => {
      const mod = await import("npm:@fusionstrings/swiss-eph");
      const response = await fetch(SWISS_WASM_URL);

      if (!response.ok) {
        throw new IrisEngineError("ENGINE_WASM_FETCH_FAILED", `Falha ao baixar WASM (${response.status}).`);
      }

      const wasmSource = new Uint8Array(await response.arrayBuffer());
      return await mod.load({ wasmSource });
    })().catch((error) => {
      ephPromise = null;
      throw new IrisEngineError("ENGINE_IMPORT_FAILED", `Falha ao carregar SwissEph: ${String(error)}`);
    });
  }

  return await ephPromise;
}

function normalizeBirthDate(birthDate: string) {
  if (/^\d{4}-\d{2}-\d{2}$/.test(birthDate)) return birthDate;
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(birthDate)) {
    const [day, month, year] = birthDate.split("/");
    return `${year}-${month}-${day}`;
  }
  throw new IrisEngineError("INVALID_BIRTH_DATE_FORMAT", "Use YYYY-MM-DD ou DD/MM/YYYY para data de nascimento.");
}

function normalizeBirthTime(birthTime?: string) {
  if (!birthTime || birthTime.length === 0) return "12:00";
  if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(birthTime)) {
    throw new IrisEngineError("INVALID_BIRTH_TIME_FORMAT", "Use HH:mm para hora de nascimento.");
  }
  return birthTime;
}

function normalizeBirthTimezone(birthTimezone?: string | null) {
  const normalizedTimezone = birthTimezone?.trim();

  if (!normalizedTimezone) {
    throw new IrisEngineError("MISSING_BIRTH_TIMEZONE", "Timezone de nascimento obrigatório.");
  }

  return normalizedTimezone;
}

function normalizeAngleDiff(a: number, b: number) {
  let diff = Math.abs(a - b);
  if (diff > 180) diff = 360 - diff;
  return diff;
}

function formatUtcDateLabel(isoDate: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(isoDate));
}

function jdToIso(jdUt: number) {
  return new Date((jdUt - JD_UNIX_EPOCH) * 86400000).toISOString();
}

function isValidModernJd(value: number) {
  return Number.isFinite(value) && value > 2400000;
}

function asFiniteNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim().length > 0) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  if (Array.isArray(value) && value.length > 0) return asFiniteNumber(value[0]);
  return null;
}

function coerceJulianDayUt(result: {
  returnCode?: number;
  ut?: unknown;
  et?: unknown;
  tjd?: unknown;
}): number | null {
  const candidates: unknown[] = [result.ut, result.et];
  if (Array.isArray(result.tjd)) {
    candidates.push(result.tjd[1], result.tjd[0]);
  }

  for (const candidate of candidates) {
    const numeric = asFiniteNumber(candidate);
    if (numeric != null && isValidModernJd(numeric)) return numeric;
  }

  return null;
}

function julianDayFromUtcDate(eph: SwissEph, utcDate: Date): number {
  const year = utcDate.getUTCFullYear();
  const month = utcDate.getUTCMonth() + 1;
  const day = utcDate.getUTCDate();
  const hour = utcDate.getUTCHours();
  const minute = utcDate.getUTCMinutes();
  const second = utcDate.getUTCSeconds();
  const hourFloat = hour + minute / 60 + second / 3600;

  try {
    const result = eph.swe_utc_to_jd(year, month, day, hour, minute, second, SE_GREG_CAL);
    const fromUtc = coerceJulianDayUt(result);
    if (fromUtc != null) return fromUtc;
  } catch {
    // Swiss UTC conversion is best-effort; julday / calendar fallbacks below.
  }

  try {
    const fromJulday = asFiniteNumber(eph.swe_julday(year, month, day, hourFloat, SE_GREG_CAL));
    if (fromJulday != null && isValidModernJd(fromJulday)) return fromJulday;
  } catch {
    // Calendar formula is the last resort.
  }

  const fallback = dateToJulianDay({ year, month, day, hour, minute, second });
  if (isValidModernJd(fallback)) return fallback;

  throw new IrisEngineError("INVALID_BIRTH_JD", "Falha ao calcular JD natal do usuário.");
}

function dateToJulianDay(input: {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  second: number;
}) {
  let { year, month } = input;
  const { day, hour, minute, second } = input;

  if (month <= 2) {
    year -= 1;
    month += 12;
  }

  const a = Math.floor(year / 100);
  const b = 2 - a + Math.floor(a / 4);
  const dayFraction = (hour + minute / 60 + second / 3600) / 24;

  return (
    Math.floor(365.25 * (year + 4716)) +
    Math.floor(30.6001 * (month + 1)) +
    day +
    b -
    1524.5 +
    dayFraction
  );
}

async function getJulianDayUtc(input: { birthDate: string; birthTime?: string; birthTimezone?: string | null }) {
  const birthDate = normalizeBirthDate(input.birthDate);
  const birthTime = normalizeBirthTime(input.birthTime);
  const timezone = normalizeBirthTimezone(input.birthTimezone);

  let utcDate: Date;
  try {
    utcDate = fromZonedTime(`${birthDate}T${birthTime}:00`, timezone);
  } catch {
    throw new IrisEngineError("INVALID_TIMEZONE", "Timezone de nascimento inválido.");
  }

  if (Number.isNaN(utcDate.getTime())) {
    throw new IrisEngineError("INVALID_BIRTH_DATETIME", "Data/hora de nascimento inválida.");
  }

  const eph = await getEph();
  return julianDayFromUtcDate(eph, utcDate);
}

async function getNatalPositions(jdUt: number, natalPlanetIds: number[]) {
  const eph = await getEph();
  const uniqueIds = Array.from(new Set(natalPlanetIds));
  const positions: Record<number, number> = {};

  for (const planetId of uniqueIds) {
    const calc = eph.swe_calc_ut(jdUt, planetId, SWISS_FLAGS);

    if (!Number.isFinite(calc.xx[0])) {
      throw new IrisEngineError("ENGINE_NATAL_CALC_FAILED", calc.error || `Falha em posicao natal do planeta ${planetId}.`);
    }

    positions[planetId] = calc.xx[0];
  }

  return positions;
}

async function getTodayJdUt() {
  const eph = await getEph();
  const now = new Date();
  const utcMidnight = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  try {
    return julianDayFromUtcDate(eph, utcMidnight);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new IrisEngineError("ENGINE_TODAY_JD_FAILED", message);
  }
}

async function findNextAspect(input: {
  startJdUt: number;
  natalPositions: Record<number, number>;
  transitPlanet: number;
  aspectAngle: number;
  orb: number;
  searchDays: number;
}) {
  const eph = await getEph();

  for (let offset = 1; offset <= input.searchDays; offset += 1) {
    const jdUt = input.startJdUt + offset;
    const transit = eph.swe_calc_ut(jdUt, input.transitPlanet, SWISS_FLAGS);

    if (!Number.isFinite(transit.xx[0])) {
      continue;
    }

    for (const [natalPlanetId, natalPosition] of Object.entries(input.natalPositions)) {
      const natalId = Number(natalPlanetId);
      const diff = normalizeAngleDiff(transit.xx[0], natalPosition);

      if (Math.abs(diff - input.aspectAngle) < input.orb) {
        return {
          dateIso: jdToIso(jdUt),
          transitPlanetId: input.transitPlanet,
          natalPlanetId: natalId,
          aspectAngle: input.aspectAngle,
        };
      }
    }
  }

  return null;
}

async function isPlanetRetrograde(jdUt: number, planetId: number) {
  const eph = await getEph();
  const calc = eph.swe_calc_ut(jdUt, planetId, SWISS_FLAGS);
  const speed = calc.xx[3];
  return Number.isFinite(speed) && speed < 0;
}

async function getPlanetLongitude(jdUt: number, planetId: number) {
  const eph = await getEph();
  const calc = eph.swe_calc_ut(jdUt, planetId, SWISS_FLAGS);
  return Number.isFinite(calc.xx[0]) ? calc.xx[0] : null;
}

async function findReturnToLongitude(input: {
  startJdUt: number;
  transitPlanet: number;
  targetLongitude: number;
  orb: number;
  searchDays: number;
}) {
  const eph = await getEph();

  for (let offset = 1; offset <= input.searchDays; offset += 1) {
    const jdUt = input.startJdUt + offset;
    const transit = eph.swe_calc_ut(jdUt, input.transitPlanet, SWISS_FLAGS);

    if (!Number.isFinite(transit.xx[0])) {
      continue;
    }

    const diff = normalizeAngleDiff(transit.xx[0], input.targetLongitude);

    if (diff < input.orb) {
      return {
        dateIso: jdToIso(jdUt),
        transitPlanetId: input.transitPlanet,
      };
    }
  }

  return null;
}

function renderTemplate(template: string, context: {
  transitPlanet: string;
  natalPlanet: string;
  aspect: string;
  aspectAngle: number;
}) {
  return template
    .split("{transit_planet}").join(context.transitPlanet)
    .split("{natal_planet}").join(context.natalPlanet)
    .split("{aspect}").join(context.aspect)
    .split("{aspect_angle}").join(String(context.aspectAngle));
}

async function getRulesByTheme(theme: ThemeId, requestId: string): Promise<AstrologyRule[]> {
  if (!supabase) {
    throw new IrisEngineError("RULES_DB_MISCONFIGURED", "SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY ausentes na edge function.");
  }

  const { data, error } = await supabase
    .from("astrology_rules")
    .select(
      "id, theme_id, transit_planet_id, natal_planets, aspect_angle, search_days, orb, template_text, priority, synastry_mode, requires_conflict_date, retrograde_logic",
    )
    .eq("theme_id", theme)
    .eq("active", true)
    .order("priority", { ascending: true })
    .order("id", { ascending: true });

  if (error) {
    throw new IrisEngineError("RULES_DB_FETCH_FAILED", `Falha ao carregar regras do banco: ${error.message}`);
  }

  const rules = (data ?? []) as AstrologyRule[];

  console.info("[iris-predict] Rules loaded", {
    requestId,
    theme,
    count: rules.length,
    ruleIds: rules.map((rule) => rule.id),
  });

  return rules;
}

interface PredictBody {
  theme?: ThemeId;
  question?: string;
  birthDate?: string;
  birthTime?: string;
  birthTimezone?: string | null;
  targetBirthDate?: string;
  targetBirthTime?: string;
  targetBirthTimezone?: string | null;
  conflictDate?: string;
}

async function runEngine(
  body: Required<Pick<PredictBody, "theme" | "question" | "birthDate">> &
    Pick<
      PredictBody,
      "birthTime" | "birthTimezone" | "targetBirthDate" | "targetBirthTime" | "targetBirthTimezone" | "conflictDate"
    >,
  requestId: string,
) {
  let conflictJdUt: number | null = null;

  const rules = await getRulesByTheme(body.theme, requestId);

  if (rules.length === 0) {
    return {
        prediction: "Este tema ainda não possui regras cadastradas no motor.",
        eventDate: "Tema em calibração",
      eventDateIso: "",
      code: "NO_RULES_FOR_THEME",
    };
  }

  const natalPlanetIds = rules.flatMap((rule) => rule.natal_planets);
  const userJdUt = await getJulianDayUtc(body);

  if (!isValidModernJd(userJdUt)) {
    throw new IrisEngineError("INVALID_BIRTH_JD", "Falha ao calcular JD natal do usuário.");
  }

  const userNatal = await getNatalPositions(userJdUt, natalPlanetIds);
  let targetNatal: Record<number, number> | null = null;

  if (body.targetBirthDate?.trim() && body.targetBirthTimezone?.trim()) {
    try {
      const targetJdUt = await getJulianDayUtc({
        birthDate: body.targetBirthDate.trim(),
        birthTime: body.targetBirthTime,
        birthTimezone: body.targetBirthTimezone,
      });

      if (isValidModernJd(targetJdUt)) {
        targetNatal = await getNatalPositions(targetJdUt, natalPlanetIds);
      } else {
        targetNatal = null;
      }
    } catch {
      targetNatal = null;
    }
  }

  if (body.conflictDate?.trim()) {
    try {
      const conflictDate = normalizeBirthDate(body.conflictDate.trim());
      const conflictUtcDate = fromZonedTime(`${conflictDate}T12:00:00`, "Etc/UTC");

      if (Number.isNaN(conflictUtcDate.getTime())) {
        throw new IrisEngineError("INVALID_CONFLICT_DATE", "Data de conflito inválida.");
      }

      const calculatedConflictJdUt = dateToJulianDay({
        year: conflictUtcDate.getUTCFullYear(),
        month: conflictUtcDate.getUTCMonth() + 1,
        day: conflictUtcDate.getUTCDate(),
        hour: conflictUtcDate.getUTCHours(),
        minute: conflictUtcDate.getUTCMinutes(),
        second: conflictUtcDate.getUTCSeconds(),
      });

      conflictJdUt = isValidModernJd(calculatedConflictJdUt) ? calculatedConflictJdUt : null;
    } catch {
      conflictJdUt = null;
    }
  }

  const startJdUt = await getTodayJdUt();

  console.info("[iris-predict] Starting metadata-driven run", {
    requestId,
    theme: body.theme,
    questionLength: body.question.length,
    hasBirthDate: Boolean(body.birthDate?.trim()),
    hasBirthTime: Boolean(body.birthTime?.trim()),
    hasBirthTimezone: Boolean(body.birthTimezone?.trim()),
    hasSynastryTarget: Boolean(body.targetBirthDate?.trim()),
    hasConflictDate: Boolean(body.conflictDate?.trim()),
  });

  for (const rule of rules) {
    if (rule.synastry_mode && !targetNatal) {
      console.warn("[iris-predict] Skipping synastry rule without target map", {
        requestId,
        ruleId: rule.id,
      });
      continue;
    }

    if (rule.retrograde_logic) {
      if (conflictJdUt === null) {
        continue;
      }

      const wasMercuryRetrograde = await isPlanetRetrograde(conflictJdUt, PLANET_IDS.mercury);

      if (!wasMercuryRetrograde) {
        continue;
      }

      const conflictLongitude = await getPlanetLongitude(conflictJdUt, PLANET_IDS.mercury);

      if (conflictLongitude === null) {
        continue;
      }

      const returnEvent = await findReturnToLongitude({
        startJdUt,
        transitPlanet: PLANET_IDS.mercury,
        targetLongitude: conflictLongitude,
        orb: Number(rule.orb),
        searchDays: rule.search_days,
      });

      if (!returnEvent) {
        continue;
      }

      const mercuryLabel = PLANET_LABELS[PLANET_IDS.mercury] ?? "Mercúrio";
      const prediction = renderTemplate(rule.template_text, {
        transitPlanet: mercuryLabel,
        natalPlanet: mercuryLabel,
        aspect: "retorno ao grau do conflito",
        aspectAngle: 0,
      });

      console.info("[iris-predict] Retrograde return found", {
        requestId,
        ruleId: rule.id,
        conflictLongitude,
        eventDateIso: returnEvent.dateIso,
      });

      return {
        prediction,
        eventDate: formatUtcDateLabel(returnEvent.dateIso),
        eventDateIso: returnEvent.dateIso,
        code: "RETROGRADE_RETURN_FOUND",
      };
    }

    const natalToUse = rule.synastry_mode ? targetNatal : userNatal;

    if (!natalToUse) {
      continue;
    }

    const event = await findNextAspect({
      startJdUt,
      natalPositions: natalToUse,
      transitPlanet: rule.transit_planet_id,
      aspectAngle: rule.aspect_angle,
      orb: Number(rule.orb),
      searchDays: rule.search_days,
    });

    if (!event) {
      continue;
    }

    const transitPlanet = PLANET_LABELS[event.transitPlanetId] ?? `Planeta ${event.transitPlanetId}`;
    const natalPlanet = PLANET_LABELS[event.natalPlanetId] ?? `Planeta ${event.natalPlanetId}`;
    const aspect = ASPECT_LABELS[event.aspectAngle] ?? `${event.aspectAngle} graus`;
    const prediction = renderTemplate(rule.template_text, {
      transitPlanet,
      natalPlanet,
      aspect,
      aspectAngle: event.aspectAngle,
    });

    console.info("[iris-predict] Rule match found", {
      requestId,
      ruleId: rule.id,
      searchDays: rule.search_days,
      transitPlanet,
      natalPlanet,
      aspectAngle: event.aspectAngle,
      eventDateIso: event.dateIso,
    });

    return {
      prediction,
      eventDate: formatUtcDateLabel(event.dateIso),
      eventDateIso: event.dateIso,
      code: "ASPECT_FOUND",
    };
  }

  console.info("[iris-predict] No relevant aspect found", {
    requestId,
    theme: body.theme,
    checkedRules: rules.length,
  });

  if (body.theme === "financas") {
    return {
      prediction: "Tente outra pergunta.",
      eventDate: "Nenhum trânsito maior encontrado nos próximos 5 anos.",
      eventDateIso: "",
      code: "NO_RELEVANT_ASPECT_FOUND",
    };
  }

  if (body.theme === "amor") {
    return {
      prediction: "Tente outra pergunta.",
      eventDate: "Nenhum trânsito maior para um novo amor encontrado no próximo ano.",
      eventDateIso: "",
      code: "NO_RELEVANT_ASPECT_FOUND",
    };
  }

  return {
    prediction: "Este tema será liberado na próxima iteração do motor Iris.",
    eventDate: "Tema em calibração",
    eventDateIso: "",
    code: "THEME_IN_CALIBRATION",
  };
}

Deno.serve(async (request: Request) => {
  const requestId = request.headers.get("x-request-id") ?? crypto.randomUUID();

  const incomingToken = request.headers.get("x-internal-engine-token") ?? "";
  const expectedToken = Deno.env.get("ENGINE_INTERNAL_TOKEN")?.trim() ?? "";
  if (expectedToken && incomingToken !== expectedToken) {
    return new Response(
      JSON.stringify({ error: "Não autorizado.", code: "UNAUTHORIZED", requestId }),
      { status: 401, headers: { "Content-Type": "application/json" } },
    );
  }

  if (request.method !== "POST") {
    return new Response(JSON.stringify({ error: "Método não permitido", code: "METHOD_NOT_ALLOWED", requestId }), {
      status: 405,
      headers: { "Content-Type": "application/json" },
    });
  }

  const body = (await request.json().catch(() => ({}))) as PredictBody;

  console.info("[iris-predict] Incoming request", {
    requestId,
    theme: body.theme,
    questionLength: body.question?.trim().length ?? 0,
    hasBirthDate: Boolean(body.birthDate?.trim()),
    hasBirthTime: Boolean(body.birthTime?.trim()),
    hasBirthTimezone: Boolean(body.birthTimezone?.trim()),
    hasSynastryTarget: Boolean(body.targetBirthDate?.trim()),
    hasConflictDate: Boolean(body.conflictDate?.trim()),
  });

  if (!body.theme) return new Response(JSON.stringify({ error: "Tema inválido.", code: "INVALID_THEME", requestId }), { status: 400, headers: { "Content-Type": "application/json" } });
  if (!body.question?.trim()) return new Response(JSON.stringify({ error: "Pergunta obrigatória.", code: "INVALID_QUESTION", requestId }), { status: 400, headers: { "Content-Type": "application/json" } });
  if (!body.birthDate) return new Response(JSON.stringify({ error: "Data de nascimento obrigatória.", code: "INVALID_BIRTH_DATE", requestId }), { status: 400, headers: { "Content-Type": "application/json" } });
  if (!body.birthTimezone?.trim()) return new Response(JSON.stringify({ error: "Timezone de nascimento obrigatório.", code: "INVALID_BIRTH_TIMEZONE", requestId }), { status: 400, headers: { "Content-Type": "application/json" } });

  try {
    const result = await runEngine(
      {
        theme: body.theme,
        question: body.question.trim(),
        birthDate: body.birthDate,
        birthTime: body.birthTime,
        birthTimezone: body.birthTimezone,
        targetBirthDate: body.targetBirthDate,
        targetBirthTime: body.targetBirthTime,
        targetBirthTimezone: body.targetBirthTimezone,
        conflictDate: body.conflictDate,
      },
      requestId,
    );

    return new Response(JSON.stringify({ ...result, requestId }), { status: 200, headers: { "Content-Type": "application/json" } });
  } catch (error) {
    const code = error instanceof IrisEngineError ? error.code : "ENGINE_UNKNOWN";
    console.error("[iris-predict] Engine execution failed", {
      requestId,
      code,
      operation: "runEngine",
      hasErrorObject: error instanceof Error,
    });
    return new Response(JSON.stringify({ error: "Falha no motor astrológico.", code, requestId }), { status: 500, headers: { "Content-Type": "application/json" } });
  }
});
