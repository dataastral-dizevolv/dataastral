"use client";

import { useState } from "react";
import Link from "next/link";
import { Calendar as CalendarIcon, MessageCircle, RotateCcw, Share2, Star, Volume2 } from "lucide-react";
import { toast } from "sonner";

import { AnswerCalendarPanel } from "@/components/iris-chat/AnswerCalendarPanel";
import { ChatBubble } from "@/components/iris-chat/ChatBubble";
import { IrisCalendarIcon } from "@/components/iris-chat/IrisCalendarIcon";
import { WhatsAppVerifyFlow } from "@/components/iris-chat/WhatsAppVerifyFlow";
import type { PredictionResult } from "@/hooks/useCalculatorPrediction";
import { Button } from "@/components/ui/button";

interface ChatResultStepProps {
  selectedQuestion: string;
  result: PredictionResult;
  credits: number | null;
  isAuthenticated: boolean;
  onReset: () => void;
  onAuthRequired: () => void;
}

const NO_ASPECT_CODES = new Set(["NO_RELEVANT_ASPECT_FOUND", "THEME_IN_CALIBRATION"]);

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

  const iso = result.eventDateIso;
  const displayDate = result.eventDate ?? (iso ? new Date(`${iso}T00:00:00`).toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" }) : "Data a confirmar");
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
    result.remainingCredits !== null
      ? `Créditos restantes: ${result.remainingCredits}`
      : result.remainingFreeQuestions !== null
        ? `Leituras grátis restantes: ${result.remainingFreeQuestions}`
        : credits !== null
          ? `Créditos restantes: ${credits}`
          : null;

  async function handleShare() {
    const text = `Data Astral · ${displayDate}\n\n${result.prediction}`;
    try {
      if (navigator.share) {
        await navigator.share({ title: "Data Astral", text });
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
        throw new Error(payload.error || "Narração indisponível no momento.");
      }
      const audio = new Audio(payload.audioUrl);
      await audio.play();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível escutar agora.");
    } finally {
      setListening(false);
    }
  }

  return (
    <div className="space-y-4">
      <ChatBubble from="iris" className="bg-primary text-primary-foreground border-primary">
        <div className="space-y-6 py-1">
          <p className="text-[10px] font-semibold tracking-[0.22em] uppercase opacity-80">Sua previsão</p>
          <p className="text-sm italic opacity-80">{selectedQuestion}</p>

          <div className="flex items-start gap-5">
            <IrisCalendarIcon day={day} topLabel={weekday} monthLabel={monthShort} size="md" />
            <div className="min-w-0 flex-1">
              <p className="font-jakarta text-lg leading-[1.45] font-black tracking-[0.005em] sm:text-[22px]">{displayDate}</p>
              <p className="mt-2 text-[12px] leading-[1.5] tracking-[0.16em] uppercase opacity-70">Janela astrológica recomendada</p>
            </div>
          </div>

          {iso ? <AnswerCalendarPanel selectedISO={iso} /> : null}

          <div className="rounded-2xl bg-background/10 p-5">
            <p className="mb-3 text-[10px] font-semibold tracking-[0.22em] uppercase opacity-70">Conselho do Data Astral</p>
            <div className="space-y-3">
              {paragraphs.map((paragraph) => (
                <p key={paragraph.slice(0, 24)} className="font-jakarta text-base leading-[1.6] font-extrabold sm:text-lg">
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
        </div>
      </ChatBubble>

      {showWhats ? (
        <ChatBubble from="iris" className="w-full max-w-full bg-iris-blue-mist sm:max-w-full">
          <WhatsAppVerifyFlow
            predictionText={result.whatsappText || `Data Astral · sua previsão para ${displayDate}:\n\n${result.prediction}`}
            predictionId={result.predictionId}
            onAuthRequired={onAuthRequired}
          />
        </ChatBubble>
      ) : null}

      <div className="flex flex-wrap gap-2 pl-1">
        <button
          type="button"
          onClick={() => {
            if (!isAuthenticated) {
              onAuthRequired();
              return;
            }
            setShowWhats((value) => !value);
          }}
          className="flex items-center gap-2 rounded-full border border-border bg-background px-3 py-2 text-xs font-jakarta font-black text-foreground"
        >
          <MessageCircle className="size-3.5" /> Enviar para o WhatsApp
        </button>
        <button
          type="button"
          onClick={() => void handleListen()}
          disabled={listening}
          className="flex items-center gap-2 rounded-full border border-border bg-background px-3 py-2 text-xs font-jakarta font-black text-foreground disabled:opacity-50"
        >
          <Volume2 className="size-4" /> Escutar
        </button>
        <button
          type="button"
          onClick={() => void handleShare()}
          className="flex items-center gap-2 rounded-full border border-border bg-background px-3 py-2 text-xs font-jakarta font-black text-foreground"
        >
          <Share2 className="size-4" /> Compartilhar
        </button>
      </div>

      <div className="space-y-3 pt-2">
        <p className="pl-1 text-[10px] font-bold tracking-[0.22em] text-muted-foreground uppercase">Outros serviços</p>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {[
            { icon: Star, label: "Mapa astral", href: "/perfil" },
            { icon: CalendarIcon, label: "Planner", href: "/calendario" },
            { icon: MessageCircle, label: "Dashboard", href: "/dashboard" },
          ].map(({ icon: Icon, label, href }) => (
            <Link
              key={label}
              href={href}
              className="group flex items-center gap-3 rounded-2xl border border-border bg-background px-5 py-4 transition-colors hover:bg-muted"
            >
              <div className="flex size-9 items-center justify-center rounded-full bg-muted text-muted-foreground group-hover:text-foreground">
                <Icon className="size-4" />
              </div>
              <span className="font-jakarta text-sm font-black text-foreground">{label}</span>
            </Link>
          ))}
        </div>
      </div>

      <ChatBubble from="iris" className="w-full max-w-full bg-iris-blue-mist sm:max-w-full">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p aria-live="polite" className="font-jakarta text-lg font-extrabold text-foreground">
              {remainingLabel ?? "Créditos restantes: —"}
            </p>
          </div>
          <Button type="button" onClick={onReset} className="rounded-full">
            <RotateCcw className="size-3.5" /> Nova pergunta
          </Button>
        </div>
      </ChatBubble>
    </div>
  );
}
