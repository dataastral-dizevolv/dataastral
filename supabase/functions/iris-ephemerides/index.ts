import { fromZonedTime } from "npm:date-fns-tz@3.2.0";
import { createClient } from "npm:@supabase/supabase-js@2";

type SwissEph = Awaited<ReturnType<(typeof import("npm:@fusionstrings/swiss-eph"))["load"]>>;

const SWISS_FLAGS = 2 | 256;
const SE_GREG_CAL = 1;
const SWISS_WASM_URL = "https://oyftaljsgnybquwvcwrq.supabase.co/storage/v1/object/public/engine-assets/swiss/swiss_eph.wasm";

const PLANET_LABELS: Record<number, string> = {
  0: "Sol",
  1: "Lua",
  2: "Mercúrio",
  3: "Vênus",
  4: "Marte",
  5: "Júpiter",
  6: "Saturno",
  7: "Urano",
  8: "Netuno",
  9: "Plutão",
  15: "Quíron",
};

interface EphemerisEvent {
  id: string;
  data: string;
  titulo: string;
  descricao: string;
  tipo: "tensao" | "harmonia" | "portal" | "neutro";
  planeta?: string;
  aspecto?: string;
}

interface AstrologyRule {
  id: number;
  theme_id: string;
  transit_planet_id: number;
  natal_planets: number[];
  aspect_angle: number;
  search_days: number;
  orb: number;
  template_text: string;
  priority: number;
}

interface RequestBody {
  year?: number;
  month?: number;
  birthDate?: string;
  birthTime?: string;
  birthTimezone?: string;
}

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

async function getEph() {
  if (!ephPromise) {
    ephPromise = (async () => {
      const mod = await import("npm:@fusionstrings/swiss-eph");
      const response = await fetch(SWISS_WASM_URL);

      if (!response.ok) {
        throw new Error(`WASM download failed (${response.status})`);
      }

      const wasmSource = new Uint8Array(await response.arrayBuffer());
      return await mod.load({ wasmSource });
    })();
  }

  return await ephPromise;
}

function normalizeAngleDiff(a: number, b: number) {
  let diff = Math.abs(a - b);
  if (diff > 180) diff = 360 - diff;
  return diff;
}

function dateIso(year: number, month: number, day: number) {
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function daysInMonth(year: number, month: number) {
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

function parseBirthDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    throw new Error("birthDate inválida");
  }

  const [year, month, day] = value.split("-").map(Number);
  return { year, month, day };
}

function parseBirthTime(value?: string) {
  if (!value || value.length === 0) {
    return { hour: 12, minute: 0 };
  }

  const parts = value.split(":");
  const hour = Number(parts[0]);
  const minute = Number(parts[1]);

  if (!Number.isFinite(hour) || !Number.isFinite(minute)) {
    throw new Error("birthTime inválida");
  }

  return { hour, minute };
}

function renderTemplate(template: string, context: { transitPlanet: string; natalPlanet: string; aspect: string; aspectAngle: number }) {
  return template
    .split("{transit_planet}").join(context.transitPlanet)
    .split("{natal_planet}").join(context.natalPlanet)
    .split("{aspect}").join(context.aspect)
    .split("{aspect_angle}").join(String(context.aspectAngle));
}

async function getRules(): Promise<AstrologyRule[]> {
  if (!supabase) {
    throw new Error("SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY ausentes");
  }

  const { data, error } = await supabase
    .from("astrology_rules")
    .select("id, theme_id, transit_planet_id, natal_planets, aspect_angle, search_days, orb, template_text, priority")
    .in("theme_id", ["financas", "amor"])
    .eq("active", true)
    .order("priority", { ascending: true })
    .order("id", { ascending: true });

  if (error) {
    throw new Error(`Falha ao carregar regras: ${error.message}`);
  }

  return (data ?? []) as AstrologyRule[];
}

async function getNatalPositions(jdUt: number, planetIds: number[]) {
  const eph = await getEph();
  const positions: Record<number, number> = {};

  for (const planetId of Array.from(new Set(planetIds))) {
    const calc = eph.swe_calc_ut(jdUt, planetId, SWISS_FLAGS);
    if (!Number.isFinite(calc.xx[0])) continue;
    positions[planetId] = calc.xx[0];
  }

  return positions;
}

async function getJulianDayFromBirth(input: { birthDate: string; birthTime?: string; birthTimezone: string }) {
  const { year, month, day } = parseBirthDate(input.birthDate);
  const { hour, minute } = parseBirthTime(input.birthTime);
  const utc = fromZonedTime(`${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}T${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}:00`, input.birthTimezone);
  const eph = await getEph();
  const jd = eph.swe_utc_to_jd(
    utc.getUTCFullYear(),
    utc.getUTCMonth() + 1,
    utc.getUTCDate(),
    utc.getUTCHours(),
    utc.getUTCMinutes(),
    utc.getUTCSeconds(),
    SE_GREG_CAL,
  );

  if (jd.returnCode < 0) {
    throw new Error(jd.error || "Falha ao converter data natal");
  }

  return jd.ut;
}

