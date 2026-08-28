"use client";

import { TONE_COLORS, TONE_LABELS, type EventTone } from "@/lib/planner/plannerEvents";

export function ToneLegend() {
  return (
    <div className="rounded-3xl border border-border bg-background px-4 py-5 sm:px-6">
      <p className="mb-4 text-[10px] tracking-[0.18em] text-muted-foreground uppercase">Legenda</p>
      <ul className="grid gap-3 sm:grid-cols-2">
        {(Object.keys(TONE_LABELS) as EventTone[]).map((tone) => (
          <li key={tone} className="flex items-center gap-3">
            <span className="size-3 shrink-0 rounded-full" style={{ backgroundColor: TONE_COLORS[tone] }} />
            <span className="text-sm text-foreground/80">{TONE_LABELS[tone]}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
