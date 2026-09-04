"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";

interface LateralFadeTextProps {
  text: string;
  /** ms between words */
  step?: number;
  /** ms before first word appears */
  delay?: number;
  onComplete?: () => void;
  className?: string;
}

export function LateralFadeText({ text, step = 140, delay = 0, onComplete, className }: LateralFadeTextProps) {
  const words = text.split(/(\s+)/);
  const [revealed, setRevealed] = useState(0);

  useEffect(() => {
    const start = window.setTimeout(() => setRevealed(1), delay);
    return () => window.clearTimeout(start);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- mount once for entrance
  }, []);

  useEffect(() => {
    if (revealed === 0) return;
    const realWords = words.filter((word) => word.trim().length).length;
    if (revealed >= realWords) {
      const timer = window.setTimeout(() => onComplete?.(), 600);
      return () => window.clearTimeout(timer);
    }
    const timer = window.setTimeout(() => setRevealed((count) => count + 1), step);
    return () => window.clearTimeout(timer);
  }, [revealed, step, onComplete, words]);

  let wordIdx = 0;
  return (
    <span className={className}>
      {words.map((word, index) => {
        if (!word.trim().length) {
          return <span key={index}>{word}</span>;
        }
        const current = wordIdx++;
        const visible = current < revealed;
        return (
          <motion.span
            key={index}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: visible ? 1 : 0, x: visible ? 0 : -10 }}
            transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
            className="inline-block"
          >
            {word}
          </motion.span>
        );
      })}
    </span>
  );
}
