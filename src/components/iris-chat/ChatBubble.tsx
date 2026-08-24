"use client";

import { motion } from "framer-motion";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

interface ChatBubbleProps {
  from: "iris" | "user";
  children: ReactNode;
  className?: string;
  noPadding?: boolean;
}

export function ChatBubble({ from, children, className, noPadding }: ChatBubbleProps) {
  const isIris = from === "iris";

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      className={cn("flex w-full", isIris ? "justify-start" : "justify-end")}
    >
      <div
        className={cn(
          "max-w-[92%] rounded-2xl border border-border bg-bubble text-foreground sm:max-w-[80%]",
          !noPadding && "px-6 py-5 sm:px-8 sm:py-6",
          className,
        )}
      >
        {children}
      </div>
    </motion.div>
  );
}
