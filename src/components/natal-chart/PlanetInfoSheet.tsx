"use client";

import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { signFromLongitude, type NatalPlanet } from "@/lib/astrology/natal-chart";
import { DEFAULT_PLANET_COLORS } from "@/components/natal-chart/NatalChartWheel";

interface PlanetInfoSheetProps {
  planet: NatalPlanet | null;
  onClose: () => void;
}

export function PlanetInfoSheet({ planet, onClose }: PlanetInfoSheetProps) {
  const sign = planet ? signFromLongitude(planet.longitude) : null;
  const accent = planet ? (planet.color ?? DEFAULT_PLANET_COLORS[planet.id]) : undefined;

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
                    <span className="ml-2">{sign.degree}°</span>
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
                <dd className="tabular-nums">{sign.degree}°</dd>
              </div>
            </dl>
          </>
        ) : null}
      </SheetContent>
    </Sheet>
  );
}
