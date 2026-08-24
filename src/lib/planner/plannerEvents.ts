import { getCurrentPosition, PLANET_LABELS_PT, PLANET_SYMBOLS } from "@/lib/astrology/ephemeris";
import { startOfDay } from "@/lib/planner/dates";

export type EventTheme = "financeiro" | "amor" | "saude" | "viagens" | "geral";
export type EventChannel = "sky" | "personal" | "external";
export type EventKind = "ingress" | "retrograde" | "moon" | "aspect" | "external";
export type EventTone = "sorte" | "tenso" | "neutro" | "suave";

export interface PlannerEvent {
  id: string;
  tone: EventTone;
  title: string;
  start: Date;
  end: Date;
  channel: EventChannel;
  theme: EventTheme;
  kind: EventKind;
  body?: string;
  description: string;
  advice: string;
  color: string;
  meta?: Record<string, unknown>;
}

export const THEME_COLORS: Record<EventTheme, string> = {
  financeiro: "hsl(38 70% 55%)",
  amor: "hsl(340 65% 65%)",
  saude: "hsl(150 40% 50%)",
  viagens: "hsl(210 65% 60%)",
  geral: "hsl(220 15% 55%)",
};

export const THEME_LABELS: Record<EventTheme, string> = {
  financeiro: "Financeiro",
  amor: "Amor",
  saude: "Saúde",
  viagens: "Viagens",
  geral: "Geral",
};

export const TONE_COLORS: Record<EventTone, string> = {
  sorte: "hsl(145 55% 42%)",
  tenso: "hsl(4 68% 52%)",
  neutro: "hsl(43 85% 52%)",
  suave: "hsl(210 70% 55%)",
};

export const TONE_LABELS: Record<EventTone, string> = {
  sorte: "Sorte e oportunidade",
  tenso: "Momento tenso",
  neutro: "Neutralidade",
  suave: "Energias suaves e positivas",
};

const BODY_TONE: Record<string, EventTone> = {
  sun: "suave",
  moon: "suave",
  mercury: "neutro",
  venus: "sorte",
  mars: "tenso",
  jupiter: "sorte",
  saturn: "tenso",
  uranus: "neutro",
  neptune: "neutro",
  pluto: "tenso",
};

export function toneFor(kind: EventKind, body?: string): EventTone {
  if (kind === "retrograde") return "tenso";
  if (kind === "moon") return "suave";
  if (kind === "external") return "neutro";
  return (body && BODY_TONE[body]) || "neutro";
}

const BODY_THEME: Record<string, EventTheme> = {
  sun: "saude",
  moon: "amor",
  mercury: "viagens",
  venus: "amor",
  mars: "saude",
  jupiter: "financeiro",
  saturn: "financeiro",
  uranus: "geral",
  neptune: "geral",
  pluto: "geral",
};

const DAY = 86400000;

function noon(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 12, 0, 0, 0);
}

function bodyKey(planet: string): string {
  return planet === "sun" ? "earth" : planet;
}

const PLANETS_TRANSIT = ["sun", "moon", "mercury", "venus", "mars", "jupiter", "saturn"];
const PLANETS_RETRO = ["mercury", "venus", "mars", "jupiter", "saturn", "uranus", "neptune", "pluto"];

interface OpenRange {
  start: Date;
  sign: string;
  retro: boolean;
}

function ingressAdvice(planet: string, sign: string): string {
  const label = PLANET_LABELS_PT[planet];
  return `Enquanto ${label} transita em ${sign}, aproveite esta fase para se alinhar aos temas do signo. Observe onde essa energia se manifesta na sua rotina e escolha ações conscientes que aproveitem o clima do céu.`;
}

function retroAdvice(planet: string): string {
  const label = PLANET_LABELS_PT[planet];
  return `${label} retrógrado convida a revisar, refazer e reconectar temas ligados a este planeta. Não é momento de iniciar — é momento de aprofundar. Volte a projetos parados, releia contratos, refine detalhes.`;
}

