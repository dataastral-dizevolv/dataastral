import { parseIsoDate } from "@/lib/planner/dates";
import { TONE_COLORS, type EventTone, type PlannerEvent } from "@/lib/planner/plannerEvents";
import type { EphemerisEvent, EphemerisEventType } from "@/types/dashboard";
import type { ParsedICalEvent } from "@/lib/planner/icalParser";
import type { ICalFeed } from "@/types/calendar";

const TYPE_TO_TONE: Record<EphemerisEventType, EventTone> = {
  tensao: "tenso",
  harmonia: "sorte",
  portal: "suave",
  neutro: "neutro",
};

export const TONE_TO_TYPE: Record<EventTone, EphemerisEventType> = {
  tenso: "tensao",
  sorte: "harmonia",
  suave: "portal",
  neutro: "neutro",
};

export function ephemerisToPlannerEvent(event: EphemerisEvent): PlannerEvent {
  const tone = TYPE_TO_TONE[event.tipo];
  const start = parseIsoDate(event.data);
  return {
    id: `personal-${event.id}`,
    title: event.titulo,
    start,
    end: start,
    channel: "personal",
    theme: "geral",
    kind: "aspect",
    tone,
    description: event.descricao,
    advice: event.descricao,
    color: TONE_COLORS[tone],
    meta: { ephemerisId: event.id, tipo: event.tipo },
  };
}

export function icalToPlannerEvent(feed: ICalFeed, event: ParsedICalEvent): PlannerEvent {
  return {
    id: `${feed.id}-${event.uid}`,
    title: event.summary,
    start: event.start,
    end: event.end,
    channel: "external",
    theme: "geral",
    tone: "neutro",
    kind: "external",
    description: `Evento importado de ${feed.label}.`,
    advice: "Prepare-se com antecedência e observe como este compromisso dialoga com o céu do dia.",
    color: feed.color,
    meta: { source: feed.label },
  };
}
