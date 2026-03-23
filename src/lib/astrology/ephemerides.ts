import type { EphemerisEvent } from "@/types/dashboard";

const EVENT_PRIORITY: Record<EphemerisEvent["tipo"], number> = {
  portal: 4,
  tensao: 3,
  harmonia: 2,
  neutro: 1,
};

export function getTodayRelevantEvent(eventos: EphemerisEvent[], todayIso: string) {
  return eventos
    .filter((evento) => evento.data === todayIso)
    .sort((a, b) => EVENT_PRIORITY[b.tipo] - EVENT_PRIORITY[a.tipo])[0] ?? null;
}