export function generateSkyEvents(from: Date, to: Date): PlannerEvent[] {
  const events: PlannerEvent[] = [];
  const start = startOfDay(from);
  const end = startOfDay(to);

  const openIngress: Record<string, OpenRange | null> = {};
  const openRetro: Record<string, OpenRange | null> = {};

  for (const planet of PLANETS_TRANSIT) {
    const pos = getCurrentPosition(bodyKey(planet), noon(start));
    openIngress[planet] = { start: new Date(start), sign: pos.signName, retro: pos.retrograde };
  }
  for (const planet of PLANETS_RETRO) {
    const pos = getCurrentPosition(planet, noon(start));
    if (pos.retrograde) {
      openRetro[planet] = { start: new Date(start), sign: pos.signName, retro: true };
    }
  }

  const day = new Date(start.getTime() + DAY);
  while (day <= end) {
    const d = noon(day);

    for (const planet of PLANETS_TRANSIT) {
      const pos = getCurrentPosition(bodyKey(planet), d);
      const cur = openIngress[planet];
      if (cur && pos.signName !== cur.sign) {
        events.push({
          id: `sky-ingress-${planet}-${cur.sign}-${cur.start.toISOString().slice(0, 10)}`,
          title: `${PLANET_SYMBOLS[planet]} ${PLANET_LABELS_PT[planet]} em ${cur.sign}`,
          start: cur.start,
          end: new Date(day.getTime() - DAY),
          channel: "sky",
          theme: BODY_THEME[planet] || "geral",
          kind: "ingress",
          tone: toneFor("ingress", planet),
          body: planet,
          description: `${PLANET_LABELS_PT[planet]} percorreu ${cur.sign} deste ${cur.start.toLocaleDateString("pt-BR")} até este dia. Agora entra em ${pos.signName}.`,
          advice: ingressAdvice(planet, cur.sign),
          color: TONE_COLORS[toneFor("ingress", planet)],
        });
        openIngress[planet] = { start: new Date(day), sign: pos.signName, retro: pos.retrograde };
      }
    }

    for (const planet of PLANETS_RETRO) {
      const pos = getCurrentPosition(planet, d);
      const cur = openRetro[planet];
      if (pos.retrograde && !cur) {
        openRetro[planet] = { start: new Date(day), sign: pos.signName, retro: true };
      } else if (!pos.retrograde && cur) {
        events.push({
          id: `sky-retro-${planet}-${cur.start.toISOString().slice(0, 10)}`,
          title: `${PLANET_SYMBOLS[planet]} ${PLANET_LABELS_PT[planet]} retrógrado`,
          start: cur.start,
          end: new Date(day.getTime() - DAY),
          channel: "sky",
          theme: BODY_THEME[planet] || "geral",
          kind: "retrograde",
          tone: "tenso",
          body: planet,
          description: `${PLANET_LABELS_PT[planet]} esteve retrógrado neste período. Uma janela cósmica para revisar, ajustar e refinar temas ligados a ${PLANET_LABELS_PT[planet]}.`,
          advice: retroAdvice(planet),
          color: TONE_COLORS[toneFor("retrograde", planet)],
        });
        openRetro[planet] = null;
      }
    }

    const phase = detectMoonPhase(day);
    if (phase) {
      events.push({
        id: `sky-moon-${phase}-${day.toISOString().slice(0, 10)}`,
        title: `☽ ${phase}`,
        start: new Date(day),
        end: new Date(day),
        channel: "sky",
        theme: "amor",
        kind: "moon",
        tone: "suave",
        body: "moon",
        description: `${phase} — momento de ${phaseIntent(phase)} conforme o ciclo lunar.`,
        advice: phaseAdvice(phase),
        color: TONE_COLORS.suave,
      });
    }

    day.setTime(day.getTime() + DAY);
  }

  for (const planet of PLANETS_TRANSIT) {
    const cur = openIngress[planet];
    if (cur) {
      events.push({
        id: `sky-ingress-${planet}-${cur.sign}-${cur.start.toISOString().slice(0, 10)}`,
        title: `${PLANET_SYMBOLS[planet]} ${PLANET_LABELS_PT[planet]} em ${cur.sign}`,
        start: cur.start,
        end: new Date(end),
        channel: "sky",
        theme: BODY_THEME[planet] || "geral",
        kind: "ingress",
        tone: toneFor("ingress", planet),
        body: planet,
        description: `${PLANET_LABELS_PT[planet]} atravessa ${cur.sign} durante este período.`,
        advice: ingressAdvice(planet, cur.sign),
        color: TONE_COLORS[toneFor("ingress", planet)],
      });
    }
  }

  for (const planet of PLANETS_RETRO) {
    const cur = openRetro[planet];
    if (cur) {
      events.push({
        id: `sky-retro-${planet}-${cur.start.toISOString().slice(0, 10)}`,
        title: `${PLANET_SYMBOLS[planet]} ${PLANET_LABELS_PT[planet]} retrógrado`,
        start: cur.start,
        end: new Date(end),
        channel: "sky",
        theme: BODY_THEME[planet] || "geral",
        kind: "retrograde",
        tone: "tenso",
        body: planet,
        description: `${PLANET_LABELS_PT[planet]} continua retrógrado neste período.`,
        advice: retroAdvice(planet),
        color: TONE_COLORS[toneFor("retrograde", planet)],
      });
    }
  }

  return events;
}

function moonSunAngle(date: Date): number {
  const moon = getCurrentPosition("moon", date).longitude;
  const sun = getCurrentPosition("earth", date).longitude;
  return ((moon - sun) % 360 + 360) % 360;
}

type Phase = "Lua Nova" | "Quarto Crescente" | "Lua Cheia" | "Quarto Minguante";

function detectMoonPhase(date: Date): Phase | null {
  const today = moonSunAngle(noon(date));
  const prev = moonSunAngle(noon(new Date(date.getTime() - DAY)));
  const targets: Array<[number, Phase]> = [
    [0, "Lua Nova"],
    [90, "Quarto Crescente"],
    [180, "Lua Cheia"],
    [270, "Quarto Minguante"],
  ];
  for (const [target, label] of targets) {
    const a = (prev - target + 540) % 360 - 180;
    const b = (today - target + 540) % 360 - 180;
    if (a < 0 && b >= 0 && Math.abs(b - a) < 20) return label;
  }
  return null;
}

function phaseIntent(phase: Phase): string {
  switch (phase) {
    case "Lua Nova":
      return "plantar intenções e recomeçar";
    case "Quarto Crescente":
      return "agir e superar resistências";
    case "Lua Cheia":
      return "colher, celebrar e liberar";
    case "Quarto Minguante":
      return "revisar, soltar e integrar";
  }
}

function phaseAdvice(phase: Phase): string {
  switch (phase) {
    case "Lua Nova":
      return "Escreva o que deseja iniciar. Movimente pequenos passos alinhados a essa intenção.";
    case "Quarto Crescente":
      return "Enfrente o obstáculo que apareceu — ele mostra o próximo movimento necessário.";
    case "Lua Cheia":
      return "Reconheça o que floresceu. Compartilhe, celebre, e observe o que já não serve.";
    case "Quarto Minguante":
      return "Solte hábitos, contratos ou histórias que pesam. Faça espaço para o próximo ciclo.";
  }
}
