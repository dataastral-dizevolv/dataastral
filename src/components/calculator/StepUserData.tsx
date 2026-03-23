"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Loader2, MapPin, Search } from "lucide-react";

import { useOptionalDashboardUser } from "@/components/dashboard/DashboardUserContext";
import { useLocationSearch } from "@/hooks/useLocationSearch";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { GeneratePredictionInput } from "@/types/calculator";

interface StepUserDataProps {
  selectedQuestion: string;
  onBack: () => void;
  onGenerate: (input: GeneratePredictionInput) => Promise<void>;
  submitError: string | null;
  submitErrorCode: string | null;
}

function isValidDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }

  const date = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

function isValidTime(value: string) {
  return /^([01]\d|2[0-3]):[0-5]\d$/.test(value);
}

export function StepUserData({
  selectedQuestion,
  onBack,
  onGenerate,
  submitError,
  submitErrorCode,
}: StepUserDataProps) {
  const dashboardUser = useOptionalDashboardUser();
  const prefillUser = dashboardUser?.user;
  const [date, setDate] = useState(prefillUser?.birthDate ?? "");
  const [time, setTime] = useState((prefillUser?.birthTime ?? "").slice(0, 5));
  const [formError, setFormError] = useState<string | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);

  const profileLocation =
    prefillUser?.birthLocation && prefillUser.birthTimezone && prefillUser.birthLat != null && prefillUser.birthLng != null
      ? {
          city: prefillUser.birthLocation.split(",")[0]?.trim() || "Cidade",
          state: prefillUser.birthLocation.split(",")[1]?.trim() || "Estado",
          country: prefillUser.birthLocation.split(",")[2]?.trim() || "País",
          lat: prefillUser.birthLat,
          lng: prefillUser.birthLng,
          timezone: prefillUser.birthTimezone,
          displayName: prefillUser.birthLocation,
        }
      : null;

  const {
    placeQuery,
    setPlaceQuery,
    locationResults,
    locationLoading,
    locationOpen,
    setLocationOpen,
    selectedLocation,
    handleSelectLocation,
  } = useLocationSearch({
    initialQuery: prefillUser?.birthLocation ?? "",
    initialLocation: profileLocation,
  });

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();

    if (!date || !isValidDate(date)) {
      setFormError("Informe uma data de nascimento válida.");
      return;
    }

    if (time && !isValidTime(time)) {
      setFormError("Hora inválida. Use o formato HH:mm.");
      return;
    }

    setFormError(null);

    let resolvedLocation = selectedLocation;

    if (!resolvedLocation && locationResults.length === 1) {
      resolvedLocation = await handleSelectLocation(locationResults[0]);
    }

    if (!resolvedLocation) {
      setLocationError("Selecione uma opção da lista para confirmar local e timezone.");
      return;
    }

    if (!resolvedLocation.timezone) {
      setLocationError("Não foi possível identificar o timezone. Escolha outra opção da lista.");
      return;
    }

    setLocationError(null);

    await onGenerate({
      date,
      time,
      placeQuery,
      birthLocation: resolvedLocation.displayName,
      birthTimezone: resolvedLocation.timezone,
      birthLat: resolvedLocation.lat,
      birthLng: resolvedLocation.lng,
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <Button type="button" variant="ghost" onClick={onBack} className="mb-3 h-auto p-0 text-xs text-iris-secondary hover:text-foreground">
          Voltar às perguntas
        </Button>
        <p className="mb-1 font-mono-iris text-xs uppercase tracking-wider text-iris-secondary">Passo 3</p>
        <h3 className="font-display text-lg text-foreground">Seus dados de nascimento</h3>
        <p className="mt-1 text-xs italic text-iris-secondary">&quot;{selectedQuestion}&quot;</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="birth-date" className="font-mono-iris text-xs uppercase tracking-wider text-iris-secondary">
            Data de nascimento
          </Label>
          <Input id="birth-date" type="date" value={date} onChange={(event) => setDate(event.target.value)} required className="bg-muted" />
        </div>

        <div className="space-y-2">
          <Label htmlFor="birth-time" className="font-mono-iris text-xs uppercase tracking-wider text-iris-secondary">
            Hora de nascimento
          </Label>
          <Input id="birth-time" type="time" value={time} onChange={(event) => setTime(event.target.value)} className="bg-muted" />
        </div>
      </div>

      <div className="relative space-y-2">
        <Label htmlFor="birth-place" className="font-mono-iris text-xs uppercase tracking-wider text-iris-secondary">
          Cidade, estado e país de nascimento
        </Label>

        <div className="relative">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-iris-muted" />
          <Input
            id="birth-place"
            type="text"
            value={placeQuery}
            onChange={(event) => {
              setPlaceQuery(event.target.value);
              setLocationError(null);
              setFormError(null);
            }}
            onFocus={() => setLocationOpen(locationResults.length > 0)}
            placeholder="Digite cidade, estado e país"
            className="border-iris bg-muted pl-9"
          />
          {locationLoading ? <Loader2 className="absolute top-1/2 right-3 size-4 -translate-y-1/2 animate-spin text-iris-muted" /> : null}
        </div>

        <AnimatePresence>
          {locationOpen ? (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 6 }}
              className="z-30 mt-1 max-h-80 overflow-y-auto rounded-xl border border-iris bg-muted p-1"
            >
              {locationResults.map((locationOption) => (
                <button
                  key={`${locationOption.displayName}-${locationOption.lat}-${locationOption.lng}`}
                  type="button"
                  onClick={() => {
                    void handleSelectLocation(locationOption);
                    setLocationError(null);
                  }}
                  className="flex w-full items-start gap-2 rounded-lg px-3 py-2 text-left transition-colors hover:bg-background/70"
                >
                  <MapPin className="mt-0.5 size-3.5 text-iris-accent" />
                  <span className="text-xs leading-relaxed text-foreground">{locationOption.displayName}</span>
                </button>
              ))}
            </motion.div>
          ) : null}
        </AnimatePresence>

        {locationError ? <p className="text-[11px] text-red-300">{locationError}</p> : null}
      </div>

      <Button type="submit" className="w-full font-body text-xs uppercase tracking-wider">
        Gerar minha previsão
      </Button>

      {formError ? <p className="text-[11px] text-red-300">{formError}</p> : null}

      {submitError ? (
        <Card className="rounded-xl border-red-500/50 bg-red-500/10">
          <CardContent className="space-y-3 p-4">
            <p className="text-sm text-red-200">{submitError}</p>
            {submitErrorCode === "INSUFFICIENT_CREDITS" ? (
              <Button className="w-full font-body text-xs uppercase tracking-wider">Comprar créditos</Button>
            ) : null}
          </CardContent>
        </Card>
      ) : null}

      <p className="text-center font-mono-iris text-[11px] text-iris-muted">
        Cálculo baseado em efemérides reais - atualize seus dados no perfil quando precisar
      </p>
    </form>
  );
}
