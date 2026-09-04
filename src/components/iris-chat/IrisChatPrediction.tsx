"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { LogIn, Sparkles } from "lucide-react";

import { SignupGateModal } from "@/components/auth/SignupGateModal";
import { BirthFormBubble, type BirthFormHandle } from "@/components/iris-chat/BirthFormBubble";
import { BreathingOrb } from "@/components/iris-chat/BreathingOrb";
import { ChatBubble } from "@/components/iris-chat/ChatBubble";
import { ChatConfirmRow } from "@/components/iris-chat/ChatConfirmRow";
import { ChatLoadingStep } from "@/components/iris-chat/ChatLoadingStep";
import { ChatResultStep } from "@/components/iris-chat/ChatResultStep";
import { ChatThemePicker } from "@/components/iris-chat/ChatThemePicker";
import { ChatTips } from "@/components/iris-chat/ChatTips";
import { LateralFadeText } from "@/components/iris-chat/LateralFadeText";
import { QuestionsLoopCarousel } from "@/components/iris-chat/QuestionsLoopCarousel";
import { ThemeCardsCarousel } from "@/components/iris-chat/ThemeCardsCarousel";
import { THEMES } from "@/lib/calculator-data";
import { useCalculatorPrediction, type CalculatorContext } from "@/hooks/useCalculatorPrediction";
import type { ThemeId } from "@/types/calculator";

interface IrisChatPredictionProps {
  context: CalculatorContext;
}

