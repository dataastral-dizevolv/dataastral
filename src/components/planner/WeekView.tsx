"use client";

import { addDays, dayOfMonth, differenceInCalendarDays, endOfWeek, isSameDay, startOfWeek } from "@/lib/planner/dates";
import type { PlannerEvent } from "@/lib/planner/plannerEvents";

interface WeekViewProps {
  cursor: Date;
  events: PlannerEvent[];
  onEventClick: (event: PlannerEvent) => void;
}

const WEEKDAY_LABELS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

export function WeekView({ cursor, events, onEventClick }: WeekViewProps) {
  const weekStart = startOfWeek(cursor, 0);
  const weekEnd = endOfWeek(cursor, 0);

  const inWeek = events
    .filter((event) => event.end >= weekStart && event.start <= weekEnd)
    .sort((a, b) => a.start.getTime() - b.start.getTime());

  const lanes: Date[] = [];
  const packed = inWeek.map((event) => {
    const start = event.start < weekStart ? weekStart : event.start;
    const end = event.end > weekEnd ? weekEnd : event.end;
    const startCol = differenceInCalendarDays(start, weekStart);
    const span = differenceInCalendarDays(end, start) + 1;
    let lane = lanes.findIndex((last) => last < start);
    if (lane === -1) {
      lane = lanes.length;
      lanes.push(end);
    } else {
      lanes[lane] = end;
    }
    return { event, lane, startCol, span };
  });

  const laneCount = Math.max(4, lanes.length);

  return (
    <div className="overflow-hidden rounded-3xl border border-border bg-background">
      <div className="grid grid-cols-7 border-b border-border">
        {Array.from({ length: 7 }).map((_, index) => {
          const day = addDays(weekStart, index);
          const today = isSameDay(day, new Date());
          return (
            <div key={index} className="border-r border-border px-2 py-3 text-center last:border-r-0">
              <div className="text-[10px] tracking-[0.18em] text-muted-foreground uppercase">{WEEKDAY_LABELS[index]}</div>
              <div className={`mt-1 text-lg ${today ? "font-bold text-iris-blue-chambray" : "text-foreground"}`}>
                {dayOfMonth(day)}
              </div>
            </div>
          );
        })}
      </div>

      <div className="relative" style={{ minHeight: `${Math.max(200, laneCount * 34 + 20)}px` }}>
        <div className="pointer-events-none absolute inset-0 grid grid-cols-7">
          {Array.from({ length: 7 }).map((_, index) => (
            <div key={index} className="border-r border-border last:border-r-0" />
          ))}
        </div>

        <div className="relative px-1 py-3">
          {packed.map(({ event, lane, startCol, span }) => (
            <button
              key={event.id}
              type="button"
              onClick={() => onEventClick(event)}
              className="absolute h-7 truncate rounded-full px-2.5 text-left text-xs text-primary-foreground transition hover:brightness-110"
              style={{
                top: `${12 + lane * 32}px`,
                left: `calc(${(startCol / 7) * 100}% + 4px)`,
                width: `calc(${(span / 7) * 100}% - 8px)`,
                backgroundColor: event.color,
                lineHeight: "28px",
              }}
              title={event.title}
            >
              {event.title}
            </button>
          ))}
          {packed.length === 0 ? (
            <div className="py-8 text-center text-xs text-muted-foreground">Nenhum evento nesta semana.</div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
