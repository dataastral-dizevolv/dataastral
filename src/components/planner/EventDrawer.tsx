"use client";

import { formatDayMonthYear, formatLongDay } from "@/lib/planner/dates";
import { TONE_LABELS, type PlannerEvent } from "@/lib/planner/plannerEvents";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";

interface EventDrawerProps {
  event: PlannerEvent | null;
  onClose: () => void;
}

export function EventDrawer({ event, onClose }: EventDrawerProps) {
  return (
    <Sheet open={Boolean(event)} onOpenChange={(open) => (!open ? onClose() : null)}>
      <SheetContent side="bottom" className="bg-background p-0">
        {event ? (
          <div className="flex h-full flex-col overflow-y-auto">
            <SheetHeader className="border-b border-border px-5 py-5 pr-14">
              <div className="mb-2 flex items-center gap-2">
                <span className="size-2 rounded-full" style={{ backgroundColor: event.color }} />
                <span className="text-[10px] tracking-[0.18em] uppercase" style={{ color: event.color }}>
                  {TONE_LABELS[event.tone]}
                </span>
              </div>
              <SheetTitle className="font-medium text-lg">{event.title}</SheetTitle>
              <SheetDescription>
                {formatLongDay(event.start)}
                {event.start.getTime() !== event.end.getTime() ? ` – ${formatDayMonthYear(event.end)}` : ""}
              </SheetDescription>
            </SheetHeader>

            <div className="space-y-6 px-5 py-6">
              <section>
                <div className="mb-2 text-[10px] tracking-[0.18em] text-muted-foreground uppercase">Sobre este trânsito</div>
                <p className="text-sm leading-relaxed text-foreground/85">{event.description}</p>
              </section>

              <section className="border-t border-border pt-5">
                <div className="mb-2 text-[10px] tracking-[0.18em] text-muted-foreground uppercase">Conselho do Data Astral</div>
                <p className="text-sm leading-relaxed text-foreground/85">{event.advice}</p>
              </section>

              <section className="flex flex-wrap gap-x-6 gap-y-2 border-t border-border pt-5 text-xs text-muted-foreground">
                <span>
                  <strong className="text-foreground">Canal:</strong>{" "}
                  {event.channel === "sky" ? "Céu do momento" : event.channel === "personal" ? "Meu céu" : "Agenda externa"}
                </span>
                <span>
                  <strong className="text-foreground">Energia:</strong> {TONE_LABELS[event.tone]}
                </span>
                <span>
                  <strong className="text-foreground">Tipo:</strong> {event.kind}
                </span>
              </section>
            </div>
          </div>
        ) : null}
      </SheetContent>
    </Sheet>
  );
}
