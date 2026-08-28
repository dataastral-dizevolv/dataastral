"use client";

import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { signFromLongitude, type NatalPlanet } from "@/lib/astrology/natal-chart";
import { DEFAULT_PLANET_COLORS } from "@/components/natal-chart/NatalChartWheel";

export type PlanetAspectRow = {
  name: string;
  with: string;
  orb: string;
};

interface PlanetInfoSheetProps {
  planet: NatalPlanet | null;
  onClose: () => void;
  /** Aspectos opcionais (ex.: página mapa-astral). Não afeta o perfil. */
  aspects?: PlanetAspectRow[];
}

export function PlanetInfoSheet({ planet, onClose, aspects }: PlanetInfoSheetProps) {
  const sign = planet ? signFromLongitude(planet.longitude) : null;
  const accent = planet ? (planet.color ?? DEFAULT_PLANET_COLORS[planet.id]) : undefined;
  const minute = sign ? String(sign.minute).padStart(2, "0") : "00";

  return (
    <Sheet open={Boolean(planet)} onOpenChange={(open) => (!open ? onClose() : null)}>
      <SheetContent side="bottom" className="bg-background">
        {planet && sign ? (
          <>
            <SheetHeader className="border-b border-border px-6 py-5 pr-14">
              <div className="flex items-center gap-4">
                <span
                  className="flex size-12 items-center justify-center rounded-full font-jakarta text-xl font-black text-foreground"
                  style={{ backgroundColor: accent }}
                >
                  {planet.symbol}
                </span>
                <div>
                  <SheetTitle className="font-jakarta text-lg font-black">{planet.label}</SheetTitle>
                  <SheetDescription className="tabular-nums">
                    <span className="font-medium text-foreground">{sign.name}</span>
                    <span className="ml-2">
                      {sign.degree}°{minute}′
                    </span>
                  </SheetDescription>
                </div>
              </div>
            </SheetHeader>
            <dl className="divide-y divide-border px-6">
              <div className="flex justify-between py-3 text-sm">
                <dt className="text-muted-foreground">Signo</dt>
                <dd className="font-jakarta font-black">{sign.name}</dd>
              </div>
              <div className="flex justify-between py-3 text-sm">
                <dt className="text-muted-foreground">Grau</dt>
                <dd className="tabular-nums">
                  {sign.degree}°{minute}′
                </dd>
              </div>
            </dl>
            {aspects && aspects.length > 0 ? (
              <div className="border-t border-border px-6 py-4">
                <p className="mb-2 text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Aspectos</p>
                <ul className="divide-y divide-border">
                  {aspects.map((a) => (
                    <li key={`${a.name}-${a.with}`} className="flex items-center justify-between gap-3 py-2 text-sm">
                      <span className="font-medium">
                        {a.name} · {a.with}
                      </span>
                      <span className="tabular-nums text-muted-foreground">{a.orb}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </>
        ) : null}
      </SheetContent>
    </Sheet>
  );
}