export function IrisChatPrediction({ context }: IrisChatPredictionProps) {
  const router = useRouter();
  const birthRef = useRef<BirthFormHandle>(null);
  const flow = useCalculatorPrediction(context);
  const [showGreeting, setShowGreeting] = useState(context === "public");
  const [showBreathing, setShowBreathing] = useState(false);
  const [breathingDone, setBreathingDone] = useState(context === "app");

  const themeLabel = THEMES.find((theme) => theme.id === flow.selectedTheme)?.name ?? "";
  const questionItems = flow.themeQuestions.map((title) => ({ id: title, title }));
  const showIntro = context === "public" && (showGreeting || (showBreathing && !breathingDone));
  const freeRemaining = flow.freeQuestionsRemaining ?? flow.result.remainingFreeQuestions;
  const creditsDisplay =
    freeRemaining !== null && freeRemaining > 0
      ? freeRemaining
      : (flow.credits ?? flow.result.remainingCredits ?? freeRemaining);
  const creditsLabel =
    freeRemaining !== null && freeRemaining > 0 ? "perguntas grátis" : "créditos";

  const goBack = () => {
    if (flow.state === "result") {
      flow.reset();
      return;
    }
    if (flow.step === 1) {
      router.back();
      return;
    }
    flow.handleStepNavigation((flow.step - 1) as 1 | 2);
  };

  const confirmTheme = () => {
    if (!flow.selectedTheme) return;
    flow.setStep(2);
  };

  const confirmQuestion = () => {
    if (!flow.selectedQuestion) return;
    flow.setStep(3);
  };

  return (
    <div className="flex h-full min-h-0 flex-col bg-transparent font-sans text-foreground">
      <header className="flex shrink-0 items-center justify-between gap-4 border-b border-border px-4 py-3">
        <div>
          <p className="font-ubuntu text-[10px] tracking-[0.22em] text-iris uppercase">Previsão</p>
          <h1 className="font-jakarta text-lg font-black tracking-tight text-foreground sm:text-xl">Sua pergunta com data</h1>
        </div>
        <div className="flex items-center gap-3">
          <ChatThemePicker />
          <div className="text-right leading-none">
            <span className="block font-jakarta text-lg font-black text-iris">{creditsDisplay ?? "—"}</span>
            <span className="text-[10px] tracking-[0.14em] text-muted-foreground uppercase">{creditsLabel}</span>
          </div>
        </div>
      </header>

      <main className="min-h-0 flex-1 overflow-y-auto">
        <div className="mx-auto max-w-2xl space-y-12 px-4 py-6">
          <AnimatePresence>
            {showGreeting ? (
              <motion.div
                key="greeting"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 1.6, ease: [0.22, 1, 0.36, 1] }}
              >
                <ChatBubble from="iris" className="max-w-full border-none bg-transparent py-8 shadow-none sm:max-w-full sm:py-10">
                  <p className="font-jakarta text-[18px] leading-[1.5] font-black tracking-[0.01em] sm:text-[22px] md:text-[24px]">
                    <LateralFadeText
                      text="Enquanto pensa em sua pergunta, que tal respirar mais profundo?"
                      step={170}
                      onComplete={() => {
                        window.setTimeout(() => {
                          setShowGreeting(false);
                          window.setTimeout(() => setShowBreathing(true), 1700);
                        }, 1200);
                      }}
                    />
                  </p>
                </ChatBubble>
              </motion.div>
            ) : null}
          </AnimatePresence>

          <AnimatePresence mode="wait">
            {showBreathing && !breathingDone ? (
              <motion.div
                key="breathing"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                className="flex flex-col items-center gap-4 pt-2 pb-6"
              >
                <BreathingOrb cycles={1} onComplete={() => window.setTimeout(() => setBreathingDone(true), 600)} />
                <button
                  type="button"
                  onClick={() => setBreathingDone(true)}
                  className="text-xs text-muted-foreground transition-colors hover:text-foreground"
                >
                  Pular
                </button>
              </motion.div>
            ) : null}

            {!showIntro && flow.state === "flow" && flow.step === 1 ? (
              <motion.div
                key="step-theme"
                initial={{ opacity: 0, y: 0 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
              >
                <ChatBubble from="iris" className="relative w-full max-w-full rounded-3xl bg-iris-blue-mist py-10 sm:max-w-full sm:py-14">
                  <motion.div
                    initial={{ opacity: 0, scale: 0.6 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.8, delay: 0.4, ease: [0.22, 1, 0.36, 1] }}
                    className="pointer-events-none absolute -top-3 -right-3 z-20 h-20 w-20 sm:-top-4 sm:-right-4 sm:h-24 sm:w-24"
                  >
                    <div
                      className="absolute inset-0 animate-spin rounded-full bg-neon-blue text-primary-foreground shadow-[0_8px_24px_-6px_hsl(var(--neon-blue)/0.35)]"
                      style={{ animationDuration: "18s" }}
                    >
                      <svg viewBox="0 0 100 100" className="absolute inset-0 h-full w-full">
                        <defs>
                          <path id="seloCircle" d="M 50,50 m -36,0 a 36,36 0 1,1 72,0 a 36,36 0 1,1 -72,0" />
                        </defs>
                        <text
                          className="fill-current font-jakarta font-black uppercase"
                          style={{ fontSize: "11.5px", letterSpacing: "0.18em" }}
                        >
                          <textPath href="#seloCircle" startOffset="0">
                            3 perguntas grátis · 3 perguntas grátis ·
                          </textPath>
                        </text>
                      </svg>
                    </div>
                    <div className="absolute inset-3 flex items-center justify-center rounded-full bg-primary-foreground/15">
                      <Sparkles className="size-5 text-primary-foreground" fill="currentColor" strokeWidth={1} />
                    </div>
                  </motion.div>

                  <div className="mb-4">
                    <ChatTips />
                  </div>
                  <p className="text-[10px] font-semibold tracking-[0.22em] text-iris uppercase">01 · Tema</p>
                  <h2 className="mt-2 mb-8 font-jakarta text-[22px] leading-[1.35] font-black tracking-[0.01em] text-iris-blue-graphite uppercase sm:text-[28px] md:text-[32px]">
                    Escolha o tema
                  </h2>
                  <div className="relative -mx-4 sm:-mx-8">
                    <ThemeCardsCarousel
                      selected={flow.selectedTheme}
                      onSelect={(theme: ThemeId) => {
                        if (flow.selectedTheme && flow.selectedTheme !== theme) {
                          flow.setSelectedQuestion(null);
                        }
                        flow.setSelectedTheme(theme);
                      }}
                    />
                  </div>
                </ChatBubble>
              </motion.div>
            ) : null}

            {!showIntro && flow.state === "flow" && flow.step === 2 && flow.selectedTheme ? (
              <motion.div
                key="step-question"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
              >
                <ChatBubble from="iris" className="w-full max-w-full bg-iris-blue-mist py-10 sm:max-w-full">
                  <p className="text-[10px] font-semibold tracking-[0.22em] text-iris uppercase">02 · Pergunta</p>
                  <h2 className="mt-2 mb-6 font-jakarta text-[22px] leading-[1.35] font-black tracking-[0.01em] text-iris-blue-graphite uppercase sm:text-[28px] md:text-[32px]">
                    Escolha sua pergunta
                  </h2>
                  <p className="mb-4 text-sm text-muted-foreground">Sobre {themeLabel.toLowerCase()}</p>
                  {flow.themeQuestionsLoading ? (
                    <div className="h-40 animate-pulse rounded-2xl border border-border bg-muted/40" />
                  ) : null}
                  {flow.themeQuestionsError ? <p className="text-xs text-destructive">{flow.themeQuestionsError}</p> : null}
                  {!flow.themeQuestionsLoading && !flow.themeQuestionsError ? (
                    <QuestionsLoopCarousel
                      items={questionItems}
                      selectedId={flow.selectedQuestion}
                      onSelect={(id) => flow.setSelectedQuestion(id)}
                    />
                  ) : null}
                </ChatBubble>
              </motion.div>
            ) : null}

            {!showIntro && flow.state === "flow" && flow.step === 3 && flow.selectedQuestion ? (
              <motion.div
                key="step-birth"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
              >
                <ChatBubble from="iris" className="w-full max-w-full bg-iris-blue-mist py-10 sm:max-w-full">
                  <BirthFormBubble
                    ref={birthRef}
                    formState={flow.userDataFormState}
                    onFormStateChange={flow.setUserDataFormState}
                    onGenerate={flow.handleGenerate}
                    submitError={flow.submitError}
                    submitErrorCode={flow.submitErrorCode}
                    hasSelfSaved={Boolean(flow.userDataFormState.date)}
                  />
                </ChatBubble>
              </motion.div>
            ) : null}

            {flow.state === "loading" ? (
              <motion.div
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
              >
                <ChatLoadingStep onCancel={flow.cancelLoading} />
              </motion.div>
            ) : null}

            {flow.state === "result" && flow.selectedQuestion ? (
              <motion.div
                key="result"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
              >
                <ChatResultStep
                  selectedQuestion={flow.selectedQuestion}
                  result={flow.result}
                  credits={flow.credits}
                  isAuthenticated={flow.isAuthenticated}
                  onReset={flow.reset}
                  onAuthRequired={() => flow.setAuthModalOpen(true)}
                />
              </motion.div>
            ) : null}
          </AnimatePresence>
        </div>
      </main>

      {!showIntro && flow.state === "flow" ? (
        <footer className="shrink-0 border-t border-border/40 bg-mint/80 px-4 py-4 pb-[max(1rem,env(safe-area-inset-bottom))] backdrop-blur-sm">
          <div className="mx-auto max-w-2xl">
            {flow.step === 1 ? (
              <ChatConfirmRow onBack={goBack} onConfirm={confirmTheme} disabled={!flow.selectedTheme} confirmLabel="Escolher tema" />
            ) : null}
            {flow.step === 2 ? (
              <ChatConfirmRow
                onBack={goBack}
                onConfirm={confirmQuestion}
                disabled={!flow.selectedQuestion || flow.themeQuestionsLoading || Boolean(flow.themeQuestionsError)}
                confirmLabel="Continuar"
              />
            ) : null}
            {flow.step === 3 ? (
              <ChatConfirmRow
                onBack={goBack}
                onConfirm={() => void birthRef.current?.submit()}
                disabled={!flow.userDataFormState.date}
                confirmLabel="Gerar minha previsão"
              />
            ) : null}
          </div>
        </footer>
      ) : null}

      <AnimatePresence>
        {!flow.isAuthenticated && flow.submitErrorCode === "FREE_LIMIT_REACHED" && !flow.authModalOpen ? (
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 24 }}
            className="pointer-events-none fixed bottom-5 left-1/2 z-40 w-[min(92vw,420px)] -translate-x-1/2"
          >
            <div className="pointer-events-auto flex items-center gap-3 rounded-2xl border border-border bg-primary px-4 py-3.5 text-primary-foreground">
              <div className="flex-1">
                <p className="font-jakarta text-[13px] leading-[1.35] font-black">Suas perguntas grátis acabaram</p>
                <p className="mt-0.5 text-[11px] leading-[1.45] opacity-80">Faça login para continuar com o Data Iris.</p>
              </div>
              <button
                type="button"
                onClick={() => flow.setAuthModalOpen(true)}
                className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-background px-4 py-2.5 text-[13px] font-semibold text-foreground"
              >
                <LogIn className="size-3.5" /> Entrar
              </button>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>

      <SignupGateModal
        open={flow.authModalOpen}
        onOpenChange={flow.setAuthModalOpen}
        nextPath={flow.authNextPath}
        onSuccess={() => {
          const pending = sessionStorage.getItem("pending_prediction_payload");
          if (pending) {
            const params = new URLSearchParams(window.location.search);
            params.set("resumePrediction", "1");
            router.replace(`${window.location.pathname}?${params.toString()}`);
            router.refresh();
          }
        }}
      />
    </div>
  );
}
