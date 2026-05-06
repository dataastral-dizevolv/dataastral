"use client";

import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Loader2, MapPin, Search } from "lucide-react";

import { useOptionalDashboardUser } from "@/components/dashboard/DashboardUserContext";
import { useLocationSearch } from "@/hooks/useLocationSearch";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { CalculatorQuestion, DynamicAnswerValue, GeneratePredictionInput } from "@/types/calculator";

interface StepUserDataProps {
  selectedQuestion: string;
  dynamicQuestions: CalculatorQuestion[];
  dynamicQuestionsLoading: boolean;
  dynamicQuestionsError: string | null;
  onBack: () => void;
  onGenerate: (input: GeneratePredictionInput) => Promise<void>;
  submitError: string | null;
  submitErrorCode: string | null;
}

type GenderOption = "homem" | "mulher" | "nao_binario";

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
  { value: "nao_binario", label: "Nao-binario" },
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
    return "Nao informado (12:00)";
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
      <div className="pointer-events-none absolute inset-x-1 top-1/2 z-10 h-10 -translate-y-1/2 rounded-md border border-foreground/20 bg-background/70" />
      <div className="h-44 snap-y snap-mandatory overflow-y-auto rounded-md border border-iris/50 bg-muted/30 p-1 sm:h-48">
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
  onBack,
  onGenerate,
  submitError,
  submitErrorCode,
}: StepUserDataProps) {
  const dashboardUser = useOptionalDashboardUser();
  const prefillUser = dashboardUser?.user;
  const [date, setDate] = useState(prefillUser?.birthDate ?? "");
  const [time, setTime] = useState((prefillUser?.birthTime ?? "").slice(0, 5));
  const [gender, setGender] = useState<GenderOption | "">("");
  const [dateWheelOpen, setDateWheelOpen] = useState(false);
  const [timeWheelOpen, setTimeWheelOpen] = useState(false);
  const [dateWheelValue, setDateWheelValue] = useState(parseDateParts(prefillUser?.birthDate ?? ""));
  const [timeWheelValue, setTimeWheelValue] = useState(parseTimeParts((prefillUser?.birthTime ?? "").slice(0, 5)));
  const [dynamicAnswers, setDynamicAnswers] = useState<Record<string, DynamicAnswerValue>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);

  const profileLocation =
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
    initialQuery: prefillUser?.birthLocation ?? "",
    initialLocation: profileLocation,
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
      setFormError("Informe uma data de nascimento valida.");
      return;
    }

    if (time && !isValidTime(time)) {
      setFormError("Hora invalida. Use o formato HH:mm.");
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
      setLocationError("Selecione uma opcao da lista para confirmar local e timezone.");
      return;
    }

    if (!resolvedLocation.timezone) {
      setLocationError("Nao foi possivel identificar o timezone. Escolha outra opcao da lista.");
      return;
    }

    setLocationError(null);
    const payloadDynamicAnswers: Record<string, DynamicAnswerValue> = {};

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
    setDate(buildIsoDate(dateWheelValue.year, dateWheelValue.month, safeDay));
    setDateWheelOpen(false);
  }

  function openTimeWheel() {
    setTimeWheelValue(parseTimeParts(time));
    setTimeWheelOpen(true);
  }

  function saveTimeWheel() {
    setTime(`${pad2(timeWheelValue.hour)}:${pad2(timeWheelValue.minute)}`);
    setTimeWheelOpen(false);
  }

  return (
    <>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <Button type="button" variant="ghost" onClick={onBack} className="mb-3 h-auto p-0 text-xs text-iris-secondary hover:text-foreground">
            Voltar as perguntas
          </Button>
          <p className="mb-1 font-mono-iris text-xs uppercase tracking-wider text-iris-secondary">Passo 3</p>
          <h3 className="font-display text-lg text-foreground">Seus dados de nascimento</h3>
          <p className="mt-1 line-clamp-2 break-words text-xs italic text-iris-secondary">&quot;{selectedQuestion}&quot;</p>
        </div>

        <div className="space-y-2">
          <Label className="font-mono-iris text-xs uppercase tracking-wider text-iris-secondary">Genero</Label>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
            {GENDER_OPTIONS.map((option) => {
              const selected = gender === option.value;
              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setGender(option.value)}
                  className={`min-h-10 rounded-md border px-3 py-2 text-xs font-body tracking-wide transition-colors ${
                    selected
                      ? "border-foreground bg-muted text-foreground"
                      : "border-iris bg-muted/70 text-iris-secondary hover:text-foreground"
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
              Data de nascimento
            </Label>
            <Input id="birth-date" type="date" value={date} onChange={(event) => setDate(event.target.value)} required className="hidden bg-muted sm:block" />
            <button
              type="button"
              onClick={openDateWheel}
              className="block h-10 w-full rounded-md border border-iris bg-muted/70 px-3 text-left text-sm text-foreground sm:hidden"
            >
              {formatDateForDisplay(date)}
            </button>
          </div>

          <div className="space-y-2">
            <Label htmlFor="birth-time" className="font-mono-iris text-xs uppercase tracking-wider text-iris-secondary">
              Hora de nascimento (opcional)
            </Label>
            <Input id="birth-time" type="time" value={time} onChange={(event) => setTime(event.target.value)} className="hidden bg-muted sm:block" />
            <button
              type="button"
              onClick={openTimeWheel}
              className="block h-10 w-full rounded-md border border-iris bg-muted/70 px-3 text-left text-sm text-foreground sm:hidden"
            >
              {formatTimeForDisplay(time)}
            </button>
          </div>
        </div>

        <div className="relative space-y-2">
          <Label htmlFor="birth-place" className="font-mono-iris text-xs uppercase tracking-wider text-iris-secondary">
            Cidade, estado e pais de nascimento
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
              placeholder="Digite cidade, estado e pais"
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
                className="z-30 mt-1 max-h-80 overflow-y-auto rounded-md border border-iris bg-muted p-1"
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
                    <span className="break-words text-xs leading-relaxed text-foreground">{locationOption.displayName}</span>
                  </button>
                ))}
              </motion.div>
            ) : null}
          </AnimatePresence>

          {locationError ? <p className="text-[11px] text-red-300">{locationError}</p> : null}
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
                      setDynamicAnswers((previous) => ({
                        ...previous,
                        [question.fieldName]: event.target.value,
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
                      setDynamicAnswers((previous) => ({
                        ...previous,
                        [question.fieldName]: event.target.value,
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
                              setDynamicAnswers((previous) => {
                                const rawValue = previous[question.fieldName];
                                const previousValues = Array.isArray(rawValue) ? rawValue : [];
                                const nextValues = event.target.checked
                                  ? (previousValues.includes(option.value) ? previousValues : [...previousValues, option.value])
                                  : previousValues.filter((value) => value !== option.value);
                                return {
                                  ...previous,
                                  [question.fieldName]: nextValues,
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

        {SHOW_DYNAMIC_QUESTIONS && !dynamicQuestionsLoading && dynamicQuestionsError ? <p className="text-[11px] text-amber-300">{dynamicQuestionsError}</p> : null}

        <Button type="submit" className="w-full font-body text-xs uppercase tracking-wider">
          Gerar minha previsao
        </Button>

        {formError ? <p className="text-[11px] text-red-300">{formError}</p> : null}

        {submitError ? (
          <div className="space-y-3 rounded-md border border-red-500/50 bg-red-500/10 p-4">
            <p className="text-sm text-red-200">{submitError}</p>
            {submitErrorCode === "INSUFFICIENT_CREDITS" ? (
              <Button className="w-full font-body text-xs uppercase tracking-wider">Comprar creditos</Button>
            ) : null}
          </div>
        ) : null}

        <p className="text-center font-mono-iris text-[11px] text-iris-muted">
          Calculo baseado em efemerides reais - atualize seus dados no perfil quando precisar
        </p>
      </form>

      <Dialog open={dateWheelOpen} onOpenChange={setDateWheelOpen}>
        <DialogContent className="max-w-[calc(100%-1rem)] rounded-md border border-iris bg-background p-4 sm:max-w-xl sm:p-5" showCloseButton={false}>
          <DialogHeader>
            <DialogTitle className="font-display text-base text-foreground">Escolha sua data de nascimento</DialogTitle>
          </DialogHeader>

          <div className="grid grid-cols-3 gap-2">
            <WheelColumn
              title="Dia"
              options={dayOptions}
              selectedValue={dateWheelValue.day}
              onSelect={(day) => setDateWheelValue((previous) => ({ ...previous, day }))}
            />
            <WheelColumn
              title="Mes"
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
        <DialogContent className="max-w-[calc(100%-1rem)] rounded-md border border-iris bg-background p-4 sm:max-w-md sm:p-5" showCloseButton={false}>
          <DialogHeader>
            <DialogTitle className="font-display text-base text-foreground">Escolha sua hora de nascimento</DialogTitle>
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
                setTime("");
                setTimeWheelOpen(false);
              }}
            >
              Nao sei a hora
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
