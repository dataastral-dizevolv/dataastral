"use client";

import * as React from "react";
import { Drawer as DrawerPrimitive } from "vaul";
import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";

import { cn } from "@/lib/utils";

/**
 * SnapDrawer — bottom sheet com snap points (compacto ↔ expandido).
 * Compacto: cabeçalho/resumo. Expandido: fade-in do conteúdo completo + scroll.
 */
export interface SnapDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Pontos de parada, do menor para o maior. Default: [0.35, 0.9] */
  snapPoints?: (number | string)[];
  /** Conteúdo compacto — visível em qualquer snap. */
  compact: React.ReactNode;
  /** Conteúdo expandido — fade-in só no snap maior. */
  expanded?: React.ReactNode;
  className?: string;
  /** Aria-label do drawer. */
  label?: string;
}

export function SnapDrawer({
  open,
  onOpenChange,
  snapPoints = [0.35, 0.9],
  compact,
  expanded,
  className,
  label = "Detalhes",
}: SnapDrawerProps) {
  const [snap, setSnap] = React.useState<number | string | null>(snapPoints[0]);

  React.useEffect(() => {
    if (open) {
      setSnap(snapPoints[0]);
    }
  }, [open, snapPoints]);

  const maxSnap = snapPoints[snapPoints.length - 1];
  const isExpanded = snap === maxSnap;

  return (
    <DrawerPrimitive.Root
      open={open}
      onOpenChange={onOpenChange}
      snapPoints={snapPoints}
      activeSnapPoint={snap}
      setActiveSnapPoint={setSnap}
      shouldScaleBackground={false}
    >
      <DrawerPrimitive.Portal>
        <DrawerPrimitive.Overlay
          onClick={() => onOpenChange(false)}
          className="fixed inset-0 z-50 bg-foreground/30 backdrop-blur-sm transition-opacity"
        />
        <DrawerPrimitive.Content
          aria-label={label}
          className={cn(
            "fixed inset-x-0 bottom-0 z-50 flex h-full max-h-[96dvh] flex-col",
            "rounded-t-[32px] bg-background",
            "shadow-[0_-12px_40px_-16px_hsl(var(--foreground)/0.22)]",
            "outline-none",
            className,
          )}
        >
          <div className="mx-auto mt-2.5 mb-1.5 h-[5px] w-9 rounded-full bg-foreground/25" />

          <button
            type="button"
            onClick={() => onOpenChange(false)}
            aria-label="Fechar"
            className="absolute top-4 right-4 flex size-8 items-center justify-center rounded-full border border-border bg-background text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground"
          >
            <X className="size-4" />
          </button>

          <div className="shrink-0 px-5 pr-14 pb-3">{compact}</div>

          <div className="flex-1 overflow-hidden">
            <AnimatePresence>
              {isExpanded && expanded ? (
                <motion.div
                  key="expanded"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 6 }}
                  transition={{ duration: 0.25, ease: "easeOut" }}
                  className="h-full overflow-y-auto overscroll-contain px-5 pb-8"
                >
                  {expanded}
                </motion.div>
              ) : null}
            </AnimatePresence>
          </div>
        </DrawerPrimitive.Content>
      </DrawerPrimitive.Portal>
    </DrawerPrimitive.Root>
  );
}

export default SnapDrawer;
