"use client";

import { forwardRef, useImperativeHandle, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Loader2, MapPin, Search, User, Users } from "lucide-react";

import type { StepUserDataFormState } from "@/components/calculator/StepUserData";
import { Input } from "@/components/ui/input";
import { useLocationSearch } from "@/hooks/useLocationSearch";
import { cn } from "@/lib/utils";
import type { DynamicAnswerValue, GeneratePredictionInput, LocationData } from "@/types/calculator";

type BirthTarget = "self" | "other";
type GenderOption = "homem" | "mulher" | "nao_binario";

const GENDER_OPTIONS: Array<{ value: GenderOption; label: string }> = [
  { value: "homem", label: "Homem" },
  { value: "mulher", label: "Mulher" },
  { value: "nao_binario", label: "Não binário" },
];

function isValidDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

function isValidTime(value: string) {
  return value.length === 0 || /^([01]\d|2[0-3]):[0-5]\d$/.test(value);
}

export interface BirthFormHandle {
  submit: () => Promise<void>;
  canSubmit: () => boolean;
}

interface BirthFormBubbleProps {
  formState: StepUserDataFormState;
  onFormStateChange: (
    next: StepUserDataFormState | ((previous: StepUserDataFormState) => StepUserDataFormState),
  ) => void;
  onGenerate: (input: GeneratePredictionInput) => Promise<void>;
  submitError: string | null;
  submitErrorCode: string | null;
  hasSelfSaved?: boolean;
}

