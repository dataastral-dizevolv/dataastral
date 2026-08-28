"use client";

import * as React from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Loader2, Search } from "lucide-react";

import { Input } from "@/components/ui/input";
import { useLocationSearch } from "@/hooks/useLocationSearch";
import { cn } from "@/lib/utils";
import type { LocationData } from "@/types/calculator";

interface CityBirthAutocompleteProps {
  value: LocationData | null;
  onChange: (city: LocationData | null) => void;
  placeholder?: string;
  id?: string;
  className?: string;
}

export function CityBirthAutocomplete({
  value,
  onChange,
  placeholder = "Digite a cidade para buscar",
  id,
  className,
}: CityBirthAutocompleteProps) {
  const {
    placeQuery,
    setPlaceQuery,
    locationResults,
    locationLoading,
    locationOpen,
    setLocationOpen,
    handleSelectLocation,
  } = useLocationSearch({
    initialQuery: value?.displayName ?? "",
    initialLocation: value,
  });

  const wrapRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setLocationOpen(false);
      }
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, [setLocationOpen]);

  return (
    <div ref={wrapRef} className="relative">
      <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        id={id}
        autoComplete="off"
        value={placeQuery}
        placeholder={placeholder}
        onFocus={() => setLocationOpen(locationResults.length > 0 || placeQuery.length >= 2)}
        onChange={(e) => {
          setPlaceQuery(e.target.value);
          setLocationOpen(true);
          if (value) onChange(null);
        }}
        className={cn("pl-9", className)}
      />
      {locationLoading ? (
        <Loader2 className="absolute top-1/2 right-3 h-4 w-4 -translate-y-1/2 animate-spin text-muted-foreground" />
      ) : null}
      {locationOpen && (locationResults.length > 0 || placeQuery.length >= 2) ? (
        <div className="absolute z-50 mt-1 w-full overflow-hidden rounded-xl border border-border bg-background shadow-lg">
          {locationResults.length === 0 ? (
            <p className="px-3 py-3 text-sm text-muted-foreground">
              {locationLoading ? "Buscando…" : "Nenhuma cidade encontrada."}
            </p>
          ) : (
            <ul className="max-h-[220px] overflow-y-auto py-1">
              {locationResults.map((city) => (
                <li key={`${city.displayName}-${city.lat}-${city.lng}`}>
                  <button
                    type="button"
                    onClick={() => {
                      void handleSelectLocation(city).then((resolved) => {
                        onChange(resolved);
                        setLocationOpen(false);
                      });
                    }}
                    className="w-full px-3 py-2 text-left text-sm text-foreground hover:bg-muted"
                  >
                    {city.displayName}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : null}
    </div>
  );
}
