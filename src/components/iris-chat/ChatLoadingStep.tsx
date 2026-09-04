"use client";

import { CalendarAnimatedLoader } from "@/components/iris-chat/CalendarAnimatedLoader";
import { VanCleefSolarLoader } from "@/components/iris-chat/VanCleefSolarLoader";

interface ChatLoadingStepProps {
  onCancel?: () => void;
}

export function ChatLoadingStep({ onCancel }: ChatLoadingStepProps) {
  return (
    <div className="overflow-hidden rounded-3xl border border-border bg-iris-blue-graphite text-primary-foreground">
      <div className="flex flex-col items-stretch gap-4 p-4 sm:flex-row sm:items-center sm:gap-6 sm:p-6">
        <div className="min-w-0 flex-1">
          <VanCleefSolarLoader onComplete={() => undefined} duration={120_000} />
        </div>
        <div className="shrink-0 self-center [&_*]:!text-primary-foreground/80">
          <CalendarAnimatedLoader />
        </div>
      </div>
      {onCancel ? (
        <div className="border-t border-primary-foreground/10 px-4 py-3 text-center">
          <button
            type="button"
            onClick={onCancel}
            className="text-xs text-primary-foreground/70 transition-colors hover:text-primary-foreground"
          >
            Cancelar
          </button>
        </div>
      ) : null}
    </div>
  );
}