export const BirthFormBubble = forwardRef<BirthFormHandle, BirthFormBubbleProps>(function BirthFormBubble(
  { formState, onFormStateChange, onGenerate, submitError, submitErrorCode, hasSelfSaved },
  ref,
) {
  const [target, setTarget] = useState<BirthTarget>("self");
  const [nickname, setNickname] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);

  const persistedLocation: LocationData | null =
    formState.birthLocation && formState.birthTimezone && formState.birthLat != null && formState.birthLng != null
      ? {
          city: formState.birthLocation.split(",")[0]?.trim() || "Cidade",
          state: formState.birthLocation.split(",")[1]?.trim() || "Estado",
          country: formState.birthLocation.split(",")[2]?.trim() || "Pais",
          lat: formState.birthLat,
          lng: formState.birthLng,
          timezone: formState.birthTimezone,
          displayName: formState.birthLocation,
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
    initialQuery: formState.placeQuery,
    initialLocation: persistedLocation,
  });

  useImperativeHandle(ref, () => ({
    canSubmit: () => isValidDate(formState.date),
    submit: async () => {
      if (!isValidDate(formState.date)) {
        setFormError("Informe uma data de nascimento válida.");
        return;
      }
      if (!isValidTime(formState.time)) {
        setFormError("Hora inválida. Use o formato HH:mm.");
        return;
      }

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

      setFormError(null);
      setLocationError(null);
      onFormStateChange((previous) => ({
        ...previous,
        placeQuery: resolvedLocation.displayName,
        birthLocation: resolvedLocation.displayName,
        birthTimezone: resolvedLocation.timezone,
        birthLat: resolvedLocation.lat,
        birthLng: resolvedLocation.lng,
      }));

      const payloadDynamicAnswers: Record<string, DynamicAnswerValue> = {};
      await onGenerate({
        date: formState.date,
        time: formState.time,
        gender: formState.gender || undefined,
        placeQuery,
        birthLocation: resolvedLocation.displayName,
        birthTimezone: resolvedLocation.timezone,
        birthLat: resolvedLocation.lat,
        birthLng: resolvedLocation.lng,
        dynamicAnswers: payloadDynamicAnswers,
      });
    },
  }));

  return (
    <div className="space-y-6">
      <div>
        <p className="text-[10px] font-semibold tracking-[0.22em] text-iris uppercase">03 · Seus dados</p>
        <h2 className="mt-2 font-jakarta text-[22px] leading-[1.35] font-black tracking-[0.01em] text-foreground uppercase sm:text-[28px]">
          Seus dados de nascimento
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">Para quem é a previsão?</p>
      </div>

      <div className="grid grid-cols-2 gap-2">
        {(
          [
            { key: "self" as const, icon: User, label: "Para mim" },
            { key: "other" as const, icon: Users, label: "Para outra pessoa" },
          ] as const
        ).map(({ key, icon: Icon, label }) => {
          const active = target === key;
          return (
            <button
              key={key}
              type="button"
              onClick={() => {
                setTarget(key);
                if (key === "other") setNickname("");
              }}
              className={cn(
                "flex items-center gap-2.5 rounded-2xl border px-3 py-3 text-left transition-colors",
                active
                  ? "border-foreground bg-foreground text-background"
                  : "border-border bg-background text-foreground hover:border-foreground/40",
              )}
            >
              <Icon className="size-4 shrink-0" strokeWidth={2} />
              <span className="font-jakarta text-[13px] font-black tracking-[0.005em] sm:text-sm">{label}</span>
            </button>
          );
        })}
      </div>

      {hasSelfSaved && target === "self" ? (
        <p className="text-[11px] leading-relaxed text-muted-foreground">
          Usando seus dados salvos. Para outra pessoa, escolha a opção ao lado.
        </p>
      ) : null}

      <div>
        <p className="mb-2 text-[10px] tracking-[0.18em] text-muted-foreground uppercase">Apelido</p>
        <Input
          value={nickname}
          onChange={(event) => setNickname(event.target.value)}
          placeholder={target === "self" ? "Como prefere ser chamado" : "Apelido dessa pessoa"}
          className="bg-background"
        />
      </div>

      <div>
        <p className="mb-2 text-[10px] tracking-[0.18em] text-muted-foreground uppercase">Gênero</p>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
          {GENDER_OPTIONS.map((option) => {
            const selected = formState.gender === option.value;
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => onFormStateChange((previous) => ({ ...previous, gender: option.value }))}
                className={cn(
                  "min-h-10 rounded-2xl border px-3 py-2 text-xs transition-colors",
                  selected
                    ? "border-foreground bg-foreground text-background"
                    : "border-border bg-card text-muted-foreground hover:text-foreground",
                )}
              >
                {option.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <p className="mb-2 text-[10px] tracking-[0.18em] text-muted-foreground uppercase">Data de nascimento *</p>
          <Input
            id="birth-date"
            type="date"
            value={formState.date}
            onChange={(event) => onFormStateChange((previous) => ({ ...previous, date: event.target.value }))}
            required
            className="bg-background"
          />
        </div>
        <div>
          <p className="mb-2 text-[10px] tracking-[0.18em] text-muted-foreground uppercase">Hora (opcional)</p>
          <Input
            id="birth-time"
            type="time"
            value={formState.time}
            onChange={(event) => onFormStateChange((previous) => ({ ...previous, time: event.target.value }))}
            className="bg-background"
          />
        </div>
      </div>

      <div className="relative space-y-2">
        <p className="text-[10px] tracking-[0.18em] text-muted-foreground uppercase">Cidade, estado e país *</p>
        <div className="relative">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            id="birth-place"
            type="text"
            value={placeQuery}
            onChange={(event) => {
              setPlaceQuery(event.target.value);
              onFormStateChange((previous) => ({
                ...previous,
                placeQuery: event.target.value,
                birthLocation: "",
                birthTimezone: null,
                birthLat: null,
                birthLng: null,
              }));
              setLocationError(null);
              setFormError(null);
            }}
            onFocus={() => setLocationOpen(locationResults.length > 0)}
            placeholder="Digite cidade, estado e país"
            className="bg-background pl-9"
          />
          {locationLoading ? (
            <Loader2 className="absolute top-1/2 right-3 size-4 -translate-y-1/2 animate-spin text-muted-foreground" />
          ) : null}
        </div>

        <AnimatePresence>
          {locationOpen ? (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 6 }}
              className="z-30 mt-1 max-h-48 overflow-y-auto rounded-2xl border border-border bg-card p-1"
            >
              {locationResults.map((locationOption) => (
                <button
                  key={`${locationOption.displayName}-${locationOption.lat}-${locationOption.lng}`}
                  type="button"
                  onClick={() => {
                    void handleSelectLocation(locationOption).then((resolvedLocation) => {
                      onFormStateChange((previous) => ({
                        ...previous,
                        placeQuery: resolvedLocation.displayName,
                        birthLocation: resolvedLocation.displayName,
                        birthTimezone: resolvedLocation.timezone,
                        birthLat: resolvedLocation.lat,
                        birthLng: resolvedLocation.lng,
                      }));
                    });
                    setLocationError(null);
                  }}
                  className="flex w-full items-start gap-2 rounded-lg px-3 py-2 text-left transition-colors hover:bg-muted"
                >
                  <MapPin className="mt-0.5 size-3.5 text-iris" />
                  <span className="text-xs leading-relaxed break-words text-foreground">{locationOption.displayName}</span>
                </button>
              ))}
            </motion.div>
          ) : null}
        </AnimatePresence>
        {locationError ? <p className="text-[11px] text-destructive">{locationError}</p> : null}
      </div>

      {formError ? <p className="text-[11px] text-destructive">{formError}</p> : null}
      {submitError ? (
        <div className="rounded-2xl border border-destructive/40 bg-destructive/10 p-4">
          <p className="text-sm text-destructive">{submitError}</p>
          {submitErrorCode === "INSUFFICIENT_CREDITS" ? (
            <a href="/precos" className="mt-2 inline-flex text-xs font-semibold tracking-wider uppercase text-foreground">
              Comprar créditos
            </a>
          ) : null}
        </div>
      ) : null}

      <p className="text-center font-mono-iris text-[11px] text-muted-foreground">Cálculo baseado em efemérides reais</p>
    </div>
  );
});
