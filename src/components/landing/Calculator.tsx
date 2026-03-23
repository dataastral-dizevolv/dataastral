"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useSWRConfig } from "swr";

import { StepQuestion } from "@/components/calculator/StepQuestion";
import { StepLoading } from "@/components/calculator/StepLoading";
import { StepResult } from "@/components/calculator/StepResult";
import { Stepper } from "@/components/calculator/Stepper";
import { StepTheme } from "@/components/calculator/StepTheme";
import { StepUserData } from "@/components/calculator/StepUserData";
import { DASHBOARD_ME_KEY } from "@/components/dashboard/DashboardUserContext";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { createClient } from "@/lib/supabase/client";
import type { CalcState, CalcStep, GeneratePredictionInput, PredictErrorResponse, PredictSuccessResponse, ThemeId } from "@/types/calculator";

const PENDING_PREDICTION_STORAGE_KEY = "pending_prediction_payload";

interface PendingPredictionPayload {
  theme: ThemeId;
  question: string;
  input: GeneratePredictionInput;
}

interface CalculatorProps {
  context?: "landing" | "app";
}

export default function Calculator({ context = "landing" }: CalculatorProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { mutate } = useSWRConfig();
  const [state, setState] = useState<CalcState>("flow");
  const [step, setStep] = useState<CalcStep>(1);
  const [selectedTheme, setSelectedTheme] = useState<ThemeId | null>(null);
  const [selectedQuestion, setSelectedQuestion] = useState<string | null>(null);
  const [resultPrediction, setResultPrediction] = useState<string | null>(null);
  const [resultEventDate, setResultEventDate] = useState<string | null>(null);
  const [remainingCredits, setRemainingCredits] = useState<number | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitErrorCode, setSubmitErrorCode] = useState<string | null>(null);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authNextPath, setAuthNextPath] = useState("/calculadora?resumePrediction=1#calculadora");
  const isInApp = context === "app";

  function buildAuthNextPath() {
    return "/calculadora?resumePrediction=1#calculadora";
  }

  function storePendingPayload(payload: PendingPredictionPayload) {
    sessionStorage.setItem(PENDING_PREDICTION_STORAGE_KEY, JSON.stringify(payload));
  }

  function readPendingPayload() {
    const raw = sessionStorage.getItem(PENDING_PREDICTION_STORAGE_KEY);

    if (!raw) {
      return null;
    }

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

  function clearPendingPayload() {
    sessionStorage.removeItem(PENDING_PREDICTION_STORAGE_KEY);
  }

  const clearResumeQueryParam = useCallback(() => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("resumePrediction");
    const query = params.toString();
    const target = query.length > 0 ? `${pathname}?${query}#calculadora` : `${pathname}#calculadora`;
    router.replace(target, { scroll: false });
  }, [pathname, router, searchParams]);

  const handleGenerate = useCallback(async (
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

    const supabase = createClient();
    let user: { id: string } | null = null;

    try {
      const {
        data: { user: authUser },
      } = await supabase.auth.getUser();
      user = authUser;
    } catch (error) {
      console.warn("[calculator] Unable to read auth session before generate", {
        message: error instanceof Error ? error.message : String(error),
      });
      user = null;
    }

    if (!user) {
      const nextPath = buildAuthNextPath();
      setAuthNextPath(nextPath);
      storePendingPayload({
        theme: themeToUse,
        question: questionToUse,
        input,
      });
      setAuthModalOpen(true);
      return;
    }

    if (pathname === "/") {
      storePendingPayload({
        theme: themeToUse,
        question: questionToUse,
        input,
      });
      router.push("/calculadora?resumePrediction=1#calculadora");
      return;
    }

    setSelectedTheme(themeToUse);
    setSelectedQuestion(questionToUse);
    setState("loading");

    try {
      const response = await fetch("/api/predict", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          theme: themeToUse,
          question: questionToUse,
          birthDate: input.date,
          birthTime: input.time,
          birthLocation: input.birthLocation,
          birthTimezone: input.birthTimezone,
          birthLat: input.birthLat,
          birthLng: input.birthLng,
          placeQuery: input.placeQuery,
        }),
      });

      const payload = (await response.json()) as PredictSuccessResponse | PredictErrorResponse;

      if (!response.ok) {
        const errorPayload = payload as PredictErrorResponse;

        if (response.status === 401 || errorPayload.code === "AUTH_REQUIRED") {
          const nextPath = buildAuthNextPath();
          setAuthNextPath(nextPath);
          storePendingPayload({
            theme: themeToUse,
            question: questionToUse,
            input,
          });
          setAuthModalOpen(true);
          setState("flow");
          setStep(3);
          return;
        }

        setSubmitError(errorPayload.error || "Não foi possível gerar sua previsão agora. Tente novamente em instantes.");
        setSubmitErrorCode(errorPayload.code ?? null);
        setState("flow");
        setStep(3);
        return;
      }

      const successPayload = payload as PredictSuccessResponse;
      setResultPrediction(successPayload.prediction);
      setResultEventDate(successPayload.eventDate ?? null);
      setRemainingCredits(successPayload.remainingCredits);

      await Promise.all([
        mutate(DASHBOARD_ME_KEY),
        mutate((key) => typeof key === "string" && key.startsWith("/api/credits/transactions")),
        mutate((key) => typeof key === "string" && key.startsWith("/api/predictions/history")),
      ]);

      setState("result");
    } catch {
      setSubmitError("Falha de conexão ao gerar a previsão.");
      setSubmitErrorCode(null);
      setState("flow");
      setStep(3);
    }
  }, [mutate, pathname, router, selectedQuestion, selectedTheme]);

  useEffect(() => {
    const shouldResume = searchParams.get("resumePrediction") === "1";

    if (!shouldResume) {
      return;
    }

    let cancelled = false;

    const run = async () => {
      const pending = readPendingPayload();

      if (!pending) {
        console.info("[calculator] Resume requested but pending payload not found.");
        clearResumeQueryParam();
        return;
      }

      setSelectedTheme(pending.theme);
      setSelectedQuestion(pending.question);
      setStep(3);
      setSubmitError(null);
      setSubmitErrorCode(null);
      setState("loading");

      const supabase = createClient();
      let user: { id: string } | null = null;

      try {
        const {
          data: { user: authUser },
        } = await supabase.auth.getUser();
        user = authUser;
      } catch (error) {
        console.warn("[calculator] Unable to read auth session during resume", {
          message: error instanceof Error ? error.message : String(error),
        });
      }

      if (!user || cancelled) {
        if (!user) {
          console.info("[calculator] Resume skipped because user is not authenticated yet.");
        }
        setState("flow");
        setStep(3);
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

  function reset() {
    setState("flow");
    setStep(1);
    setSelectedTheme(null);
    setSelectedQuestion(null);
    setSubmitError(null);
    setSubmitErrorCode(null);
    setResultPrediction(null);
    setResultEventDate(null);
    setRemainingCredits(null);
  }

  return (
    <section id="calculadora" className="bg-background py-24 lg:py-32">
      <div className="mx-auto max-w-[1280px] px-6 lg:px-16">
        <div className="mb-12 text-center">
          <p className="eyebrow mb-3">{isInApp ? "CALCULADORA ASTRAL" : "EXPERIMENTE GRATUITAMENTE"}</p>
          <h2 className="mb-3 font-display text-3xl text-foreground lg:text-4xl">Descubra o que os astros dizem</h2>
          <p className="mx-auto max-w-md font-body text-iris-secondary">Escolha um tema, faça uma pergunta e receba sua previsão baseada em efemérides reais.</p>
        </div>
        <div className="mx-auto max-w-[680px]">
          <Card className="rounded-2xl border-iris bg-card p-0 shadow-iris-card">
            <CardContent className="p-6 sm:p-8 lg:p-10">
              <Stepper currentStep={step} state={state} />
              <AnimatePresence mode="wait">
                {state === "flow" ? (
                  <motion.div key={`step-${step}`} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}>
                    {step === 1 ? <StepTheme selectedTheme={selectedTheme} onSelectTheme={setSelectedTheme} onContinue={() => { setStep(2); setSelectedQuestion(null); }} /> : null}
                    {step === 2 && selectedTheme ? <StepQuestion selectedTheme={selectedTheme} selectedQuestion={selectedQuestion} onBack={() => setStep(1)} onSelectQuestion={setSelectedQuestion} onContinue={() => setStep(3)} /> : null}
                    {step === 3 && selectedQuestion ? <StepUserData selectedQuestion={selectedQuestion} onBack={() => setStep(2)} onGenerate={handleGenerate} submitError={submitError} submitErrorCode={submitErrorCode} /> : null}
                  </motion.div>
                ) : null}

                {state === "loading" ? (
                  <StepLoading />
                ) : null}

                {state === "result" && selectedQuestion ? (
                  <motion.div key="result" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                    <StepResult
                      selectedQuestion={selectedQuestion}
                      prediction={resultPrediction ?? ""}
                      eventDate={resultEventDate ?? undefined}
                      remainingCredits={remainingCredits}
                      onReset={reset}
                    />
                  </motion.div>
                ) : null}
              </AnimatePresence>
            </CardContent>
          </Card>
        </div>
      </div>

      <Dialog open={authModalOpen} onOpenChange={setAuthModalOpen}>
        <DialogContent className="max-w-md rounded-2xl border border-iris bg-card p-6">
          <DialogHeader>
            <DialogTitle className="font-display text-xl text-foreground">Entre para gerar sua previsão</DialogTitle>
            <DialogDescription className="text-sm text-iris-secondary">
              Seus dados foram mantidos. Entre ou crie sua conta para continuar a geração com 3 créditos grátis.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-3 sm:grid-cols-2">
            <Link
              href={`/login?next=${encodeURIComponent(authNextPath)}`}
              className="inline-flex h-10 items-center justify-center rounded-xl border border-iris px-4 font-body text-xs uppercase tracking-wider text-foreground transition-colors hover:bg-muted"
            >
              Fazer login
            </Link>
            <Link
              href={`/cadastro?next=${encodeURIComponent(authNextPath)}`}
              className="inline-flex h-10 items-center justify-center rounded-xl bg-foreground px-4 font-body text-xs uppercase tracking-wider text-background transition-opacity hover:opacity-90"
            >
              Criar conta
            </Link>
          </div>
        </DialogContent>
      </Dialog>
    </section>
  );
}
