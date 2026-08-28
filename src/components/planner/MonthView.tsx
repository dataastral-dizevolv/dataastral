"use client";

import {
  addDays,
  dayOfMonth,
  differenceInCalendarDays,
  endOfMonth,
  endOfWeek,
  isSameDay,
  isSameMonth,
  startOfMonth,
  startOfWeek,
} from "@/lib/planner/dates";
import type { PlannerEvent } from "@/lib/planner/plannerEvents";

interface MonthViewProps {
  cursor: Date;
  events: PlannerEvent[];
  onEventClick: (event: PlannerEvent) => void;
  onDayClick?: (isoDate: string) => void;
  predictionDays?: Set<string>;
}

const MAX_LANES = 3;
const WEEKDAY_LABELS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

function packWeek(
  weekStart: Date,
  weekEnd: Date,
  events: PlannerEvent[],
): Array<{ event: PlannerEvent; lane: number; startCol: number; span: number }> {
  const inWeek = events
    .filter((event) => event.end >= weekStart && event.start <= weekEnd)
    .sort(
      (a, b) =>
        a.start.getTime() - b.start.getTime() ||
        b.end.getTime() - b.start.getTime() - (a.end.getTime() - a.start.getTime()),
    );

  const lanes: Date[] = [];
  const out: Array<{ event: PlannerEvent; lane: number; startCol: number; span: number }> = [];

  for (const event of inWeek) {
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

    out.push({ event, lane, startCol, span });
  }

  return out;
}

function toIsoLocal(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function MonthView({ cursor, events, onEventClick, onDayClick, predictionDays }: MonthViewProps) {
  const monthStart = startOfMonth(cursor);
  const monthEnd = endOfMonth(cursor);
  const gridStart = startOfWeek(monthStart, 0);
  const gridEnd = endOfWeek(monthEnd, 0);

  const weeks: Date[][] = [];
  let day = gridStart;
  while (day <= gridEnd) {
    const week: Date[] = [];
    for (let i = 0; i < 7; i++) {
      week.push(day);
      day = addDays(day, 1);
    }
    weeks.push(week);
  }

  return (
    <div className="overflow-hidden rounded-3xl border border-border bg-background">
      <div className="grid grid-cols-7 border-b border-border">
        {WEEKDAY_LABELS.map((label) => (
          <div key={label} className="px-2 py-2 text-center text-[10px] tracking-[0.18em] text-muted-foreground uppercase">
            {label}
          </div>
        ))}
      </div>

      {weeks.map((week, weekIndex) => {
        const weekStart = week[0];
        const weekEnd = week[6];
        const packed = packWeek(weekStart, weekEnd, events);
        const visibleBars = packed.filter((item) => item.lane < MAX_LANES);
        const overflowByDay: Record<number, number> = {};

        for (const item of packed) {
          if (item.lane < MAX_LANES) continue;
          for (let i = 0; i < item.span; i++) {
            const col = item.startCol + i;
            overflowByDay[col] = (overflowByDay[col] || 0) + 1;
          }
        }

        return (
          <div key={weekIndex} className="relative grid min-h-[110px] grid-cols-7 border-b border-border last:border-b-0">
            {week.map((cell, dayIndex) => {
              const inMonth = isSameMonth(cell, cursor);
              const today = isSameDay(cell, new Date());
              const iso = toIsoLocal(cell);
              const hasPrediction = predictionDays?.has(iso);

              return (
                <button
                  key={iso}
                  type="button"
                  onClick={() => onDayClick?.(iso)}
                  className={`relative border-r border-border px-1.5 pt-1 pb-1 text-left last:border-r-0 ${
                    inMonth ? "bg-background" : "bg-muted/40"
                  }`}
                >
                  <div
                    className={`text-xs ${
                      today
                        ? "font-bold text-iris-blue-chambray"
                        : inMonth
                          ? "text-foreground"
                          : "text-muted-foreground"
                    }`}
                  >
                    {dayOfMonth(cell)}
                  </div>
                  {overflowByDay[dayIndex] ? (
                    <div className="absolute bottom-1 left-1.5 text-[10px] text-muted-foreground">
                      +{overflowByDay[dayIndex]} mais
                    </div>
                  ) : null}
                  {hasPrediction ? (
                    <span
                      className="absolute right-1.5 bottom-1.5 size-1.5 rounded-full bg-iris-accent"
                      aria-label="Dia com previsão pessoal"
                      title="Você já tem previsão pessoal neste dia"
                    />
                  ) : null}
                </button>
              );
            })}

            <div className="pointer-events-none absolute inset-0 px-0.5 pt-6">
              {visibleBars.map(({ event, lane, startCol, span }) => (
                <button
                  key={`${event.id}-${weekIndex}`}
                  type="button"
                  onClick={() => onEventClick(event)}
                  className="pointer-events-auto absolute h-5 truncate rounded-full px-2 text-left text-[10px] text-primary-foreground transition hover:brightness-110"
                  style={{
                    top: `${28 + lane * 22}px`,
                    left: `calc(${(startCol / 7) * 100}% + 2px)`,
                    width: `calc(${(span / 7) * 100}% - 4px)`,
                    backgroundColor: event.color,
                  }}
                  title={event.title}
                >
                  {event.title}
                </button>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
