"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { useSWRConfig } from "swr";

import type { StepUserDataFormState } from "@/components/calculator/StepUserData";
import { DASHBOARD_ME_KEY } from "@/components/dashboard/DashboardUserContext";
import { themeToCategory } from "@/lib/calculator-categories";
import { toUserFacingMessage } from "@/lib/errors/user-facing";
import { tryCreateClient } from "@/lib/supabase/client";
import type {
  CalcState,
  CalcStep,
  CalculatorQuestion,
  GeneratePredictionInput,
  PredictErrorResponse,
  PredictSuccessResponse,
  ThemeId,
} from "@/types/calculator";

const PENDING_PREDICTION_STORAGE_KEY = "pending_prediction_payload";

export type CalculatorContext = "public" | "app";

interface PendingPredictionPayload {
  theme: ThemeId;
  question: string;
  input: GeneratePredictionInput;
}

export interface PredictionResult {
  prediction: string;
  eventDate: string | null;
  eventDateIso: string | null;
  engineCode: string | null;
  remainingCredits: number | null;
  remainingFreeQuestions: number | null;
  predictionId: string | null;
  whatsappText: string | null;
  audioText: string | null;
}

const INITIAL_USER_DATA_FORM_STATE: StepUserDataFormState = {
  date: "",
  time: "",
  gender: "",
  placeQuery: "",
  birthLocation: "",
  birthTimezone: null,
  birthLat: null,
  birthLng: null,
  dynamicAnswers: {},
};

const EMPTY_RESULT: PredictionResult = {
  prediction: "",
  eventDate: null,
  eventDateIso: null,
  engineCode: null,
  remainingCredits: null,
  remainingFreeQuestions: null,
  predictionId: null,
  whatsappText: null,
  audioText: null,
};

