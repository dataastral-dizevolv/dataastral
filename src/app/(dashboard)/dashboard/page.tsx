"use client";

import Link from "next/link";
import { Calendar, MessageCircle, Sparkles, Star } from "lucide-react";
import useSWR from "swr";

import { useDashboardUser } from "@/components/dashboard/DashboardUserContext";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getTodayRelevantEvent } from "@/lib/astrology/ephemerides";
import { EVENT_TYPE_COLORS } from "@/lib/theme/event-colors";
import type { EphemerisEvent, PredictionHistoryItem, PredictionHistoryWithCountResponse } from "@/types/dashboard";

const fetcher = async <T,>(url: string): Promise<T> => {
  const response = await fetch(url, { credentials: "include" });

  if (!response.ok) {
    throw new Error("Falha ao carregar dados do dashboard.");
  }

  return (await response.json()) as T;
};

function getSaudacao() {
  const hora = new Date().getHours();

  if (hora < 12) {
    return "Bom dia";
  }

  if (hora < 18) {
    return "Boa tarde";
  }

  return "Boa noite";
}

function formatarDataCurta(valor: string) {
  return new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "short" }).format(new Date(valor));
}

function selecionarProximoEvento(eventos: EphemerisEvent[]) {
  const hoje = new Date();
  const hojeIso = hoje.toISOString().slice(0, 10);
  return eventos.find((evento) => evento.data >= hojeIso) ?? eventos[0] ?? null;
}

export default function DashboardHomePage() {
  const { user } = useDashboardUser();
  const hoje = new Date();

  const { data: historicoResponse, isLoading: carregandoHistorico } = useSWR<PredictionHistoryWithCountResponse>(
    "/api/predictions/history?limit=3&withCount=1",
    fetcher,
    { revalidateOnFocus: true, dedupingInterval: 8000 },
  );

  const { data: eventosMes, isLoading: carregandoEventos } = useSWR<EphemerisEvent[]>(
    `/api/astrology/ephemerides?year=${hoje.getFullYear()}&month=${hoje.getMonth() + 1}`,
    fetcher,
    { revalidateOnFocus: false, dedupingInterval: 60000 },
  );

  const proximoEvento = selecionarProximoEvento(eventosMes ?? []);
  const eventoHoje = getTodayRelevantEvent(eventosMes ?? [], new Date().toISOString().slice(0, 10));
  const historico: PredictionHistoryItem[] = historicoResponse?.items ?? [];
  const totalPerguntas = historicoResponse?.total ?? 0;
  const ultimaPrevisao = historico[0] ?? null;

  const resumoCards = [
    {
      label: "Créditos disponíveis",
      valor: String(user.credits),
      icon: Sparkles,
      iconClassName: "text-iris-accent",
    },
    {
      label: "Perguntas feitas",
      valor: carregandoHistorico ? "..." : String(totalPerguntas),
      icon: MessageCircle,
      iconClassName: "text-foreground",
    },
    {
      label: "Próximo evento",
      valor: proximoEvento ? `${proximoEvento.titulo} - ${formatarDataCurta(proximoEvento.data)}` : "Sem eventos",
      icon: Calendar,
      iconClassName: "text-foreground",
    },
    {
      label: "Última previsão",
      valor: ultimaPrevisao ? new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(ultimaPrevisao.createdAt)) : "Sem histórico",
      icon: Star,
      iconClassName: "text-foreground",
    },
  ];

  return (
    <div className="w-full space-y-8 px-4 py-6 md:px-8 md:py-8">
      <section className="space-y-1 border-b border-border/70 pb-4">
        <h1 className="font-display text-4xl tracking-tight">
          {getSaudacao()}, {user.nome}
        </h1>
        <p className="text-sm text-muted-foreground">Aqui está o resumo do seu dia</p>
      </section>

      <section className="grid grid-cols-1 gap-3 border-b border-border/70 pb-6 sm:grid-cols-2 xl:grid-cols-4">
        {resumoCards.map((item) => {
          const Icon = item.icon;
          return (
            <div key={item.label} className="space-y-2 border-b border-border/70 pb-4 sm:pb-5 xl:border-b-0 xl:border-r xl:pr-4 xl:last:border-r-0">
              <div className="flex items-center justify-between gap-2">
                <p className="font-mono-iris text-[0.65rem] uppercase tracking-widest text-muted-foreground">
                  {item.label}
                </p>
                <Icon className={`size-4 ${item.iconClassName}`} />
              </div>
              <p className="font-display text-2xl tracking-tight text-foreground">
                {item.valor}
              </p>
            </div>
          );
        })}
      </section>

      <section className="space-y-3 border-b border-border/70 pb-6">
        <div className="space-y-3">
          <p className="font-mono-iris text-[0.65rem] uppercase tracking-widest text-iris-accent">
            ✦ Hoje no céu
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="font-display text-3xl tracking-tight">
              {carregandoEventos ? "Carregando efemérides..." : eventoHoje?.titulo ?? "Sem destaque para hoje"}
            </h2>
            {eventoHoje ? (
              <Badge
                style={{
                  borderColor: EVENT_TYPE_COLORS[eventoHoje.tipo].primary,
                  backgroundColor: EVENT_TYPE_COLORS[eventoHoje.tipo].surface,
                  color: EVENT_TYPE_COLORS[eventoHoje.tipo].text,
                }}
                className="border"
              >
                {eventoHoje.tipo.toUpperCase()}
              </Badge>
            ) : null}
          </div>
          <p className="text-sm leading-6 text-muted-foreground">
            {carregandoEventos
              ? "Estamos processando os aspectos do dia para montar seu panorama astrológico."
              : eventoHoje?.descricao ?? "Sem aspectos relevantes para hoje no seu calendário atual."}
          </p>
          <Button asChild variant="outline" className="w-fit">
            <Link href="/calendario">Ver no Calendário</Link>
          </Button>
        </div>
      </section>

      <section className="space-y-4 border-b border-border/70 pb-6">
        <header className="border-b border-border/70 pb-3">
          <h2 className="font-display text-2xl tracking-tight">Histórico recente</h2>
        </header>
        <div className="space-y-3">
          {carregandoHistorico ? <div className="h-16 animate-pulse bg-muted/30" /> : null}
          {!carregandoHistorico && (historico?.length ?? 0) === 0 ? (
            <div className="space-y-3 py-2">
              <p className="text-sm text-muted-foreground">Você ainda não fez nenhuma pergunta. Escolha um tema e descubra o que os astros dizem para você.</p>
              <Button asChild>
                <Link href="/calculadora">Fazer minha primeira pergunta</Link>
              </Button>
            </div>
          ) : null}
          {historico.map((item) => (
            <div
              key={item.id}
              className="border-b border-border/70 py-3 transition-colors hover:bg-muted/10"
            >
              <p className="font-mono-iris text-[0.65rem] uppercase tracking-widest text-muted-foreground">
                {new Intl.DateTimeFormat("pt-BR", { dateStyle: "medium", timeStyle: "short" }).format(new Date(item.createdAt))}
              </p>
              <p className="mt-1 text-sm text-foreground">{item.question}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="font-display text-2xl tracking-tight">Acesso rápido</h2>
        <div className="flex flex-wrap gap-2">
          <Button asChild>
            <Link href="/calculadora">✦ Fazer uma pergunta</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/calendario">Ver calendário</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/financeiro">Comprar créditos</Link>
          </Button>
        </div>
      </section>
    </div>
  );
}
