"use client";

import { motion } from "framer-motion";
import { useMemo } from "react";

export function CalendarAnimatedLoader() {
  const days = useMemo(() => Array.from({ length: 35 }, (_, i) => i + 1), []);
  const months = ["JAN", "FEV", "MAR", "ABR", "MAI", "JUN"];

  return (
    <div className="relative flex flex-col items-center justify-center select-none">
      <div className="relative mb-2 h-4 w-24 overflow-hidden">
        <motion.div
          animate={{ y: [0, -16, -32, -48, -64, -80, 0] }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
          className="flex flex-col items-center"
        >
          {months.map((m) => (
            <span key={m} className="h-4 text-[10px] leading-4 tracking-[0.28em] text-foreground/70 uppercase">
              {m}
            </span>
          ))}
        </motion.div>
      </div>

      <div className="mb-1 grid grid-cols-7 gap-[3px]">
        {["D", "S", "T", "Q", "Q", "S", "S"].map((d, i) => (
          <span
            key={i}
            className="w-4 text-center text-[8px] tracking-wider uppercase"
            style={{ color: "hsl(var(--blue-deep))" }}
          >
            {d}
          </span>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-[3px]">
        {days.map((d, i) => {
          const delay = (i % 35) * 0.08;
          return (
            <motion.div
              key={d}
              className="relative flex h-4 w-4 items-center justify-center rounded-[2px] border border-foreground/15"
              animate={{
                backgroundColor: ["hsla(0,0%,100%,0)", "hsl(var(--blue-mist) / 0.9)", "hsla(0,0%,100%,0)"],
              }}
              transition={{
                duration: 2.8,
                delay,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            >
              <span className="text-[7px] leading-none text-foreground/55">{d}</span>
            </motion.div>
          );
        })}
      </div>

      <p className="mt-3 text-[9px] tracking-[0.28em] text-muted-foreground uppercase">Lendo o tempo</p>
    </div>
  );
}
