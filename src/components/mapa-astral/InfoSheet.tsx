"use client";

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

interface InfoSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  eyebrow?: string;
  title: string;
  body: string;
}

export function InfoSheet({ open, onOpenChange, eyebrow, title, body }: InfoSheetProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="bg-background">
        <SheetHeader className="border-b border-border px-6 py-5 pr-14">
          {eyebrow ? (
            <p className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">{eyebrow}</p>
          ) : null}
          <SheetTitle className="font-ubuntu text-xl font-black tracking-[-0.02em]">{title}</SheetTitle>
          <SheetDescription className="sr-only">{title}</SheetDescription>
        </SheetHeader>
        <div className="space-y-4 px-6 py-5">
          <p className="whitespace-pre-line text-sm leading-relaxed text-foreground">{body}</p>
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="w-full rounded-full bg-foreground py-3 text-sm font-medium text-background transition-colors hover:bg-foreground/90"
          >
            Fechar
          </button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
