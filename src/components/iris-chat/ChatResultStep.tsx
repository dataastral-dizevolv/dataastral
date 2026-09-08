"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowRight,
  BarChart3,
  Calendar as CalendarIcon,
  MessageCircle,
  RotateCcw,
  Share2,
  Sparkles,
  Star,
  Volume2,
  X,
} from "lucide-react";
import { toast } from "sonner";

import { AnswerCalendarPanel } from "@/components/iris-chat/AnswerCalendarPanel";
import { ChatBubble } from "@/components/iris-chat/ChatBubble";
import { IrisCalendarIcon } from "@/components/iris-chat/IrisCalendarIcon";
import { PredictionBentoGrid } from "@/components/iris-chat/PredictionBentoGrid";
import { WhatsAppVerifyFlow } from "@/components/iris-chat/WhatsAppVerifyFlow";
import type { PredictionResult } from "@/hooks/useCalculatorPrediction";
import { Button } from "@/components/ui/button";
import { USER_MESSAGES, toUserFacingMessage } from "@/lib/errors/user-facing";
import { cn } from "@/lib/utils";

interface ChatResultStepProps {
  selectedQuestion: string;
  result: PredictionResult;
  credits: number | null;
  isAuthenticated: boolean;
  onReset: () => void;
  onAuthRequired: () => void;
}

const NO_ASPECT_CODES = new Set(["NO_RELEVANT_ASPECT_FOUND", "THEME_IN_CALIBRATION"]);

const SPARKLE_POSITIONS = [
  { top: "8%", left: "6%", size: 14, delay: 0.4 },
  { top: "18%", left: "92%", size: 10, delay: 0.7 },
  { top: "52%", left: "-2%", size: 12, delay: 1.0 },
  { top: "70%", left: "96%", size: 14, delay: 1.3 },
  { top: "88%", left: "20%", size: 10, delay: 1.6 },
  { top: "30%", left: "50%", size: 8, delay: 1.9 },
];

function ActionPill({
  icon,
  children,
  onClick,
  disabled,
  variant = "default",
}: {
  icon: ReactNode;
  children: ReactNode;
  onClick: () => void;
  disabled?: boolean;
  variant?: "default" | "glow";
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "flex items-center gap-2 rounded-full font-jakarta font-black tracking-[0.01em] transition-all disabled:opacity-50",
        variant === "glow"
          ? "border-2 border-emerald-400/80 bg-background px-4 py-2.5 text-sm text-foreground shadow-[0_0_20px_-2px_hsl(150_80%_55%/0.55),inset_0_0_12px_-4px_hsl(150_80%_60%/0.35)] hover:-translate-y-0.5 hover:shadow-[0_0_28px_-2px_hsl(150_80%_55%/0.75)]"
          : "border border-border bg-background px-3 py-2 text-xs text-foreground hover:opacity-80",
      )}
    >
      {icon}
      {children}
    </button>
  );
}

