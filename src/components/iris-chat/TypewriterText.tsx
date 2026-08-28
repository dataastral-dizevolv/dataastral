"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";

interface TypewriterTextProps {
  text: string;
  delay?: number;
  speed?: number;
  onComplete?: () => void;
  className?: string;
  /** "type" reveals char-by-char. "fade" reveals the whole text in one soft fade. */
  mode?: "type" | "fade";
  /** Show a blinking cursor while typing. Default false. */
  showCursor?: boolean;
}

export function TypewriterText({
  text,
  delay = 0,
  speed = 55,
  onComplete,
  className,
  mode = "type",
  showCursor = false,
}: TypewriterTextProps) {
  const [visibleChars, setVisibleChars] = useState(0);
  const [started, setStarted] = useState(false);
  const fadeScheduledRef = useRef(false);

  useEffect(() => {
    const timer = window.setTimeout(() => setStarted(true), delay);
    return () => window.clearTimeout(timer);
  }, [delay]);

  useEffect(() => {
    if (mode !== "fade" || !started || fadeScheduledRef.current) return;
    fadeScheduledRef.current = true;
    const reading = Math.max(700, Math.min(3500, text.length * 35));
    const timer = window.setTimeout(() => onComplete?.(), reading);
    return () => window.clearTimeout(timer);
  }, [mode, started, text.length, onComplete]);

  useEffect(() => {
    if (mode !== "type" || !started) return;
    if (visibleChars >= text.length) {
      onComplete?.();
      return;
    }
    const timer = window.setTimeout(() => setVisibleChars((count) => count + 1), speed);
    return () => window.clearTimeout(timer);
  }, [mode, started, visibleChars, text.length, speed, onComplete]);

  if (mode === "fade") {
    return (
      <motion.span
        className={className}
        initial={{ opacity: 0, y: 4 }}
        animate={{ opacity: started ? 1 : 0, y: started ? 0 : 4 }}
        transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
      >
        {text}
      </motion.span>
    );
  }

  return (
    <span className={className}>
      {text.split("").map((char, index) => (
        <motion.span
          key={`${char}-${index}`}
          initial={{ opacity: 0 }}
          animate={{ opacity: index < visibleChars ? 1 : 0 }}
          transition={{ duration: 0.05 }}
        >
          {char}
        </motion.span>
      ))}
      {showCursor && visibleChars < text.length ? (
        <motion.span
          animate={{ opacity: [1, 0, 1] }}
          transition={{ repeat: Infinity, duration: 0.8 }}
          className="ml-0.5 inline-block h-[1em] w-[2px] bg-current align-middle"
        />
      ) : null}
    </span>
  );
}
