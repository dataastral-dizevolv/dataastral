"use client";

import { useMemo } from "react";

import { cn } from "@/lib/utils";

interface AnswerCalendarPanelProps {
  selectedISO: string;
}

const WEEKDAYS_SHORT = ["D", "S", "T", "Q", "Q", "S", "S"];

export function AnswerCalendarPanel({ selectedISO }: AnswerCalendarPanelProps) {
  const selected = useMemo(() => new Date(`${selectedISO}T00:00:00`), [selectedISO]);

  const days = useMemo(() => {
    const start = new Date(selected);
    start.setDate(selected.getDate() - selected.getDay());
    return Array.from({ length: 7 }, (_, index) => {
      const day = new Date(start);
      day.setDate(start.getDate() + index);
      return day;
    });
  }, [selected]);

  const isSelected = (day: Date) =>
    day.getDate() === selected.getDate() &&
    day.getMonth() === selected.getMonth() &&
    day.getFullYear() === selected.getFullYear();

  const monthLabel = selected.toLocaleDateString("pt-BR", { month: "long", year: "numeric" });

  return (
    <div className="rounded-2xl border border-border bg-background p-4 sm:p-5">
      <p className="mb-4 text-center font-jakarta text-sm font-black capitalize text-iris">{monthLabel}</p>
      <div className="mb-2 grid grid-cols-7 gap-1 text-center">
        {WEEKDAYS_SHORT.map((label, index) => (
          <span key={`${label}-${index}`} className="text-[10px] font-bold tracking-[0.08em] text-muted-foreground uppercase">
            {label}
          </span>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1 text-center">
        {days.map((day, index) => {
          const selectedDay = isSelected(day);
          return (
            <div
              key={index}
              className={cn(
                "flex aspect-square items-center justify-center rounded-2xl font-jakarta text-sm transition-colors",
                selectedDay ? "bg-primary text-primary-foreground font-black" : "font-semibold text-foreground/70",
              )}
            >
              {String(day.getDate()).padStart(2, "0")}
            </div>
          );
        })}
      </div>
    </div>
  );
}
