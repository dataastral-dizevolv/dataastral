"use client";

import { useMemo, useRef, useState, type CSSProperties } from "react";
import Link from "next/link";

import { Download, Loader2, MessageCircle, Play, Volume2 } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { USER_MESSAGES, toUserFacingMessage } from "@/lib/errors/user-facing";
import { generateInsightPdf } from "@/lib/pdf/generate-insight-pdf";
import { EVENT_TYPE_COLORS } from "@/lib/theme/event-colors";
import type { EphemerisEvent, EphemerisEventType } from "@/types/dashboard";

interface PrevisaoDrawerProps {
  aberto: boolean;
  onFechar: () => void;
  data: string | null;
  predictionId?: string | null;
  eventos: EphemerisEvent[];
  previsao: string | null;
  missingBirthData?: boolean;
}

const estiloTipo: Record<EphemerisEventType, { badge: CSSProperties; dot: CSSProperties }> = {
  tensao: {
    badge: {
      borderColor: EVENT_TYPE_COLORS.tensao.primary,
      backgroundColor: EVENT_TYPE_COLORS.tensao.surface,
      color: EVENT_TYPE_COLORS.tensao.text,
    },
    dot: { backgroundColor: EVENT_TYPE_COLORS.tensao.primary },
  },
  harmonia: {
    badge: {
      borderColor: EVENT_TYPE_COLORS.harmonia.primary,
      backgroundColor: EVENT_TYPE_COLORS.harmonia.surface,
      color: EVENT_TYPE_COLORS.harmonia.text,
    },
    dot: { backgroundColor: EVENT_TYPE_COLORS.harmonia.primary },
  },
  portal: {
    badge: {
      borderColor: EVENT_TYPE_COLORS.portal.primary,
      backgroundColor: EVENT_TYPE_COLORS.portal.surface,
      color: EVENT_TYPE_COLORS.portal.text,
    },
    dot: { backgroundColor: EVENT_TYPE_COLORS.portal.primary },
  },
  neutro: {
    badge: {
      borderColor: EVENT_TYPE_COLORS.neutro.primary,
      backgroundColor: EVENT_TYPE_COLORS.neutro.surface,
      color: EVENT_TYPE_COLORS.neutro.text,
    },
    dot: { backgroundColor: EVENT_TYPE_COLORS.neutro.primary },
  },
};

