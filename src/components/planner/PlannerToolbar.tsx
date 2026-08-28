"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";

import { addDays, addMonths, addWeeks } from "@/lib/planner/dates";
import { cn } from "@/lib/utils";

export type PlannerView = "day" | "week" | "month";

interface PlannerToolbarProps {
  view: PlannerView;
  onViewChange: (view: PlannerView) => void;
  cursor: Date;
  onCursorChange: (date: Date) => void;
}

export function PlannerToolbar({ view, onViewChange, cursor, onCursorChange }: PlannerToolbarProps) {
  function move(direction: 1 | -1) {
    if (view === "month") {
      onCursorChange(addMonths(cursor, direction));
      return;
    }
    if (view === "week") {
      onCursorChange(addWeeks(cursor, direction));
      return;
    }
    onCursorChange(addDays(cursor, direction));
  }

  return (
    <div className="overflow-hidden rounded-3xl border border-border bg-background font-ubuntu">
      <div className="flex flex-col items-start gap-3 px-4 py-4 sm:px-6">
        <div className="flex items-center overflow-hidden rounded-full border border-border">
          {(["day", "week", "month"] as PlannerView[]).map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => onViewChange(item)}
              className={cn(
                "h-8 px-4 text-xs tracking-wider transition-colors",
                view === item
                  ? "bg-iris-blue-chambray text-background"
                  : "text-iris-blue-chambray hover:bg-muted",
              )}
            >
              {item === "day" ? "Dia" : item === "week" ? "Semana" : "Mês"}
            </button>
          ))}
        </div>

        <div className="flex items-center overflow-hidden rounded-full border border-border">
          <button
            type="button"
            onClick={() => move(-1)}
            aria-label="Anterior"
            className="flex h-8 w-9 items-center justify-center text-iris-blue-chambray hover:bg-muted"
          >
            <ChevronLeft className="size-4" />
          </button>
          <button
            type="button"
            onClick={() => move(1)}
            aria-label="Próximo"
            className="flex h-8 w-9 items-center justify-center text-iris-blue-chambray hover:bg-muted"
          >
            <ChevronRight className="size-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
