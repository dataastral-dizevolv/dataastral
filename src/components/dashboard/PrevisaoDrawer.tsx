"use client";

import { useEffect, useMemo, useState, type CSSProperties } from "react";
import Link from "next/link";

import { Download, Headphones, Loader2, MessageCircle, Volume2 } from "lucide-react";
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
import { EVENT_TYPE_COLORS } from "@/lib/theme/event-colors";
import type { EphemerisEvent, EphemerisEventType } from "@/types/dashboard";

interface PrevisaoDrawerProps {
  aberto: boolean;
  onFechar: () => void;
  data: string | null;
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
  eventos,
  previsao,
  missingBirthData = false,
}: PrevisaoDrawerProps) {
  const [audioLoading, setAudioLoading] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);

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

  useEffect(() => {
    return () => {
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }
    };
  }, [audioUrl]);

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
      "Descobri no Data Astral.",
    ].join("\n");

    const url = `https://wa.me/?text=${encodeURIComponent(mensagem)}`;
    window.open(url, "_blank", "noopener,noreferrer");
  }

  async function ouvirAudio() {
    if (!previsao) {
      toast.error("Sem previsão para gerar áudio.");
      return;
    }

    setAudioLoading(true);

    try {
      const response = await fetch("/api/export/audio", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: previsao }),
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => ({}))) as { error?: string };
        toast.error(payload.error ?? "Não foi possível gerar áudio agora.");
        return;
      }

      const blob = await response.blob();
      const nextAudioUrl = URL.createObjectURL(blob);

      setAudioUrl((current) => {
        if (current) {
          URL.revokeObjectURL(current);
        }

        return nextAudioUrl;
      });
      toast.success("Áudio gerado com sucesso.");
    } catch {
      toast.error("Falha de conexão ao gerar áudio.");
    } finally {
      setAudioLoading(false);
    }
  }

  async function gerarPdf() {
    if (!previsao || !data) {
      toast.error("Selecione um dia com previsão para exportar.");
      return;
    }

    setPdfLoading(true);

    try {
      const { jsPDF } = await import("jspdf");
      const doc = new jsPDF({ unit: "pt", format: "a4" });

      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = 44;
      const contentWidth = pageWidth - margin * 2;

      doc.setFillColor(13, 12, 24);
      doc.rect(0, 0, pageWidth, pageHeight, "F");

      doc.setFillColor(95, 81, 205);
      doc.circle(pageWidth - 70, 70, 120, "F");

      doc.setTextColor(227, 223, 255);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
      doc.text("IRIS - DATA ASTRAL", margin, 42);

      doc.setFont("helvetica", "bold");
      doc.setFontSize(26);
      doc.text("Insight Diário", margin, 90);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(12);
      doc.setTextColor(198, 193, 242);
      doc.text(`${dataFormatada} - ${temaInsight}`, margin, 116);

      doc.setDrawColor(95, 81, 205);
      doc.line(margin, 132, pageWidth - margin, 132);

      doc.setTextColor(241, 239, 255);
      doc.setFontSize(12.5);
      const linhas = doc.splitTextToSize(previsao, contentWidth) as string[];
      doc.text(linhas, margin, 162, { maxWidth: contentWidth, lineHeightFactor: 1.65 });

      const fileDate = data.replace(/-/g, "");
      doc.save(`iris-insight-${fileDate}.pdf`);
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

            <div className="space-y-3 rounded-xl border border-iris-accent/30 bg-muted/20 p-4">
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
                  onClick={() => void ouvirAudio()}
                  disabled={!previsao || audioLoading}
                >
                  {audioLoading ? <Loader2 className="size-4 animate-spin" /> : <Headphones className="size-4" />}
                  {audioLoading ? "Gerando..." : "Ouvir Áudio"}
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

              {audioUrl ? (
                <div className="rounded-lg border border-iris-accent/20 bg-background/70 p-3">
                  <div className="mb-2 flex items-center gap-2 text-sm text-iris-accent">
                    <Volume2 className="size-4" />
                    Áudio do insight pronto
                  </div>
                  <audio controls src={audioUrl} className="w-full" preload="none" />
                </div>
              ) : null}
            </div>

            <div className="space-y-3 border-t border-border pt-5">
              <h3 className="font-display text-xl tracking-tight">Eventos do dia</h3>
              {eventos.length > 0 ? (
                <div className="space-y-3">
                  {eventos.map((evento) => (
                    <div key={`${evento.id}-linha`} className="space-y-3">
                      <div className="flex items-start gap-3">
                        <span style={estiloTipo[evento.tipo].dot} className="mt-1 size-2 rounded-full" />
                        <div className="space-y-1">
                          <p className="text-sm font-medium text-foreground">{evento.titulo}</p>
                          <p className="text-sm leading-6 text-muted-foreground">{evento.descricao}</p>
                        </div>
                      </div>
                      <div className="h-px bg-border" />
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
