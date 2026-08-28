"use client";

import * as React from "react";

import { cn } from "@/lib/utils";

export interface BarDatum {
  label: string;
  value: number;
  color?: string;
}

export interface ElementModalityBarsProps {
  title?: string;
  unit?: string;
  data: BarDatum[];
  maxHeightPx?: number;
  className?: string;
  onItemClick?: (item: BarDatum, index: number) => void;
}

export function ElementModalityBars({
  title,
  unit = "",
  data,
  maxHeightPx = 96,
  className,
  onItemClick,
}: ElementModalityBarsProps) {
  const [hovered, setHovered] = React.useState<number | null>(null);
  const [display, setDisplay] = React.useState<number | null>(null);

  React.useEffect(() => {
    if (hovered !== null) setDisplay(data[hovered]?.value ?? null);
  }, [hovered, data]);

  const max = Math.max(1, ...data.map((d) => d.value));

  return (
    <div
      className={cn(
        "relative flex flex-col gap-3 rounded-2xl border border-border bg-background p-4 sm:p-5",
        className,
      )}
      onMouseLeave={() => {
        setHovered(null);
        window.setTimeout(() => setDisplay(null), 180);
      }}
    >
      <div className="flex items-baseline justify-between">
        <p className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">{title}</p>
        <p
          className="font-jakarta text-sm font-black tabular-nums text-foreground transition-opacity duration-150"
          style={{ opacity: display !== null ? 1 : 0 }}
        >
          {display ?? 0}
          {unit ? <span className="ml-0.5 text-[10px] font-normal text-muted-foreground">{unit}</span> : null}
        </p>
      </div>

      <div className="flex items-end justify-between gap-2 pt-2" style={{ height: maxHeightPx + 24 }}>
        {data.map((item, i) => {
          const h = (item.value / max) * maxHeightPx;
          const isHovered = hovered === i;
          const anyHovered = hovered !== null;
          const isNeighbor = anyHovered && (i === hovered! - 1 || i === hovered! + 1);

          return (
            <div
              key={item.label}
              role={onItemClick ? "button" : undefined}
              tabIndex={onItemClick ? 0 : undefined}
              className={cn(
                "group relative flex flex-1 flex-col items-center gap-1",
                onItemClick ? "cursor-pointer" : "cursor-default",
              )}
              onMouseEnter={() => setHovered(i)}
              onClick={() => onItemClick?.(item, i)}
              onKeyDown={(e) => {
                if (onItemClick && (e.key === "Enter" || e.key === " ")) {
                  e.preventDefault();
                  onItemClick(item, i);
                }
              }}
            >
              <div
                className="pointer-events-none absolute -top-1 left-1/2 -translate-x-1/2 -translate-y-full transition-opacity duration-150"
                style={{ opacity: isHovered ? 1 : 0 }}
              >
                <span className="inline-block whitespace-nowrap rounded-md border border-border bg-background px-1.5 py-0.5 font-jakarta text-[10px] font-black tabular-nums text-foreground">
                  {item.value}
                  {unit}
                </span>
              </div>

              <div
                className="w-full rounded-t-sm transition-all duration-300 ease-out"
                style={{
                  height: Math.max(2, h),
                  background: item.color ?? "hsl(var(--blue-chambray))",
                  opacity: !anyHovered ? 0.85 : isHovered ? 1 : isNeighbor ? 0.7 : 0.35,
                  transform: isHovered ? "scaleY(1.04)" : "scaleY(1)",
                  transformOrigin: "bottom",
                }}
              />

              <span
                className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground transition-colors"
                style={{ color: isHovered ? "hsl(var(--foreground))" : undefined }}
              >
                {item.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
