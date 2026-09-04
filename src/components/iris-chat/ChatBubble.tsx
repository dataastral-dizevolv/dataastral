"use client";

import { motion } from "framer-motion";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

interface ChatBubbleProps {
  from: "iris" | "user";
  children: ReactNode;
  className?: string;
  noPadding?: boolean;
  id?: string;
}

export function ChatBubble({ from, children, className, noPadding, id }: ChatBubbleProps) {
  const isIris = from === "iris";
  const isPastelBlue = className?.includes("iris-blue-mist") ?? false;

  return (
    <motion.div
      id={id}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      className={cn("flex w-full", isIris ? "justify-start" : "justify-end")}
    >
      <div
        className={cn(
          "max-w-[92%] rounded-3xl border border-foreground/15 bg-bubble font-extrabold text-foreground shadow-[6px_8px_24px_-8px_hsl(0_0%_0%/0.18),2px_3px_8px_-3px_hsl(0_0%_0%/0.12)] transition-colors duration-300 sm:max-w-[80%]",
          !noPadding && "px-6 py-5 sm:px-8 sm:py-6",
          isPastelBlue && "!text-iris-blue-graphite",
          className,
        )}
      >
        {children}
      </div>
    </motion.div>
  );
}
