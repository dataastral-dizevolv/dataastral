"use client";

import { motion } from "framer-motion";

import { cn } from "@/lib/utils";

interface IrisCalendarIconProps {
  day: string;
  topLabel: string;
  monthLabel?: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function IrisCalendarIcon({ day, topLabel, monthLabel, size = "md", className }: IrisCalendarIconProps) {
  const dims =
    size === "sm"
      ? { box: "w-20 h-20", top: "h-6 text-[10px]", day: "text-[28px]", month: "text-[10px]" }
      : size === "lg"
        ? { box: "w-36 h-36", top: "h-10 text-sm", day: "text-[58px]", month: "text-base" }
        : { box: "w-28 h-28", top: "h-8 text-[12px]", day: "text-[44px]", month: "text-xs" };

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      className={cn("relative shrink-0 overflow-hidden rounded-2xl border border-border bg-background", dims.box, className)}
    >
      <span className="absolute top-[6px] left-3 z-10 size-1.5 rounded-full border border-border bg-background" />
      <span className="absolute top-[6px] right-3 z-10 size-1.5 rounded-full border border-border bg-background" />
      <div
        className={cn(
          "flex w-full items-center justify-center bg-primary font-jakarta font-black tracking-[0.16em] text-primary-foreground uppercase",
          dims.top,
        )}
      >
        {topLabel}
      </div>
      <div className="flex flex-1 flex-col items-center justify-center pt-1">
        <span className={cn("font-jakarta leading-none font-black tracking-[-0.02em] text-foreground", dims.day)}>{day}</span>
        {monthLabel ? (
          <span className={cn("mt-1 font-jakarta font-extrabold text-muted-foreground lowercase", dims.month)}>{monthLabel}</span>
        ) : null}
      </div>
    </motion.div>
  );
}
