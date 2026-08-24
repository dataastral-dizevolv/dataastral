"use client";

import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, Loader2, MapPin, Search } from "lucide-react";

import { useOptionalDashboardUser } from "@/components/dashboard/DashboardUserContext";
import { useLocationSearch } from "@/hooks/useLocationSearch";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { CalculatorQuestion, DynamicAnswerValue, GeneratePredictionInput, LocationData } from "@/types/calculator";

interface StepUserDataProps {
  selectedQuestion: string;
  dynamicQuestions: CalculatorQuestion[];
  dynamicQuestionsLoading: boolean;
  dynamicQuestionsError: string | null;
  formState: StepUserDataFormState;
  onFormStateChange: (next: StepUserDataFormState | ((previous: StepUserDataFormState) => StepUserDataFormState)) => void;
  onBack: () => void;
  onGenerate: (input: GeneratePredictionInput) => Promise<void>;
  submitError: string | null;
  submitErrorCode: string | null;
}

type GenderOption = "homem" | "mulher" | "nao_binario";

export interface StepUserDataFormState {
  date: string;
  time: string;
  gender: GenderOption | "";
  placeQuery: string;
  birthLocation: string;
  birthTimezone: string | null;
  birthLat: number | null;
  birthLng: number | null;
  dynamicAnswers: Record<string, DynamicAnswerValue>;
}

interface WheelOption {
  value: number;
  label: string;
}

const MONTH_LABELS = [
  "Jan",
  "Fev",
  "Mar",
  "Abr",
  "Mai",
  "Jun",
  "Jul",
  "Ago",
  "Set",
  "Out",
  "Nov",
  "Dez",
];

const GENDER_OPTIONS: Array<{ value: GenderOption; label: string }> = [
  { value: "homem", label: "Homem" },
  { value: "mulher", label: "Mulher" },
  { value: "nao_binario", label: "Não binário" },
];
const SHOW_DYNAMIC_QUESTIONS = false;

