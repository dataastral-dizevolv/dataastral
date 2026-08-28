"use client";

import * as React from "react";

import { MoonPhaseDisc } from "@/components/painel-astral/MoonPhaseDisc";
import {
  calculateAspects,
  calculateMoonData,
  calculatePlanets,
  moonSignSymbol,
} from "@/lib/astrology/painel";

type LunarCalendarPanelProps = {
  date: Date;
  onSelectDate: (d: Date) => void;
};

const WEEKDAYS = ["D", "S", "T", "Q", "Q", "S", "S"];
const MONTHS = [
  "Janeiro",
  "Fevereiro",
  "Março",
  "Abril",
  "Maio",
  "Junho",
  "Julho",
  "Agosto",
  "Setembro",
  "Outubro",
  "Novembro",
  "Dezembro",
];

export function LunarCalendarPanel({ date, onSelectDate }: LunarCalendarPanelProps) {
  const [cursor, setCursor] = React.useState(
    () => new Date(date.getFullYear(), date.getMonth(), 1),
  );

  React.useEffect(() => {
    setCursor(new Date(date.getFullYear(), date.getMonth(), 1));
  }, [date]);

  const year = cursor.getFullYear();
  const month = cursor.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const cells = React.useMemo(() => {
    const next: (Date | null)[] = [];
    for (let i = 0; i < firstDay; i++) next.push(null);
    for (let d = 1; d <= daysInMonth; d++) next.push(new Date(year, month, d, 12, 0));
    return next;
  }, [firstDay, daysInMonth, year, month]);

  const selectedMoon = React.useMemo(() => calculateMoonData(date), [date]);
  const dailyPlanets = React.useMemo(() => calculatePlanets(date), [date]);
  const dailyAspects = React.useMemo(() => calculateAspects(dailyPlanets), [dailyPlanets]);

  const todayKey = new Date().toDateString();
  const selectedKey = date.toDateString();

  const cellMoons = React.useMemo(
    () =>
      cells.map((d) =>
        d
          ? {
              moon: calculateMoonData(d),
              sign: moonSignSymbol(d),
            }
          : null,
      ),
    [cells],
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => setCursor(new Date(year, month - 1, 1))}
          className="px-3 py-1 text-sm font-bold hover:opacity-70"
          aria-label="Mês anterior"
        >
          ←
        </button>
        <h3 className="text-base font-black tracking-tight">
          {MONTHS[month]} {year}
        </h3>
        <button
          type="button"
          onClick={() => setCursor(new Date(year, month + 1, 1))}
          className="px-3 py-1 text-sm font-bold hover:opacity-70"
          aria-label="Próximo mês"
        >
          →
        </button>
      </div>

      <div className="mt-4 mb-5 grid grid-cols-7 gap-1">
        {WEEKDAYS.map((d, i) => (
          <div
            key={`${d}-${i}`}
            className="text-center text-[10px] font-bold uppercase tracking-wider text-universe"
          >
            {d}
          </div>
        ))}
      </div>

      <div className="mt-8 grid grid-cols-7 gap-x-px gap-y-[3px] overflow-hidden rounded-3xl border border-st-patrick-blue bg-st-patrick-blue">
        {cells.map((d, i) => {
          if (!d) {
            return <div key={`empty-${i}`} className="aspect-square bg-st-patrick-blue/10" />;
          }
          const meta = cellMoons[i];
          const isSelected = d.toDateString() === selectedKey;
          const isToday = d.toDateString() === todayKey;
          return (
            <button
              key={d.toISOString()}
              type="button"
              onClick={() => onSelectDate(d)}
              className={`relative aspect-square bg-ylnmn-blue/15 transition ${
                isSelected ? "ring-1 ring-inset ring-foreground" : "hover:bg-ylnmn-blue/30"
              }`}
            >
              {meta ? (
                <MoonPhaseDisc
                  angle={meta.moon.angle}
                  className="absolute inset-[14%] h-[72%] w-[72%]"
                />
              ) : null}
              <span
                className={`absolute top-1 left-1 text-[10px] leading-none text-universe ${
                  isToday ? "font-black" : "font-medium"
                }`}
              >
                {d.getDate()}
              </span>
              <span className="absolute right-1 bottom-0.5 text-[9px] leading-none text-muted-foreground">
                {meta?.sign ?? ""}
              </span>
            </button>
          );
        })}
      </div>

      <div className="space-y-3 border-t border-border pt-4">
        <div className="flex items-center gap-3">
          <MoonPhaseDisc angle={selectedMoon.angle} className="h-8 w-8 shrink-0" />
          <div>
            <div className="text-sm font-black">{selectedMoon.name}</div>
            <div className="text-xs text-muted-foreground">
              {selectedMoon.illumination}% iluminada · {selectedMoon.angle.toFixed(1)}°
            </div>
          </div>
        </div>

        <div>
          <div className="mb-1 text-[11px] font-bold tracking-wider text-muted-foreground uppercase">
            Planetas hoje
          </div>
          {dailyPlanets.length === 0 ? (
            <p className="text-xs text-muted-foreground">Sem posições disponíveis.</p>
          ) : (
            <div className="grid grid-cols-2 gap-1 text-xs">
              {dailyPlanets.map((p) => (
                <div key={p.id} className="flex items-center gap-1.5">
                  <span className="text-sm">{p.symbol}</span>
                  <span className="font-medium">{p.name}</span>
                  <span className="text-muted-foreground">
                    {Math.floor(p.degreeWithinSign)}° {p.signSymbol}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div>
          <div className="mb-1 text-[11px] font-bold tracking-wider text-muted-foreground uppercase">
            Aspectos ativos ({dailyAspects.length})
          </div>
          <div className="max-h-40 space-y-0.5 overflow-y-auto pr-1">
            {dailyAspects.map((a, i) => (
              <div
                key={`${a.body1}-${a.body2}-${a.type}-${i}`}
                className="flex items-center justify-between py-0.5 text-xs"
              >
                <div className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full" style={{ background: a.color }} />
                  <span className="font-medium">
                    {a.body1} · {a.body2}
                  </span>
                </div>
                <span className="text-muted-foreground">
                  {a.type} {a.angle.toFixed(1)}°
                </span>
              </div>
            ))}
            {dailyAspects.length === 0 ? (
              <div className="text-xs text-muted-foreground">Sem aspectos maiores ativos.</div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
