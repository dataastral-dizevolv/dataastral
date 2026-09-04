"use client";

import { formatDayMonth, formatLongDay, formatWeekday, startOfDay, endOfDay } from "@/lib/planner/dates";
import { TONE_LABELS, type PlannerEvent } from "@/lib/planner/plannerEvents";

interface DayViewProps {
  cursor: Date;
  events: PlannerEvent[];
  onEventClick: (event: PlannerEvent) => void;
}

export function DayView({ cursor, events, onEventClick }: DayViewProps) {
  const dayStart = startOfDay(cursor);
  const dayEnd = endOfDay(cursor);
  const today = events
    .filter((event) => event.start <= dayEnd && event.end >= dayStart)
    .sort((a, b) => a.start.getTime() - b.start.getTime());

  return (
    <div className="overflow-hidden rounded-3xl border border-border bg-background">
      <div className="border-b border-border px-4 py-3 sm:px-6">
        <div className="text-[10px] tracking-[0.18em] text-muted-foreground uppercase">{formatWeekday(cursor)}</div>
        <div className="mt-1 text-2xl font-medium">{formatLongDay(cursor)}</div>
      </div>

      {today.length === 0 ? (
        <div className="px-4 py-10 text-center text-sm text-muted-foreground sm:px-6">Nenhum evento neste dia.</div>
      ) : (
        <ul className="divide-y divide-border">
          {today.map((event) => (
            <li key={event.id}>
              <button
                type="button"
                onClick={() => onEventClick(event)}
                className="flex w-full gap-4 px-4 py-4 text-left transition-colors hover:bg-muted/40 sm:px-6"
              >
                <span className="w-1 shrink-0 rounded-sm" style={{ backgroundColor: event.color }} aria-hidden />
                <div className="min-w-0 flex-1">
                  <div className="mb-1 flex items-center gap-2">
                    <span className="text-[10px] tracking-[0.18em] uppercase" style={{ color: event.color }}>
                      {TONE_LABELS[event.tone]}
                    </span>
                    <span className="text-[10px] text-muted-foreground">
                      {formatDayMonth(event.start)}
                      {event.start.getTime() !== event.end.getTime() ? ` – ${formatDayMonth(event.end)}` : ""}
                    </span>
                  </div>
                  <div className="text-sm font-medium">{event.title}</div>
                  <div className="mt-1 line-clamp-2 text-xs text-muted-foreground">{event.description}</div>
                </div>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
