"use client";

import { cn } from "@/lib/utils";
import { ComponentPropsWithoutRef, useEffect, useState } from "react";

interface MarqueeProps extends ComponentPropsWithoutRef<"div"> {
  className?: string;
  reverse?: boolean;
  pauseOnHover?: boolean;
  children: React.ReactNode;
  vertical?: boolean;
  repeat?: number;
}

export function Marquee({
  className,
  reverse = false,
  pauseOnHover = false,
  children,
  vertical = false,
  repeat = 4,
  ...props
}: MarqueeProps) {
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReducedMotion(mq.matches);
    const onChange = () => setReducedMotion(mq.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  return (
    <div
      {...props}
      className={cn(
        "group flex overflow-hidden px-2 [--duration:60s] [--gap:1rem] [gap:var(--gap)]",
        vertical ? "flex-col" : "flex-row",
        className,
      )}
    >
      {Array(reducedMotion ? 1 : repeat)
        .fill(0)
        .map((_, i) => (
          <div
            key={i}
            className={cn("flex shrink-0 justify-around [gap:var(--gap)]", {
              "animate-marquee-x flex-row": !reducedMotion && !vertical && !reverse,
              "animate-marquee-x-reverse flex-row": !reducedMotion && !vertical && reverse,
              "animate-marquee-y flex-col": !reducedMotion && vertical && !reverse,
              "group-hover:[animation-play-state:paused]": pauseOnHover && !reducedMotion,
            })}
          >
            {children}
          </div>
        ))}
    </div>
  );
}
