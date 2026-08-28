"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Calendar, ChevronRight, MessageCircle, Sparkles, Star } from "lucide-react";
import useSWR from "swr";

import { useDashboardUser } from "@/components/dashboard/DashboardUserContext";
import { ChatBubble } from "@/components/iris-chat/ChatBubble";
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

const CHAMBRAY_BUBBLE =
  "!border-iris-blue-chambray !bg-iris-blue-chambray text-iris-blue-ink text-[15px] font-black sm:text-[17px]";

function SectionLabel({ index, title }: { index: string; title: string }) {
  return (
    <p className="font-jakarta text-[12px] font-black tracking-[0.22em] text-current uppercase sm:text-[13px]">
      {index} · {title}
    </p>
  );
}

export default function DashboardHomePage() {
  const { user } = useDashboardUser();
  const [hoje, setHoje] = useState<Date | null>(null);
  const [saudacao, setSaudacao] = useState("Olá");

  useEffect(() => {
    const now = new Date();
    setHoje(now);
    setSaudacao(getSaudacao());
  }, []);

  const { data: historicoResponse, isLoading: carregandoHistorico } = useSWR<PredictionHistoryWithCountResponse>(
    "/api/predictions/history?limit=3&withCount=1",
    fetcher,
    { revalidateOnFocus: true, dedupingInterval: 8000 },
  );

  const { data: eventosMes, isLoading: carregandoEventos } = useSWR<EphemerisEvent[]>(
    hoje ? `/api/astrology/ephemerides?year=${hoje.getFullYear()}&month=${hoje.getMonth() + 1}` : null,
    fetcher,
    { revalidateOnFocus: false, dedupingInterval: 60000 },
  );

  const proximoEvento = selecionarProximoEvento(eventosMes ?? []);
  const eventoHoje = getTodayRelevantEvent(
    eventosMes ?? [],
    (hoje ?? new Date()).toISOString().slice(0, 10),
  );
  const historico: PredictionHistoryItem[] = historicoResponse?.items ?? [];
  const totalPerguntas = historicoResponse?.total ?? 0;
  const ultimaPrevisao = historico[0] ?? null;

  return (
    <div className="mx-auto w-full max-w-2xl space-y-4 px-4 py-6 pb-20 md:px-8 md:py-8">
      <section className="space-y-1 pb-2">
        <p className="font-ubuntu text-[10px] tracking-[0.22em] text-muted-foreground uppercase">Início</p>
        <h1 className="font-ubuntu text-3xl leading-[1.05] font-black tracking-[-0.03em] text-foreground sm:text-4xl md:text-5xl">
          {saudacao}, {user.nome}
        </h1>
        <p className="text-sm text-muted-foreground">Aqui está o resumo do seu dia</p>
      </section>

      <ChatBubble from="iris" className="!border-casper !bg-casper text-[15px] font-black text-casper-foreground sm:text-[17px]">
        <div className="space-y-4 py-1">
          <SectionLabel index="01" title="Saldo e atividade" />
          <div className="grid grid-cols-2 gap-x-4 gap-y-4">
            <div className="space-y-1">
              <div className="flex items-center gap-1.5 text-[11px] tracking-wider uppercase opacity-70">
                <Sparkles className="size-3.5" />
                Créditos
              </div>
              <p className="font-jakarta text-2xl font-black leading-none">{user.credits}</p>
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-1.5 text-[11px] tracking-wider uppercase opacity-70">
                <MessageCircle className="size-3.5" />
                Perguntas
              </div>
              <p className="font-jakarta text-2xl font-black leading-none">
                {carregandoHistorico ? "…" : totalPerguntas}
              </p>
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-1.5 text-[11px] tracking-wider uppercase opacity-70">
                <Calendar className="size-3.5" />
                Próximo evento
              </div>
              <p className="font-jakarta text-sm font-black leading-snug">
                {proximoEvento
                  ? `${proximoEvento.titulo} · ${formatarDataCurta(proximoEvento.data)}`
                  : "Sem eventos"}
              </p>
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-1.5 text-[11px] tracking-wider uppercase opacity-70">
                <Star className="size-3.5" />
                Última previsão
              </div>
              <p className="font-jakarta text-sm font-black leading-snug">
                {ultimaPrevisao
                  ? new Intl.DateTimeFormat("pt-BR", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    }).format(new Date(ultimaPrevisao.createdAt))
                  : "Sem histórico"}
              </p>
            </div>
          </div>
          <Button size="sm" asChild className="transition-all active:scale-95 active:opacity-70">
            <Link href="/precos">Comprar créditos</Link>
          </Button>
        </div>
      </ChatBubble>

      <ChatBubble from="iris" className={CHAMBRAY_BUBBLE}>
        <div className="space-y-3 py-1">
          <SectionLabel index="02" title="Hoje no céu" />
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="font-jakarta text-xl font-black tracking-tight sm:text-2xl">
              {carregandoEventos ? "Carregando efemérides…" : eventoHoje?.titulo ?? "Sem destaque para hoje"}
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
          <p className="text-sm font-normal leading-relaxed opacity-80">
            {carregandoEventos
              ? "Estamos processando os aspectos do dia para montar seu panorama astrológico."
              : eventoHoje?.descricao ?? "Sem aspectos relevantes para hoje no seu calendário atual."}
          </p>
          <Button
            asChild
            size="sm"
            variant="outline"
            className="w-fit border-current bg-transparent transition-all active:scale-95 active:opacity-70"
          >
            <Link href="/calendario">Ver no Calendário</Link>
          </Button>
        </div>
      </ChatBubble>

      <ChatBubble from="iris" className={CHAMBRAY_BUBBLE}>
        <div className="space-y-3 py-1">
          <SectionLabel index="03" title="Histórico recente" />
          {carregandoHistorico ? <div className="h-14 animate-pulse rounded-2xl bg-foreground/10" /> : null}
          {!carregandoHistorico && historico.length === 0 ? (
            <div className="space-y-3">
              <p className="text-sm font-normal leading-relaxed opacity-80">
                Você ainda não fez nenhuma pergunta. Escolha um tema e descubra o que os astros dizem para você.
              </p>
              <Button size="sm" asChild className="transition-all active:scale-95 active:opacity-70">
                <Link href="/calculadora">Fazer minha primeira pergunta</Link>
              </Button>
            </div>
          ) : null}
          {!carregandoHistorico && historico.length > 0 ? (
            <ul className="divide-y divide-foreground/15">
              {historico.map((item) => (
                <li key={item.id} className="py-3 first:pt-0 last:pb-0">
                  <p className="text-[11px] tracking-[0.18em] uppercase opacity-70">
                    {new Intl.DateTimeFormat("pt-BR", {
                      dateStyle: "medium",
                      timeStyle: "short",
                    }).format(new Date(item.createdAt))}
                  </p>
                  <p className="mt-1 text-sm font-normal leading-snug">{item.question}</p>
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      </ChatBubble>

      <ChatBubble from="iris" className={CHAMBRAY_BUBBLE}>
        <div className="space-y-3 py-1">
          <SectionLabel index="04" title="Acesso rápido" />
          <ul className="divide-y divide-foreground/15">
            <li>
              <Link
                href="/calculadora"
                className="flex items-center justify-between gap-3 py-3 transition-opacity hover:opacity-80"
              >
                <span className="text-sm font-black">✦ Fazer uma pergunta</span>
                <ChevronRight className="size-4 opacity-60" />
              </Link>
            </li>
            <li>
              <Link
                href="/calendario"
                className="flex items-center justify-between gap-3 py-3 transition-opacity hover:opacity-80"
              >
                <span className="text-sm font-black">Ver calendário</span>
                <ChevronRight className="size-4 opacity-60" />
              </Link>
            </li>
            <li>
              <Link
                href="/financeiro"
                className="flex items-center justify-between gap-3 py-3 transition-opacity hover:opacity-80"
              >
                <span className="text-sm font-black">Comprar créditos</span>
                <ChevronRight className="size-4 opacity-60" />
              </Link>
            </li>
            <li>
              <Link
                href="/perfil"
                className="flex items-center justify-between gap-3 py-3 transition-opacity hover:opacity-80"
              >
                <span className="text-sm font-black">Meu perfil</span>
                <ChevronRight className="size-4 opacity-60" />
              </Link>
            </li>
          </ul>
        </div>
      </ChatBubble>
    </div>
  );
}