async function getTodayJd() {
  const now = new Date();
  const eph = await getEph();
  const jd = eph.swe_utc_to_jd(now.getUTCFullYear(), now.getUTCMonth() + 1, now.getUTCDate(), 0, 0, 0, SE_GREG_CAL);

  if (jd.returnCode < 0) {
    throw new Error(jd.error || "Falha ao calcular JD atual");
  }

  return jd.ut;
}

async function computeMonthEphemerides(body: RequestBody) {
  const year = Number(body.year);
  const month = Number(body.month);
  const birthDate = (body.birthDate ?? "").trim();
  const birthTimezone = (body.birthTimezone ?? "").trim();

  if (!Number.isFinite(year) || !Number.isFinite(month) || year < 1900 || year > 2200 || month < 1 || month > 12) {
    throw new Error("Parâmetros inválidos.");
  }

  if (!birthDate || !birthTimezone) {
    throw new Error("birthDate e birthTimezone são obrigatórios.");
  }

  const rules = await getRules();
  if (rules.length === 0) {
    return [] as EphemerisEvent[];
  }

  const natalPlanetIds = rules.flatMap((rule) => rule.natal_planets);
  const natalJd = await getJulianDayFromBirth({ birthDate, birthTime: body.birthTime, birthTimezone });
  const natalPositions = await getNatalPositions(natalJd, natalPlanetIds);
  const startJd = await getTodayJd();

  const eph = await getEph();
  const totalDays = daysInMonth(year, month);
  const events: EphemerisEvent[] = [];
  const dedupe = new Set<string>();

  for (let day = 1; day <= totalDays; day += 1) {
    const jd = eph.swe_julday(year, month, day, 0, SE_GREG_CAL);

    if (jd <= startJd) {
      continue;
    }

    const date = dateIso(year, month, day);

    for (const rule of rules) {
      if (jd - startJd > rule.search_days) {
        continue;
      }

      const transit = eph.swe_calc_ut(jd, rule.transit_planet_id, SWISS_FLAGS);
      if (!Number.isFinite(transit.xx[0])) {
        continue;
      }

      const transitPlanet = PLANET_LABELS[rule.transit_planet_id] ?? `Planeta ${rule.transit_planet_id}`;

      for (const natalPlanetId of rule.natal_planets) {
        const natalPos = natalPositions[natalPlanetId];

        if (!Number.isFinite(natalPos)) {
          continue;
        }

        const diff = normalizeAngleDiff(transit.xx[0], natalPos);

        if (Math.abs(diff - rule.aspect_angle) >= Number(rule.orb)) {
          continue;
        }

        const natalPlanet = PLANET_LABELS[natalPlanetId] ?? `Planeta ${natalPlanetId}`;
        const aspect = rule.aspect_angle === 0 ? "conjunção" : "trígono";
        const aspectLabel = rule.aspect_angle === 0 ? "conjunção" : "trígono";
        const key = `${date}-${rule.id}-${natalPlanetId}-${rule.aspect_angle}`;

        if (dedupe.has(key)) {
          continue;
        }

        dedupe.add(key);

        events.push({
          id: key,
          data: date,
          titulo: `${transitPlanet} em ${aspectLabel} com ${natalPlanet}`,
          descricao: renderTemplate(rule.template_text, {
            transitPlanet,
            natalPlanet,
            aspect,
            aspectAngle: rule.aspect_angle,
          }),
          tipo: rule.aspect_angle === 0 ? "portal" : "harmonia",
          planeta: transitPlanet,
          aspecto: aspectLabel,
        });
      }
    }
  }

  return events.sort((a, b) => a.data.localeCompare(b.data));
}

Deno.serve(async (request: Request) => {
  if (request.method !== "POST") {
    return new Response(JSON.stringify({ error: "Método não permitido", code: "METHOD_NOT_ALLOWED" }), {
      status: 405,
      headers: { "Content-Type": "application/json" },
    });
  }

  const body = (await request.json().catch(() => ({}))) as RequestBody;

  try {
    const events = await computeMonthEphemerides(body);
    return new Response(JSON.stringify({ events }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(
      JSON.stringify({
        error: "Falha no cálculo de efemérides.",
        code: "EPHEMERIDES_ENGINE_FAILED",
        detail: String(error),
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      },
    );
  }
});