function readPendingPayload() {
  const raw = sessionStorage.getItem(PENDING_PREDICTION_STORAGE_KEY);
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as PendingPredictionPayload;
    if (!parsed.theme || !parsed.question || !parsed.input) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

function storePendingPayload(payload: PendingPredictionPayload) {
  sessionStorage.setItem(PENDING_PREDICTION_STORAGE_KEY, JSON.stringify(payload));
}

function clearPendingPayload() {
  sessionStorage.removeItem(PENDING_PREDICTION_STORAGE_KEY);
}

function toIsoDate(eventDate?: string, eventDateIso?: string) {
  if (eventDateIso && /^\d{4}-\d{2}-\d{2}$/.test(eventDateIso)) {
    return eventDateIso;
  }

  const match = eventDate?.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (match) {
    return `${match[3]}-${match[2]}-${match[1]}`;
  }

  return null;
}

export function useCalculatorPrediction(context: CalculatorContext) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { mutate } = useSWRConfig();

  const [state, setState] = useState<CalcState>("flow");
  const [step, setStep] = useState<CalcStep>(1);
  const [selectedTheme, setSelectedTheme] = useState<ThemeId | null>(null);
  const [selectedQuestion, setSelectedQuestion] = useState<string | null>(null);
  const [themeQuestions, setThemeQuestions] = useState<string[]>([]);
  const [themeQuestionsLoading, setThemeQuestionsLoading] = useState(false);
  const [themeQuestionsError, setThemeQuestionsError] = useState<string | null>(null);
  const [result, setResult] = useState<PredictionResult>(EMPTY_RESULT);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitErrorCode, setSubmitErrorCode] = useState<string | null>(null);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authNextPath, setAuthNextPath] = useState(`${pathname}?resumePrediction=1`);
  const [dynamicQuestions, setDynamicQuestions] = useState<CalculatorQuestion[]>([]);
  const [dynamicQuestionsLoading, setDynamicQuestionsLoading] = useState(false);
  const [dynamicQuestionsError, setDynamicQuestionsError] = useState<string | null>(null);
  const [userDataFormState, setUserDataFormState] = useState<StepUserDataFormState>(INITIAL_USER_DATA_FORM_STATE);
  const [isAuthenticated, setIsAuthenticated] = useState(context === "app");
  const [credits, setCredits] = useState<number | null>(null);
  const [freeQuestionsRemaining, setFreeQuestionsRemaining] = useState<number | null>(null);

  const clearResumeQueryParam = useCallback(() => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("resumePrediction");
    const query = params.toString();
    const target = query.length > 0 ? `${pathname}?${query}` : pathname;
    router.replace(target, { scroll: false });
  }, [pathname, router, searchParams]);

  const handleGenerate = useCallback(
    async (
      input: GeneratePredictionInput,
      options?: {
        theme?: ThemeId;
        question?: string;
      },
    ) => {
      const themeToUse = options?.theme ?? selectedTheme;
      const questionToUse = options?.question ?? selectedQuestion;
      if (!themeToUse || !questionToUse) return;

      setSubmitError(null);
      setSubmitErrorCode(null);

      const supabase = tryCreateClient();
      let user: { id: string } | null = null;

      try {
        if (supabase) {
          const {
            data: { user: authUser },
          } = await supabase.auth.getUser();
          user = authUser;
          setIsAuthenticated(Boolean(authUser));
        }
      } catch {
        user = null;
        setIsAuthenticated(false);
      }

      const body = {
        theme: themeToUse,
        question: questionToUse,
        birthDate: input.date,
        birthTime: input.time?.trim() ?? "",
        gender: input.gender ?? null,
        birthLocation: input.birthLocation,
        birthTimezone: input.birthTimezone,
        birthLat: input.birthLat,
        birthLng: input.birthLng,
        placeQuery: input.placeQuery,
        dynamicAnswers: input.dynamicAnswers ?? null,
      };

      if (!user) {
        setSelectedTheme(themeToUse);
        setSelectedQuestion(questionToUse);
        setState("loading");

        try {
          const response = await fetch("/api/predict-public", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
          });
          const payload = (await response.json()) as PredictSuccessResponse | PredictErrorResponse;

          if (!response.ok) {
            const errorPayload = payload as PredictErrorResponse;
            if (errorPayload.code === "FREE_LIMIT_REACHED") {
              storePendingPayload({ theme: themeToUse, question: questionToUse, input });
              setSubmitError(
                toUserFacingMessage(
                  errorPayload,
                  "Você já usou suas 3 leituras gratuitas. Entre ou crie uma conta para continuar.",
                ),
              );
              setSubmitErrorCode(errorPayload.code ?? null);
              setAuthNextPath(`${pathname}?resumePrediction=1`);
              setAuthModalOpen(true);
              setState("flow");
              setStep(3);
              return;
            }

            setSubmitError(
              toUserFacingMessage(
                errorPayload,
                "Não foi possível gerar sua previsão agora. Tente novamente em instantes.",
              ),
            );
            setSubmitErrorCode(errorPayload.code ?? null);
            setState("flow");
            setStep(3);
            return;
          }

          const successPayload = payload as PredictSuccessResponse;
          setResult({
            prediction: successPayload.prediction,
            eventDate: successPayload.eventDate ?? null,
            eventDateIso: toIsoDate(successPayload.eventDate, successPayload.eventDateIso),
            engineCode: successPayload.engineCode ?? null,
            remainingCredits: null,
            remainingFreeQuestions: successPayload.remainingFreeQuestions ?? null,
            predictionId: successPayload.predictionId ?? null,
            whatsappText: successPayload.whatsapp_text ?? successPayload.prediction,
            audioText: successPayload.audio_text ?? successPayload.prediction,
          });
          setFreeQuestionsRemaining(successPayload.remainingFreeQuestions ?? null);
          setState("result");
        } catch {
          setSubmitError("Falha de conexão ao gerar a previsão.");
          setSubmitErrorCode(null);
          setState("flow");
          setStep(3);
        }
        return;
      }

      storePendingPayload({ theme: themeToUse, question: questionToUse, input });
      setSelectedTheme(themeToUse);
      setSelectedQuestion(questionToUse);
      setState("loading");

      try {
        const response = await fetch("/api/predict", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        const payload = (await response.json()) as PredictSuccessResponse | PredictErrorResponse;

        if (!response.ok) {
          const errorPayload = payload as PredictErrorResponse;

          if (response.status === 401 || errorPayload.code === "AUTH_REQUIRED") {
            setAuthNextPath(`${pathname}?resumePrediction=1`);
            setAuthModalOpen(true);
            setState("flow");
            setStep(3);
            return;
          }

          setSubmitError(
            toUserFacingMessage(
              errorPayload,
              "Não foi possível gerar sua previsão agora. Tente novamente em instantes.",
            ),
          );
          setSubmitErrorCode(errorPayload.code ?? null);
          setState("flow");
          setStep(3);
          return;
        }

        const successPayload = payload as PredictSuccessResponse;
        setResult({
          prediction: successPayload.prediction,
          eventDate: successPayload.eventDate ?? null,
          eventDateIso: toIsoDate(successPayload.eventDate, successPayload.eventDateIso),
          engineCode: successPayload.engineCode ?? null,
          remainingCredits: successPayload.remainingCredits,
          remainingFreeQuestions: successPayload.remainingFreeQuestions ?? null,
          predictionId: successPayload.predictionId ?? null,
          whatsappText: successPayload.whatsapp_text ?? successPayload.prediction,
          audioText: successPayload.audio_text ?? successPayload.prediction,
        });
        setCredits(successPayload.remainingCredits);
        setFreeQuestionsRemaining(successPayload.remainingFreeQuestions ?? null);
        setState("result");
        clearPendingPayload();

        void Promise.all([
          mutate(DASHBOARD_ME_KEY),
          mutate((key) => typeof key === "string" && key.startsWith("/api/credits/transactions")),
          mutate((key) => typeof key === "string" && key.startsWith("/api/predictions/history")),
        ]);
      } catch {
        setSubmitError("Falha de conexão ao gerar a previsão.");
        setSubmitErrorCode(null);
        setState("flow");
        setStep(3);
      }
    },
    [mutate, pathname, selectedQuestion, selectedTheme],
  );

  useEffect(() => {
    const shouldResume = searchParams.get("resumePrediction") === "1";
    if (!shouldResume) return;

    let cancelled = false;

    const run = async () => {
      const pending = readPendingPayload();
      if (!pending) {
        clearResumeQueryParam();
        return;
      }

      setSelectedTheme(pending.theme);
      setSelectedQuestion(pending.question);
      setStep(3);
      setSubmitError(null);
      setSubmitErrorCode(null);

      const supabase = tryCreateClient();
      let user: { id: string } | null = null;
      try {
        if (supabase) {
          const {
            data: { user: authUser },
          } = await supabase.auth.getUser();
          user = authUser;
          setIsAuthenticated(Boolean(authUser));
        }
      } catch {
        user = null;
      }

      if (!user || cancelled) {
        setState("flow");
        setStep(3);
        setAuthModalOpen(true);
        return;
      }

      await handleGenerate(pending.input, {
        theme: pending.theme,
        question: pending.question,
      });

      if (!cancelled) {
        clearPendingPayload();
        clearResumeQueryParam();
      }
    };

    void run();
    return () => {
      cancelled = true;
    };
  }, [clearResumeQueryParam, handleGenerate, searchParams]);

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      const supabase = tryCreateClient();
      try {
        if (!supabase) {
          if (!cancelled) {
            setIsAuthenticated(false);
            setCredits(null);
            setFreeQuestionsRemaining(null);
          }
          return;
        }
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (cancelled) return;
        setIsAuthenticated(Boolean(user));
        if (!user) {
          setCredits(null);
          setFreeQuestionsRemaining(null);
          return;
        }

        const response = await fetch("/api/dashboard/me", { credentials: "include" });
        if (!response.ok) return;
        const payload = (await response.json()) as {
          credits?: number;
          freeQuestionsRemaining?: number;
          birthDate?: string | null;
          birthTime?: string | null;
          birthLocation?: string | null;
          birthTimezone?: string | null;
          birthLat?: number | null;
          birthLng?: number | null;
        };
        if (cancelled) return;
        if (typeof payload.credits === "number") {
          setCredits(payload.credits);
        }
        if (typeof payload.freeQuestionsRemaining === "number") {
          setFreeQuestionsRemaining(payload.freeQuestionsRemaining);
        }
        setUserDataFormState((previous) => {
          if (previous.date || previous.birthLocation) return previous;
          return {
            ...previous,
            date: payload.birthDate ?? "",
            time: (payload.birthTime ?? "").slice(0, 5),
            placeQuery: payload.birthLocation ?? "",
            birthLocation: payload.birthLocation ?? "",
            birthTimezone: payload.birthTimezone ?? null,
            birthLat: payload.birthLat ?? null,
            birthLng: payload.birthLng ?? null,
          };
        });
      } catch {
        if (!cancelled) setIsAuthenticated(false);
      }
    };

    void run();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      if (!selectedTheme) {
        setThemeQuestions([]);
        setThemeQuestionsError(null);
        setThemeQuestionsLoading(false);
        setDynamicQuestions([]);
        setDynamicQuestionsLoading(false);
        setDynamicQuestionsError(null);
        return;
      }

      setThemeQuestionsLoading(true);
      setDynamicQuestionsLoading(true);

      try {
        const category = themeToCategory(selectedTheme);
        const [promptResponse, dynamicResponse] = await Promise.all([
          fetch(`/api/calculator/questions?category=${encodeURIComponent(category)}&kind=prompt`, { credentials: "include" }),
          fetch(`/api/calculator/questions?category=${encodeURIComponent(category)}&kind=dynamic`, { credentials: "include" }),
        ]);

        const promptPayload = (await promptResponse.json()) as { items?: CalculatorQuestion[]; error?: string };
        const dynamicPayload = (await dynamicResponse.json()) as { items?: CalculatorQuestion[]; error?: string };

        if (!promptResponse.ok) {
          throw new Error(promptPayload.error ?? "Falha ao carregar perguntas do tema.");
        }
        if (!dynamicResponse.ok) {
          throw new Error(dynamicPayload.error ?? "Falha ao carregar perguntas dinâmicas.");
        }

        if (!cancelled) {
          const nextThemeQuestions = (promptPayload.items ?? []).map((item) => item.label);
          setThemeQuestions(nextThemeQuestions);
          setThemeQuestionsError(null);
          setDynamicQuestions(dynamicPayload.items ?? []);
          setDynamicQuestionsError(null);
          setSelectedQuestion((current) => (current && nextThemeQuestions.includes(current) ? current : null));
        }
      } catch {
        if (!cancelled) {
          setThemeQuestions([]);
          setThemeQuestionsError("Não foi possível carregar as perguntas deste tema agora.");
          setDynamicQuestions([]);
          setDynamicQuestionsError("Não foi possível carregar perguntas extras agora.");
        }
      } finally {
        if (!cancelled) {
          setThemeQuestionsLoading(false);
          setDynamicQuestionsLoading(false);
        }
      }
    };

    void run();
    return () => {
      cancelled = true;
    };
  }, [selectedTheme]);

  function reset() {
    setState("flow");
    setStep(1);
    setSelectedTheme(null);
    setSelectedQuestion(null);
    setThemeQuestions([]);
    setThemeQuestionsError(null);
    setThemeQuestionsLoading(false);
    setSubmitError(null);
    setSubmitErrorCode(null);
    setResult(EMPTY_RESULT);
    setUserDataFormState(INITIAL_USER_DATA_FORM_STATE);
  }

  function handleStepNavigation(targetStep: CalcStep) {
    if (state !== "flow") return;
    if (targetStep >= step) return;
    setStep(targetStep);
  }

  function cancelLoading() {
    setState("flow");
    setStep(3);
  }

  return {
    state,
    step,
    setStep,
    selectedTheme,
    setSelectedTheme,
    selectedQuestion,
    setSelectedQuestion,
    themeQuestions,
    themeQuestionsLoading,
    themeQuestionsError,
    result,
    submitError,
    submitErrorCode,
    authModalOpen,
    setAuthModalOpen,
    authNextPath,
    dynamicQuestions,
    dynamicQuestionsLoading,
    dynamicQuestionsError,
    userDataFormState,
    setUserDataFormState,
    isAuthenticated,
    credits,
    freeQuestionsRemaining,
    handleGenerate,
    reset,
    handleStepNavigation,
    cancelLoading,
  };
}
