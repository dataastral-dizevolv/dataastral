"use client";

import { formatDayMonthYear, formatLongDay } from "@/lib/planner/dates";
import { TONE_LABELS, type PlannerEvent } from "@/lib/planner/plannerEvents";
import { SnapDrawer } from "@/components/ui/snap-drawer";

interface EventDrawerProps {
  event: PlannerEvent | null;
  onClose: () => void;
}

export function EventDrawer({ event, onClose }: EventDrawerProps) {
  const compact = event ? (
    <div className="pb-1">
      <div className="mb-2 flex items-center gap-2">
        <span className="size-2 rounded-full" style={{ backgroundColor: event.color }} />
        <span className="text-[10px] tracking-[0.18em] uppercase" style={{ color: event.color }}>
          {TONE_LABELS[event.tone]}
        </span>
      </div>
      <h3 className="font-medium text-lg text-foreground">{event.title}</h3>
      <p className="mt-1 text-xs text-muted-foreground">
        {formatLongDay(event.start)}
        {event.start.getTime() !== event.end.getTime() ? ` – ${formatDayMonthYear(event.end)}` : ""}
      </p>
    </div>
  ) : null;

  const expanded = event ? (
    <div className="space-y-6 pt-2 pb-10">
      <section>
        <div className="mb-2 text-[10px] tracking-[0.18em] text-muted-foreground uppercase">Sobre este trânsito</div>
        <p className="text-sm leading-relaxed text-foreground/85">{event.description}</p>
      </section>

      <section className="border-t border-border pt-5">
        <div className="mb-2 text-[10px] tracking-[0.18em] text-muted-foreground uppercase">Conselho do Data Iris</div>
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
  ) : null;

  return (
    <SnapDrawer
      open={Boolean(event)}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
      snapPoints={[0.35, 0.9]}
      compact={compact}
      expanded={expanded}
      label="Detalhes do evento"
    />
  );
}