function formatarDataCabecalho(data: string | null): string {
  if (!data) {
    return "Selecione um dia";
  }

  const dataConvertida = new Date(`${data}T12:00:00`);
  const texto = new Intl.DateTimeFormat("pt-BR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(dataConvertida);

  return texto.charAt(0).toUpperCase() + texto.slice(1);
}

function resumirPrevisao(texto: string) {
  const semQuebras = texto.replace(/\s+/g, " ").trim();

  if (semQuebras.length <= 260) {
    return semQuebras;
  }

  return `${semQuebras.slice(0, 257)}...`;
}

export function PrevisaoDrawer({
  aberto,
  onFechar,
  data,
  predictionId = null,
  eventos,
  previsao,
  missingBirthData = false,
}: PrevisaoDrawerProps) {
  const [audioLoadingKey, setAudioLoadingKey] = useState<string | null>(null);
  const [pdfLoading, setPdfLoading] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioRequestLockRef = useRef(false);

  const dataFormatada = formatarDataCabecalho(data);
  const temaInsight = useMemo(() => {
    if (eventos.length === 0) {
      return "Previsão diária";
    }

    if (eventos.length === 1) {
      return eventos[0].titulo;
    }

    return `${eventos[0].titulo} e mais ${eventos.length - 1} evento(s)`;
  }, [eventos]);

  function compartilharWhatsapp() {
    if (!previsao || !data) {
      toast.error("Selecione um dia com previsão para compartilhar.");
      return;
    }

    const mensagem = [
      "Olha o que a Iris previu para o meu dia:",
      `${dataFormatada} - ${temaInsight}`,
      "",
      resumirPrevisao(previsao),
      "",
      "Descobri no Data Iris.",
    ].join("\n");

    const url = `https://wa.me/?text=${encodeURIComponent(mensagem)}`;
    window.open(url, "_blank", "noopener,noreferrer");
  }

  async function reproduzirNarracao(input: { cacheKey: string; predictionId?: string | null; eventId?: string; eventDate?: string; text: string }) {
    if (audioRequestLockRef.current || audioLoadingKey !== null) {
      return;
    }

    const cleanText = input.text.trim();
    if (!cleanText) {
      toast.error("Não há conteúdo narrativo para este item.");
      return;
    }

    audioRequestLockRef.current = true;
    setAudioLoadingKey(input.cacheKey);

    try {
      const response = await fetch("/api/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          predictionId: input.predictionId,
          eventId: input.eventId,
          eventDate: input.eventDate,
          audio_text: cleanText,
          text: cleanText,
        }),
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => ({}))) as { error?: string; code?: string };
        toast.error(toUserFacingMessage(payload, USER_MESSAGES.listenFailed));
        return;
      }

      const payload = (await response.json()) as { audioUrl?: string; cached?: boolean };
      if (!payload.audioUrl) {
        toast.error("Não foi possível reproduzir o áudio agora.");
        return;
      }

      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = "";
      }

      const audio = new Audio(payload.audioUrl);
      audioRef.current = audio;
      await audio.play();
      toast.success("Narração pronta.");
    } catch {
      toast.error("Falha de conexão ao gerar áudio.");
    } finally {
      audioRequestLockRef.current = false;
      setAudioLoadingKey(null);
    }
  }

  async function gerarPdf() {
    if (!previsao || !data) {
      toast.error("Selecione um dia com previsão para exportar.");
      return;
    }

    setPdfLoading(true);

    try {
      const fileDate = data.replace(/-/g, "");
      await generateInsightPdf({
        dataFormatada,
        temaInsight,
        previsao,
        eventos,
        fileDate,
      });
      toast.success("PDF gerado com sucesso.");
    } catch {
      toast.error("Não foi possível gerar o PDF agora.");
    } finally {
      setPdfLoading(false);
    }
  }

  return (
    <Sheet open={aberto} onOpenChange={(valor) => (!valor ? onFechar() : null)}>
      <SheetContent>
        <div className="flex h-full flex-col">
          <SheetHeader className="border-b border-border px-6 py-6">
            <SheetTitle>{dataFormatada}</SheetTitle>
            <SheetDescription className="font-mono-iris uppercase tracking-widest">Previsão diária baseada em efemérides</SheetDescription>
            <div className="flex flex-wrap gap-2 pt-1">
              {eventos.length > 0 ? (
                eventos.map((evento) => (
                  <Badge key={evento.id} style={estiloTipo[evento.tipo].badge} className="border text-xs">
                    {evento.titulo}
                  </Badge>
                ))
              ) : (
                <Badge variant="outline" className="border-border text-muted-foreground">
                  Sem eventos no dia
                </Badge>
              )}
            </div>
          </SheetHeader>

          <div className="flex-1 space-y-6 overflow-y-auto px-6 py-6">
            {previsao ? (
              <p className="text-[15px] leading-7 text-foreground">{previsao}</p>
            ) : (
              <div className="py-10 text-center">
                <p className="text-sm text-muted-foreground">
                  {missingBirthData
                    ? "Para ver seu calendário personalizado, complete seus dados de nascimento no Perfil."
                    : "Sem previsão registrada para este dia"}
                </p>
                {missingBirthData ? (
                  <Button asChild variant="outline" className="mt-4 border-iris-accent/40 text-iris-accent hover:bg-iris-accent/10">
                    <Link href="/perfil" onClick={onFechar}>
                      Ir para Perfil
                    </Link>
                  </Button>
                ) : null}
              </div>
            )}

            <div className="space-y-3 border-t border-b border-border py-4">
              <h3 className="font-display text-xl tracking-tight text-foreground">Compartilhar Insight</h3>
              <p className="text-sm text-muted-foreground">Transforme sua previsão em texto, áudio ou PDF com um clique.</p>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                <Button
                  type="button"
                  variant="outline"
                  className="w-full border-iris-accent/40 text-iris-accent hover:bg-iris-accent/10 hover:text-iris-accent"
                  onClick={compartilharWhatsapp}
                  disabled={!previsao}
                >
                  <MessageCircle className="size-4" />
                  WhatsApp
                </Button>

                <Button
                  type="button"
                  variant="ghost"
                  className="w-full border border-iris-accent/40 text-iris-accent hover:bg-iris-accent/10 hover:text-iris-accent"
                  onClick={() =>
                    void reproduzirNarracao({
                      cacheKey: `daily-${data ?? "sem_data"}`,
                      predictionId,
                      eventId: `daily_${data ?? "sem_data"}`,
                      eventDate: data ?? new Date().toISOString().slice(0, 10),
                      text: previsao ?? "",
                    })
                  }
                  disabled={!previsao || audioLoadingKey !== null}
                >
                  {audioLoadingKey === `daily-${data ?? "sem_data"}` ? <Loader2 className="size-4 animate-spin" /> : <Volume2 className="size-4" />}
                  {audioLoadingKey === `daily-${data ?? "sem_data"}` ? "Gerando..." : "Ouvir Áudio"}
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  className="w-full border-iris-accent/40 text-iris-accent hover:bg-iris-accent/10 hover:text-iris-accent"
                  onClick={() => void gerarPdf()}
                  disabled={!previsao || pdfLoading}
                >
                  {pdfLoading ? <Loader2 className="size-4 animate-spin" /> : <Download className="size-4" />}
                  {pdfLoading ? "Gerando..." : "Gerar PDF"}
                </Button>
              </div>
            </div>

            <div className="space-y-3 border-t border-border pt-5">
              <h3 className="font-display text-xl tracking-tight">Eventos do dia</h3>
              {eventos.length > 0 ? (
                <div className="space-y-3">
                  {eventos.map((evento) => (
                    <div key={`${evento.id}-linha`} className="space-y-3">
                      <div className="flex items-start gap-3">
                        <span style={estiloTipo[evento.tipo].dot} className="mt-1 size-2 rounded-full" />
                        <div className="min-w-0 flex-1 space-y-1">
                          <div className="flex items-center justify-between gap-2">
                            <p className="text-sm font-medium text-foreground">{evento.titulo}</p>
                            <Button
                              type="button"
                              size="icon-sm"
                              variant="ghost"
                              className="h-7 w-7 border border-iris-accent/35 text-iris-accent hover:bg-iris-accent/10 hover:text-iris-accent"
                              onClick={() =>
                                void reproduzirNarracao({
                                  cacheKey: evento.id,
                                  eventId: evento.id,
                                  eventDate: evento.data,
                                  text: evento.descricao,
                                })
                              }
                              disabled={audioLoadingKey !== null}
                              aria-label={`Ouvir narração do evento ${evento.titulo}`}
                            >
                              {audioLoadingKey === evento.id ? <Loader2 className="size-3.5 animate-spin" /> : <Play className="size-3.5" />}
                            </Button>
                          </div>
                          <p className="text-sm leading-6 text-muted-foreground">{evento.descricao}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Não há eventos astrológicos cadastrados para esta data.</p>
              )}
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
