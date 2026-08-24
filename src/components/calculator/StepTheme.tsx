import type { ReactNode } from "react";

import { THEMES } from "@/lib/calculator-data";
import { Button } from "@/components/ui/button";
import type { ThemeId } from "@/types/calculator";

const CALIBRATION_THEME_IDS = new Set<ThemeId>(["carreira", "saude", "familia", "viagens"]);

const THEME_ICONS: Record<ThemeId, ReactNode> = {
  amor: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" className="h-6 w-6">
      <path d="M12 21C12 21 3 15 3 8.5a5 5 0 0 1 9-3 5 5 0 0 1 9 3c0 1.2-.3 2.3-.8 3.3" />
      <path d="M15 14l3 3-3 3M18 17h-5" />
    </svg>
  ),
  carreira: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" className="h-6 w-6">
      <circle cx="12" cy="12" r="9" />
      <path d="M16.2 7.8l-4.5 4.5-4.5-4.5" />
      <path d="M7.8 16.2l4.5-4.5 4.5 4.5" />
      <circle cx="12" cy="12" r="1.5" fill="currentColor" strokeWidth="0" />
    </svg>
  ),
  financas: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" className="h-6 w-6">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v10M9.5 9.5c0-1.4 1.1-2.5 2.5-2.5s2.5 1.1 2.5 2.5-2.5 2.5-2.5 2.5-2.5 1.1-2.5 2.5 1.1 2.5 2.5 2.5 2.5-1.1 2.5-2.5" />
    </svg>
  ),
  saude: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" className="h-6 w-6">
      <path d="M12 22v-7" />
      <path d="M12 15c0 0-5-2-5-7 0-2.8 2.2-5 5-5s5 2.2 5 5c0 5-5 7-5 7z" />
      <path d="M7 15c-2-1-4-3-4-6 0-2.2 1.8-4 4-4" />
      <path d="M17 15c2-1 4-3 4-6 0-2.2-1.8-4-4-4" />
    </svg>
  ),
  familia: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" className="h-6 w-6">
      <circle cx="12" cy="6" r="2.5" />
      <path d="M8 21v-3a4 4 0 0 1 8 0v3" />
      <circle cx="4.5" cy="9" r="2" />
      <path d="M2 21v-2a3 3 0 0 1 5.5-1.6" />
      <circle cx="19.5" cy="9" r="2" />
      <path d="M22 21v-2a3 3 0 0 0-5.5-1.6" />
    </svg>
  ),
  viagens: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" className="h-6 w-6">
      <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" />
      <path d="M19 3l.5 1.5L21 5l-1.5.5L19 7l-.5-1.5L17 5l1.5-.5z" />
    </svg>
  ),
};

interface StepThemeProps {
  selectedTheme: ThemeId | null;
  onSelectTheme: (theme: ThemeId) => void;
  onContinue: () => void;
}

export function StepTheme({ selectedTheme, onSelectTheme, onContinue }: StepThemeProps) {
  return (
    <div className="space-y-6">
      <div>
        <p className="mb-1 font-mono-iris text-xs uppercase tracking-wider text-iris-secondary">Passo 1</p>
        <h3 className="font-display text-lg text-foreground">Escolha um tema</h3>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
        {THEMES.map((theme) => {
          const icon = THEME_ICONS[theme.id];
          const selected = selectedTheme === theme.id;
          const isCalibration = CALIBRATION_THEME_IDS.has(theme.id);

          return (
            <Button
              key={theme.id}
              type="button"
              variant="outline"
              disabled={isCalibration}
              title={isCalibration ? "Em breve" : undefined}
              onClick={isCalibration ? undefined : () => onSelectTheme(theme.id)}
              className={`h-auto flex-col gap-2.5 rounded-2xl border bg-card/60 p-4 text-center shadow-sm backdrop-blur-sm ${
                isCalibration
                  ? "cursor-not-allowed border-border opacity-40"
                  : selected
                    ? "border-powder-blue bg-powder-blue/15 text-foreground ring-1 ring-powder-blue/40"
                    : "border-border hover:border-iris-accent/40 hover:bg-card"
              }`}
            >
              <span className={selected && !isCalibration ? "text-foreground" : "text-iris-secondary"}>{icon}</span>
              <span className={`text-xs leading-tight ${selected && !isCalibration ? "text-foreground" : "text-iris-secondary"}`}>{theme.name}</span>
              {isCalibration ? <span className="font-mono-iris text-[9px] uppercase tracking-wider text-iris-muted">Em breve</span> : null}
            </Button>
          );
        })}
      </div>

      <Button type="button" disabled={!selectedTheme} onClick={onContinue} className="w-full font-body text-xs uppercase tracking-wider">
        Escolher tema
      </Button>
    </div>
  );
}