export function ChatResultStep({
  selectedQuestion,
  result,
  credits,
  isAuthenticated,
  onReset,
  onAuthRequired,
}: ChatResultStepProps) {
  const [showWhats, setShowWhats] = useState(false);
  const [listening, setListening] = useState(false);
  const [showDetalhes, setShowDetalhes] = useState(false);

  const iso = result.eventDateIso;
  const displayDate =
    result.eventDate ??
    (iso
      ? new Date(`${iso}T00:00:00`).toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" })
      : "Data a confirmar");
  const ansDate = iso ? new Date(`${iso}T00:00:00`) : null;
  const weekday = ansDate ? ansDate.toLocaleDateString("pt-BR", { weekday: "long" }).split("-")[0] : "data";
  const monthShort = ansDate ? ansDate.toLocaleDateString("pt-BR", { month: "short" }).replace(".", "") : "";
  const day = ansDate ? String(ansDate.getDate()).padStart(2, "0") : "--";

  const paragraphs = result.prediction
    .split(/\n\s*\n/g)
    .map((paragraph) => paragraph.trim())
    .filter((paragraph) => paragraph.length > 0);

  const noAspectFound =
    (result.engineCode ? NO_ASPECT_CODES.has(result.engineCode) : false) ||
    result.prediction.toLowerCase().includes("nenhum aspecto encontrado");

  const remainingLabel =
    result.remainingFreeQuestions !== null && result.remainingFreeQuestions > 0
      ? `Perguntas grátis restantes: ${result.remainingFreeQuestions}`
      : result.remainingCredits !== null
        ? `Créditos restantes: ${result.remainingCredits}`
        : result.remainingFreeQuestions !== null
          ? `Leituras grátis restantes: ${result.remainingFreeQuestions}`
          : credits !== null
            ? `Créditos restantes: ${credits}`
            : null;

  async function handleShare() {
    const text = `Data Iris · ${displayDate}\n\n${result.prediction}`;
    try {
      if (navigator.share) {
        await navigator.share({ title: "Data Iris", text });
        return;
      }
      await navigator.clipboard.writeText(text);
      toast.success("Previsão copiada.");
    } catch {
      toast.error("Não foi possível compartilhar agora.");
    }
  }

  async function handleListen() {
    if (!isAuthenticated) {
      onAuthRequired();
      return;
    }
    setListening(true);
    try {
      const response = await fetch("/api/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          predictionId: result.predictionId,
          audio_text: result.audioText ?? result.prediction,
          text: result.prediction,
          eventId: "previsao",
          eventDate: iso ?? undefined,
        }),
      });
      const payload = (await response.json()) as { error?: string; code?: string; audioUrl?: string };
      if (response.status === 401 || payload.code === "AUTH_REQUIRED") {
        onAuthRequired();
        return;
      }
      if (!response.ok || !payload.audioUrl) {
        toast.error(toUserFacingMessage(payload, USER_MESSAGES.listenFailed));
        return;
      }
      const audio = new Audio(payload.audioUrl);
      await audio.play();
    } catch {
      toast.error(USER_MESSAGES.listenFailed);
    } finally {
      setListening(false);
    }
  }

  return (
    <div className="space-y-4">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
        className="relative"
      >
        {SPARKLE_POSITIONS.map((sparkle, index) => (
          <motion.div
            key={index}
            aria-hidden
            className="pointer-events-none absolute z-10 text-chat-vibrant"
            style={{ top: sparkle.top, left: sparkle.left }}
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: [0, 1, 0.6, 1, 0], scale: [0, 1.2, 0.8, 1, 0] }}
            transition={{ duration: 2.4, delay: sparkle.delay, repeat: Infinity, repeatDelay: 3, ease: "easeOut" }}
          >
            <Sparkles
              className="drop-shadow-[0_0_8px_hsl(45_100%_60%/0.7)]"
              style={{ width: sparkle.size, height: sparkle.size }}
              fill="currentColor"
              strokeWidth={1}
            />
          </motion.div>
        ))}

        <ChatBubble from="iris" className="border-deep-navy bg-deep-navy text-primary-foreground">
          <div className="space-y-6 py-1">
            <p className="text-[10px] font-semibold tracking-[0.22em] uppercase opacity-80">Sua previsão</p>
            <p className="text-sm italic opacity-80">{selectedQuestion}</p>

            <div className="flex items-start gap-5">
              <IrisCalendarIcon day={day} topLabel={weekday} monthLabel={monthShort} size="md" />
              <div className="min-w-0 flex-1">
                <p className="font-jakarta text-[18px] leading-[1.45] font-black tracking-[0.005em] sm:text-[22px] md:text-[24px]">
                  {displayDate}
                </p>
                <p className="mt-2 text-[12px] leading-[1.5] tracking-[0.16em] uppercase opacity-70">
                  Janela astrológica recomendada
                </p>
              </div>
            </div>

            {iso ? <AnswerCalendarPanel selectedISO={iso} /> : null}

            <div className="rounded-2xl bg-primary-foreground/10 p-5">
              <p className="mb-3 text-[10px] font-semibold tracking-[0.22em] uppercase opacity-70">
                Conselho do Data Iris
              </p>
              <div className="space-y-3">
                {paragraphs.map((paragraph) => (
                  <p
                    key={paragraph.slice(0, 24)}
                    className="font-jakarta text-[16px] leading-[1.6] font-extrabold sm:text-[18px] md:text-[20px]"
                  >
                    {paragraph}
                  </p>
                ))}
              </div>
              {noAspectFound ? (
                <p className="mt-3 text-sm opacity-80">
                  {result.engineCode === "THEME_IN_CALIBRATION"
                    ? "Este tema ainda está em calibração no Motor Iris. Nenhum crédito foi cobrado."
                    : "Não encontramos aspectos relevantes no período de busca para esta pergunta."}
                </p>
              ) : null}
            </div>

            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => setShowDetalhes((value) => !value)}
                className="inline-flex items-center gap-1.5 rounded-full bg-primary-foreground px-3 py-1.5 text-[11px] font-black tracking-[0.16em] text-deep-navy uppercase transition-opacity hover:opacity-90"
              >
                <BarChart3 className="size-3.5" />
                {showDetalhes ? "Ocultar detalhes" : "Detalhes"}
              </button>
            </div>
          </div>
        </ChatBubble>
      </motion.div>

      <AnimatePresence initial={false}>
        {showDetalhes ? (
          <motion.div
            key="bento"
            initial={{ opacity: 0, y: 12, height: 0 }}
            animate={{ opacity: 1, y: 0, height: "auto" }}
            exit={{ opacity: 0, y: -8, height: 0 }}
            transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
            className="relative overflow-hidden"
          >
            <button
              type="button"
              onClick={() => setShowDetalhes(false)}
              aria-label="Fechar detalhes"
              className="absolute top-2 right-2 z-10 flex size-7 items-center justify-center rounded-full border border-border bg-background text-foreground/70 shadow-sm transition-colors hover:bg-muted hover:text-foreground"
            >
              <X className="size-3.5" />
            </button>
            <PredictionBentoGrid
              seed={`${selectedQuestion}-${displayDate}`}
              upcomingDates={[
                { date: displayDate, label: "Janela principal da previsão", polarity: "pos" },
                { date: "19 de julho de 2026", label: "Segunda janela favorável", polarity: "pos" },
                { date: "28 de julho de 2026", label: "Atenção a decisões precipitadas", polarity: "neg" },
              ]}
              activityData={[
                { day: "D", value: 6 },
                { day: "S", value: 9 },
                { day: "T", value: 11 },
                { day: "Q", value: 4 },
                { day: "Q", value: 8 },
                { day: "S", value: 13 },
                { day: "S", value: 3 },
              ]}
              activityTotal="42h"
              activityTrend="+12% vs. semana anterior"
            />
          </motion.div>
        ) : null}
      </AnimatePresence>

      {showWhats ? (
        <ChatBubble from="iris" className="w-full max-w-full bg-iris-blue-mist py-8 sm:max-w-full sm:py-10">
          <WhatsAppVerifyFlow
            predictionText={result.whatsappText || `Data Iris · sua previsão para ${displayDate}:\n\n${result.prediction}`}
            predictionId={result.predictionId}
            onAuthRequired={onAuthRequired}
          />
        </ChatBubble>
      ) : null}

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.6 }}
        className="flex flex-wrap gap-2.5 pl-2"
      >
        <ActionPill
          icon={<MessageCircle className="size-3.5" />}
          onClick={() => {
            if (!isAuthenticated) {
              onAuthRequired();
              return;
            }
            setShowWhats((value) => !value);
          }}
        >
          Enviar para o WhatsApp
        </ActionPill>
        <ActionPill
          icon={<Volume2 className="size-4" />}
          onClick={() => void handleListen()}
          disabled={listening}
          variant="glow"
        >
          Escutar
        </ActionPill>
        <ActionPill icon={<Share2 className="size-4" />} onClick={() => void handleShare()} variant="glow">
          Compartilhar
        </ActionPill>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.9 }}
        className="space-y-3 pt-2"
      >
        <p className="pl-2 text-[10px] font-bold tracking-[0.22em] text-muted-foreground uppercase">Outros serviços</p>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {[
            { icon: Star, label: "Mapa astral", href: "/perfil" },
            { icon: CalendarIcon, label: "Planner", href: "/calendario" },
            { icon: MessageCircle, label: "Dashboard", href: "/dashboard" },
          ].map(({ icon: Icon, label, href }) => (
            <Link
              key={label}
              href={href}
              className="group flex items-center gap-3 rounded-2xl border border-border bg-background px-5 py-4 transition-all hover:border-foreground/40 hover:bg-muted/50"
            >
              <div className="flex size-9 items-center justify-center rounded-full bg-muted text-foreground/70 transition-colors group-hover:text-foreground">
                <Icon className="size-4" />
              </div>
              <span className="font-jakarta text-[14px] font-black tracking-[0.005em] text-foreground">{label}</span>
              <ArrowRight className="ml-auto size-4 text-foreground/40 transition-all group-hover:translate-x-0.5 group-hover:text-foreground" />
            </Link>
          ))}
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 1.1 }}
      >
        <ChatBubble from="iris" className="w-full max-w-full bg-iris-blue-mist sm:max-w-full">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p aria-live="polite" className="font-jakarta text-[18px] leading-[1.45] font-extrabold tracking-[0.01em] text-foreground sm:text-[20px]">
                {remainingLabel ?? "Créditos restantes: —"}
              </p>
            </div>
            <Button type="button" onClick={onReset} className="rounded-full">
              <RotateCcw className="size-3.5" /> Nova pergunta
            </Button>
          </div>
        </ChatBubble>
      </motion.div>
    </div>
  );
}