function pad2(value: number) {
  return String(value).padStart(2, "0");
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

function getDaysInMonth(year: number, month: number) {
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

function parseDateParts(value: string) {
  if (isValidDate(value)) {
    const [yearString, monthString, dayString] = value.split("-");
    return {
      year: Number(yearString),
      month: Number(monthString),
      day: Number(dayString),
    };
  }

  const now = new Date();
  return {
    year: now.getUTCFullYear(),
    month: now.getUTCMonth() + 1,
    day: now.getUTCDate(),
  };
}

function parseTimeParts(value: string) {
  if (isValidTime(value)) {
    const [hourString, minuteString] = value.split(":");
    return {
      hour: Number(hourString),
      minute: Number(minuteString),
    };
  }

  return { hour: 12, minute: 0 };
}

function buildIsoDate(year: number, month: number, day: number) {
  return `${year}-${pad2(month)}-${pad2(day)}`;
}

function formatDateForDisplay(value: string) {
  if (!isValidDate(value)) {
    return "Selecionar data";
  }

  const [yearString, monthString, dayString] = value.split("-");
  return `${dayString}/${monthString}/${yearString}`;
}

function formatTimeForDisplay(value: string) {
  if (!isValidTime(value)) {
    return "Não informado (12:00)";
  }

  return value;
}

function WheelColumn({
  title,
  options,
  selectedValue,
  onSelect,
}: {
  title: string;
  options: WheelOption[];
  selectedValue: number;
  onSelect: (value: number) => void;
}) {
  return (
    <div className="relative flex-1">
      <p className="mb-2 text-center font-mono-iris text-[11px] uppercase tracking-wider text-iris-secondary">{title}</p>
      <div className="pointer-events-none absolute inset-x-1 top-1/2 z-10 h-10 -translate-y-1/2 rounded-xl border border-powder-blue/40 bg-background/80" />
      <div className="h-44 snap-y snap-mandatory overflow-y-auto rounded-2xl border border-border bg-card/70 p-1 sm:h-48">
        <div className="h-20" />
        {options.map((option) => {
          const isSelected = option.value === selectedValue;

          return (
            <button
              key={`${title}-${option.value}`}
              type="button"
              onClick={() => onSelect(option.value)}
              className={`h-10 w-full snap-center rounded-lg px-2 text-center text-sm transition-colors ${
                isSelected
                  ? "bg-iris-accent/20 text-foreground"
                  : "text-iris-secondary hover:bg-background/50 hover:text-foreground"
              }`}
            >
              <span className="block truncate text-xs sm:text-sm">{option.label}</span>
            </button>
          );
        })}
        <div className="h-20" />
      </div>
    </div>
  );
}

export function StepUserData({
  selectedQuestion,
  dynamicQuestions,
  dynamicQuestionsLoading,
  dynamicQuestionsError,
  formState,
  onFormStateChange,
  onBack,
  onGenerate,
  submitError,
  submitErrorCode,
}: StepUserDataProps) {
  const dashboardUser = useOptionalDashboardUser();
  const prefillUser = dashboardUser?.user;
  const date = formState.date || prefillUser?.birthDate || "";
  const time = formState.time || (prefillUser?.birthTime ?? "").slice(0, 5);
  const gender = formState.gender;
  const dynamicAnswers = formState.dynamicAnswers;
  const [dateWheelOpen, setDateWheelOpen] = useState(false);
  const [timeWheelOpen, setTimeWheelOpen] = useState(false);
  const [dateWheelValue, setDateWheelValue] = useState(parseDateParts(date));
  const [timeWheelValue, setTimeWheelValue] = useState(parseTimeParts(time));
  const [formError, setFormError] = useState<string | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);

  const persistedLocation =
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

  const profileLocation: LocationData | null =
    prefillUser?.birthLocation && prefillUser.birthTimezone && prefillUser.birthLat != null && prefillUser.birthLng != null
      ? {
          city: prefillUser.birthLocation.split(",")[0]?.trim() || "Cidade",
          state: prefillUser.birthLocation.split(",")[1]?.trim() || "Estado",
          country: prefillUser.birthLocation.split(",")[2]?.trim() || "Pais",
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
    initialQuery: formState.placeQuery || prefillUser?.birthLocation || "",
    initialLocation: persistedLocation ?? profileLocation,
  });

  const currentYear = new Date().getUTCFullYear();
  const yearOptions = useMemo<WheelOption[]>(() => {
    const options: WheelOption[] = [];
    for (let year = currentYear; year >= 1900; year -= 1) {
      options.push({ value: year, label: String(year) });
    }
    return options;
  }, [currentYear]);

  const monthOptions = useMemo<WheelOption[]>(
    () => MONTH_LABELS.map((monthLabel, index) => ({ value: index + 1, label: monthLabel })),
    [],
  );

  const dayOptions = useMemo<WheelOption[]>(() => {
    const totalDays = getDaysInMonth(dateWheelValue.year, dateWheelValue.month);
    return Array.from({ length: totalDays }, (_, index) => {
      const dayValue = index + 1;
      return { value: dayValue, label: pad2(dayValue) };
    });
  }, [dateWheelValue.month, dateWheelValue.year]);

  const hourOptions = useMemo<WheelOption[]>(
    () => Array.from({ length: 24 }, (_, index) => ({ value: index, label: pad2(index) })),
    [],
  );

  const minuteOptions = useMemo<WheelOption[]>(
    () => Array.from({ length: 60 }, (_, index) => ({ value: index, label: pad2(index) })),
    [],
  );
  const nativeSelectStyle = useMemo(
    () => ({ color: "hsl(var(--foreground))", backgroundColor: "hsl(var(--background))" }),
    [],
  );

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

    if (SHOW_DYNAMIC_QUESTIONS) {
      for (const question of dynamicQuestions) {
        if (!question.isRequired) {
          continue;
        }

        const answer = dynamicAnswers[question.fieldName] ?? (question.type === "checkbox" ? [] : "");
        if (question.type === "checkbox") {
          if (!Array.isArray(answer) || answer.length === 0) {
            setFormError(`A pergunta "${question.label}" é obrigatória.`);
            return;
          }
          continue;
        }

        if (typeof answer !== "string" || answer.trim().length === 0) {
          setFormError(`A pergunta "${question.label}" é obrigatória.`);
          return;
        }
      }
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
    const payloadDynamicAnswers: Record<string, DynamicAnswerValue> = {};
    onFormStateChange((previous) => ({
      ...previous,
      placeQuery: resolvedLocation.displayName,
      birthLocation: resolvedLocation.displayName,
      birthTimezone: resolvedLocation.timezone,
      birthLat: resolvedLocation.lat,
      birthLng: resolvedLocation.lng,
    }));

    if (SHOW_DYNAMIC_QUESTIONS) {
      for (const question of dynamicQuestions) {
        const current = dynamicAnswers[question.fieldName];
        payloadDynamicAnswers[question.fieldName] = current ?? (question.type === "checkbox" ? [] : "");
      }
    }

    await onGenerate({
      date,
      time,
      gender: gender || undefined,
      placeQuery,
      birthLocation: resolvedLocation.displayName,
      birthTimezone: resolvedLocation.timezone,
      birthLat: resolvedLocation.lat,
      birthLng: resolvedLocation.lng,
      dynamicAnswers: payloadDynamicAnswers,
    });
  }

  function openDateWheel() {
    setDateWheelValue(parseDateParts(date));
    setDateWheelOpen(true);
  }

  function saveDateWheel() {
    const maxDay = getDaysInMonth(dateWheelValue.year, dateWheelValue.month);
    const safeDay = Math.min(dateWheelValue.day, maxDay);
    onFormStateChange((previous) => ({
      ...previous,
      date: buildIsoDate(dateWheelValue.year, dateWheelValue.month, safeDay),
    }));
    setDateWheelOpen(false);
  }

  function openTimeWheel() {
    setTimeWheelValue(parseTimeParts(time));
    setTimeWheelOpen(true);
  }

  function saveTimeWheel() {
    onFormStateChange((previous) => ({
      ...previous,
      time: `${pad2(timeWheelValue.hour)}:${pad2(timeWheelValue.minute)}`,
    }));
    setTimeWheelOpen(false);
  }

  return (
    <>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <Button
            type="button"
            variant="ghost"
            onClick={onBack}
            className="mb-3 inline-flex h-8 items-center gap-1.5 rounded-full border border-border bg-card/60 px-2.5 text-xs text-muted-foreground hover:border-iris-accent/40 hover:bg-card hover:text-foreground"
          >
            <ArrowLeft className="size-3.5" />
            Voltar
          </Button>
          <p className="mb-1 font-mono-iris text-xs uppercase tracking-wider text-iris-secondary">Passo 3</p>
          <h3 className="font-display text-lg text-foreground">Seus dados de nascimento</h3>
          <p className="mt-1 line-clamp-2 break-words text-xs italic text-iris-secondary">&quot;{selectedQuestion}&quot;</p>
        </div>

        <div className="space-y-2">
          <Label className="font-mono-iris text-xs uppercase tracking-wider text-iris-secondary">Gênero</Label>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
            {GENDER_OPTIONS.map((option) => {
              const selected = gender === option.value;
              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() =>
                    onFormStateChange((previous) => ({
                      ...previous,
                      gender: option.value,
                    }))
                  }
                  className={`min-h-10 rounded-2xl border px-3 py-2 text-xs font-body tracking-wide transition-colors ${
                    selected
                      ? "border-powder-blue bg-powder-blue/15 text-foreground ring-1 ring-powder-blue/40"
                      : "border-border bg-card/70 text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <span className="block whitespace-normal break-words leading-tight">{option.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="birth-date" className="font-mono-iris text-xs uppercase tracking-wider text-iris-secondary">
              Data de nascimento <span className="text-destructive">*</span>
            </Label>
            <Input
              id="birth-date"
              type="date"
              value={date}
              onChange={(event) =>
                onFormStateChange((previous) => ({
                  ...previous,
                  date: event.target.value,
                }))
              }
              required
              className="hidden bg-muted sm:block"
            />
            <button
              type="button"
              onClick={openDateWheel}
              className="block h-10 w-full rounded-xl border border-border bg-card px-3 text-left text-sm text-foreground sm:hidden"
            >
              {formatDateForDisplay(date)}
            </button>
          </div>

          <div className="space-y-2">
            <Label htmlFor="birth-time" className="font-mono-iris text-xs uppercase tracking-wider text-iris-secondary">
              Hora de nascimento (opcional)
            </Label>
            <Input
              id="birth-time"
              type="time"
              value={time}
              onChange={(event) =>
                onFormStateChange((previous) => ({
                  ...previous,
                  time: event.target.value,
                }))
              }
              className="hidden bg-muted sm:block"
            />
            <button
              type="button"
              onClick={openTimeWheel}
              className="block h-10 w-full rounded-xl border border-border bg-card px-3 text-left text-sm text-foreground sm:hidden"
            >
              {formatTimeForDisplay(time)}
            </button>
          </div>
        </div>

        <div className="relative space-y-2">
          <Label htmlFor="birth-place" className="font-mono-iris text-xs uppercase tracking-wider text-iris-secondary">
            Cidade, estado e país de nascimento <span className="text-destructive">*</span>
          </Label>

          <div className="relative">
            <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-iris-muted" />
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
              className="border-border bg-card pl-9"
            />
            {locationLoading ? <Loader2 className="absolute top-1/2 right-3 size-4 -translate-y-1/2 animate-spin text-iris-muted" /> : null}
          </div>

          <AnimatePresence>
            {locationOpen ? (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 6 }}
                className="z-30 mt-1 max-h-80 overflow-y-auto rounded-2xl border border-border bg-card p-1 shadow-md"
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
                    className="flex w-full items-start gap-2 rounded-lg px-3 py-2 text-left transition-colors hover:bg-background/70"
                  >
                    <MapPin className="mt-0.5 size-3.5 text-iris-accent" />
                    <span className="break-words text-xs leading-relaxed text-foreground">{locationOption.displayName}</span>
                  </button>
                ))}
              </motion.div>
            ) : null}
          </AnimatePresence>

          {locationError ? <p className="text-[11px] text-destructive">{locationError}</p> : null}
        </div>

        {SHOW_DYNAMIC_QUESTIONS && dynamicQuestionsLoading ? (
          <div className="space-y-3 border-b border-iris/40 pb-4">
            <div className="h-4 w-32 animate-pulse rounded bg-muted/40" />
            <div className="h-10 animate-pulse rounded-md bg-muted/40" />
            <div className="h-10 animate-pulse rounded-md bg-muted/40" />
          </div>
        ) : null}

        {SHOW_DYNAMIC_QUESTIONS && !dynamicQuestionsLoading && dynamicQuestions.length > 0 ? (
          <div className="space-y-4 border-b border-iris/40 pb-4">
            <div>
              <p className="mb-1 font-mono-iris text-xs uppercase tracking-wider text-iris-secondary">Personalização</p>
              <p className="text-xs text-iris-muted">Suas respostas ajudam a adaptar o texto final da previsão.</p>
            </div>

            {dynamicQuestions.map((question) => (
              <div key={question.id} className="space-y-2">
                <Label className="font-mono-iris text-xs uppercase tracking-wider text-iris-secondary">
                  {question.label} {question.isRequired ? "*" : "(opcional)"}
                </Label>

                {question.type === "text" ? (
                  <Input
                    type="text"
                    value={typeof dynamicAnswers[question.fieldName] === "string" ? (dynamicAnswers[question.fieldName] as string) : ""}
                    onChange={(event) =>
                      onFormStateChange((previous) => ({
                        ...previous,
                        dynamicAnswers: {
                          ...previous.dynamicAnswers,
                          [question.fieldName]: event.target.value,
                        },
                      }))
                    }
                    placeholder="Digite sua resposta"
                    className="rounded-md border-iris bg-muted placeholder:text-iris-muted"
                  />
                ) : null}

                {question.type === "select" ? (
                  <select
                    value={typeof dynamicAnswers[question.fieldName] === "string" ? (dynamicAnswers[question.fieldName] as string) : ""}
                    onChange={(event) =>
                      onFormStateChange((previous) => ({
                        ...previous,
                        dynamicAnswers: {
                          ...previous.dynamicAnswers,
                          [question.fieldName]: event.target.value,
                        },
                      }))
                    }
                    className="h-10 w-full rounded-md border border-iris bg-background px-3 text-sm text-foreground"
                    style={nativeSelectStyle}
                  >
                    <option value="" style={nativeSelectStyle}>Selecione uma opção</option>
                    {question.options.map((option) => (
                      <option key={`${question.fieldName}-${option.value}`} value={option.value} style={nativeSelectStyle}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                ) : null}

                {question.type === "checkbox" ? (
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                    {question.options.map((option) => {
                      const current = dynamicAnswers[question.fieldName];
                      const selectedValues = Array.isArray(current) ? current : [];
                      const isChecked = selectedValues.includes(option.value);

                      return (
                        <label
                          key={`${question.fieldName}-${option.value}`}
                          className="flex items-center gap-2 rounded-md border border-iris bg-muted/40 px-3 py-2 text-sm"
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={(event) => {
                              onFormStateChange((previous) => {
                                const rawValue = previous.dynamicAnswers[question.fieldName];
                                const previousValues = Array.isArray(rawValue) ? rawValue : [];
                                const nextValues = event.target.checked
                                  ? (previousValues.includes(option.value) ? previousValues : [...previousValues, option.value])
                                  : previousValues.filter((value) => value !== option.value);
                                return {
                                  ...previous,
                                  dynamicAnswers: {
                                    ...previous.dynamicAnswers,
                                    [question.fieldName]: nextValues,
                                  },
                                };
                              });
                            }}
                          />
                          <span>{option.label}</span>
                        </label>
                      );
                    })}
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        ) : null}

        {SHOW_DYNAMIC_QUESTIONS && !dynamicQuestionsLoading && dynamicQuestionsError ? <p className="text-[11px] text-destructive">{dynamicQuestionsError}</p> : null}

        <Button type="submit" className="w-full font-body text-xs uppercase tracking-wider">
          Gerar minha previsão
        </Button>

        {formError ? <p className="text-[11px] text-destructive">{formError}</p> : null}

        {submitError ? (
          <div className="space-y-3 rounded-2xl border border-destructive/40 bg-destructive/10 p-4">
            <p className="text-sm text-destructive">{submitError}</p>
            {submitErrorCode === "INSUFFICIENT_CREDITS" ? (
              <Button className="w-full font-body text-xs uppercase tracking-wider">Comprar créditos</Button>
            ) : null}
          </div>
        ) : null}

        <p className="text-center font-mono-iris text-[11px] text-iris-muted">
          Cálculo baseado em efemérides reais - atualize seus dados no perfil quando precisar
        </p>
      </form>

      <Dialog open={dateWheelOpen} onOpenChange={setDateWheelOpen}>
        <DialogContent className="max-w-[calc(100%-1rem)] rounded-2xl border border-border bg-card p-4 sm:max-w-xl sm:p-5" showCloseButton={false}>
          <DialogHeader>
            <DialogTitle className="font-display text-base text-foreground">Escolha sua data de nascimento</DialogTitle>
            <DialogDescription className="sr-only">Selecione o dia, mês e ano do nascimento</DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-3 gap-2">
            <WheelColumn
              title="Dia"
              options={dayOptions}
              selectedValue={dateWheelValue.day}
              onSelect={(day) => setDateWheelValue((previous) => ({ ...previous, day }))}
            />
            <WheelColumn
              title="Mês"
              options={monthOptions}
              selectedValue={dateWheelValue.month}
              onSelect={(month) => {
                setDateWheelValue((previous) => {
                  const maxDay = getDaysInMonth(previous.year, month);
                  return { ...previous, month, day: Math.min(previous.day, maxDay) };
                });
              }}
            />
            <WheelColumn
              title="Ano"
              options={yearOptions}
              selectedValue={dateWheelValue.year}
              onSelect={(year) => {
                setDateWheelValue((previous) => {
                  const maxDay = getDaysInMonth(year, previous.month);
                  return { ...previous, year, day: Math.min(previous.day, maxDay) };
                });
              }}
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={() => setDateWheelOpen(false)}>
              Cancelar
            </Button>
            <Button type="button" onClick={saveDateWheel}>
              Aplicar
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={timeWheelOpen} onOpenChange={setTimeWheelOpen}>
        <DialogContent className="max-w-[calc(100%-1rem)] rounded-2xl border border-border bg-card p-4 sm:max-w-md sm:p-5" showCloseButton={false}>
          <DialogHeader>
            <DialogTitle className="font-display text-base text-foreground">Escolha sua hora de nascimento</DialogTitle>
            <DialogDescription className="sr-only">Selecione a hora e minuto do nascimento</DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-2 gap-2">
            <WheelColumn
              title="Hora"
              options={hourOptions}
              selectedValue={timeWheelValue.hour}
              onSelect={(hour) => setTimeWheelValue((previous) => ({ ...previous, hour }))}
            />
            <WheelColumn
              title="Minuto"
              options={minuteOptions}
              selectedValue={timeWheelValue.minute}
              onSelect={(minute) => setTimeWheelValue((previous) => ({ ...previous, minute }))}
            />
          </div>

          <div className="flex flex-wrap justify-between gap-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                onFormStateChange((previous) => ({
                  ...previous,
                  time: "",
                }));
                setTimeWheelOpen(false);
              }}
            >
              Não sei a hora
            </Button>
            <div className="flex gap-2">
              <Button type="button" variant="ghost" onClick={() => setTimeWheelOpen(false)}>
                Cancelar
              </Button>
              <Button type="button" onClick={saveTimeWheel}>
                Aplicar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
