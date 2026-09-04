"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import useSWR from "swr";

import { ICalFeedManager } from "@/components/calendar/ICalFeedManager";
import { FiltroEventos } from "@/components/dashboard/FiltroEventos";
import { PrevisaoDrawer } from "@/components/dashboard/PrevisaoDrawer";
import { DayView } from "@/components/planner/DayView";
import { EventDrawer } from "@/components/planner/EventDrawer";
import { MonthView } from "@/components/planner/MonthView";
import { PlannerToolbar, type PlannerView } from "@/components/planner/PlannerToolbar";
import { ToneLegend } from "@/components/planner/ToneLegend";
import { WeekView } from "@/components/planner/WeekView";
import { Button } from "@/components/ui/button";
import { capitalizeMonth } from "@/lib/planner/dates";
import { parseICal } from "@/lib/planner/icalParser";
import { ephemerisToPlannerEvent, icalToPlannerEvent, TONE_TO_TYPE } from "@/lib/planner/mapEvents";
import { generateSkyEvents, type PlannerEvent } from "@/lib/planner/plannerEvents";
import type { ICalFeed } from "@/types/calendar";
import type { EphemerisEvent, EphemerisEventType, PredictionHistoryItem } from "@/types/dashboard";

class CalendarApiError extends Error {
  code?: string;

  constructor(message: string, code?: string) {
    super(message);
    this.code = code;
  }
}

const fetcher = async <T,>(url: string): Promise<T> => {
  const response = await fetch(url, { credentials: "include" });

  if (!response.ok) {
    const payload = (await response.json().catch(() => ({}))) as { error?: string; code?: string };
    throw new CalendarApiError(payload.error || "Falha ao carregar dados do calendário.", payload.code);
  }

  return (await response.json()) as T;
};

export function CalendarioEfemerides() {
  const hoje = new Date();

  const [diaSelecionado, setDiaSelecionado] = useState<string | null>(null);
  const [drawerAberto, setDrawerAberto] = useState(false);
  const [view, setView] = useState<PlannerView>("month");
  const [filtroAtivo, setFiltroAtivo] = useState<EphemerisEventType | "todos">("todos");
  const [cursor, setCursor] = useState(hoje);
  const [mesSelecionado, setMesSelecionado] = useState({
    year: hoje.getFullYear(),
    month: hoje.getMonth() + 1,
  });
  const [feeds, setFeeds] = useState<ICalFeed[]>([]);
  const [externalEvents, setExternalEvents] = useState<PlannerEvent[]>([]);
  const [loadingFeeds, setLoadingFeeds] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<PlannerEvent | null>(null);
  const [learnMore, setLearnMore] = useState(false);

  const handleFeedsChange = useCallback((next: ICalFeed[]) => {
    setFeeds(next);
  }, []);

  const {
    data: eventos,
    isLoading: carregandoEventos,
    error: erroEventos,
  } = useSWR<EphemerisEvent[]>(
    `/api/astrology/ephemerides?year=${mesSelecionado.year}&month=${mesSelecionado.month}`,
    fetcher,
    {
      revalidateOnFocus: false,
      dedupingInterval: 60000,
    },
  );

  const erroCalendario = erroEventos as CalendarApiError | undefined;
  const faltamDadosNatais = erroCalendario?.code === "MISSING_BIRTH_DATA";

  const inicioMes = `${mesSelecionado.year}-${String(mesSelecionado.month).padStart(2, "0")}-01`;
  const fimMes = `${mesSelecionado.year}-${String(mesSelecionado.month).padStart(2, "0")}-${String(
    new Date(mesSelecionado.year, mesSelecionado.month, 0).getDate(),
  ).padStart(2, "0")}`;

  const { data: historico } = useSWR<PredictionHistoryItem[]>(
    `/api/predictions/history?limit=100&startDate=${inicioMes}&endDate=${fimMes}`,
    fetcher,
    {
      revalidateOnFocus: true,
      dedupingInterval: 20000,
    },
  );

  const skyEvents = useMemo(() => {
    const from = new Date(mesSelecionado.year, mesSelecionado.month - 1, 1);
    from.setDate(from.getDate() - 3);
    const to = new Date(mesSelecionado.year, mesSelecionado.month, 0);
    to.setDate(to.getDate() + 3);
    return generateSkyEvents(from, to);
  }, [mesSelecionado]);

  useEffect(() => {
    let cancelled = false;

    async function run() {
      const active = feeds.filter((feed) => feed.active);
      if (active.length === 0) {
        setExternalEvents([]);
        return;
      }

      setLoadingFeeds(true);
      const collected: PlannerEvent[] = [];

      for (const feed of active) {
        try {
          const response = await fetch("/api/calendar/ical-proxy", {
            method: "POST",
            credentials: "include",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ url: feed.url }),
          });
          if (!response.ok) continue;
          const payload = (await response.json()) as { ics?: string };
          const parsed = parseICal(payload.ics || "");
          for (const event of parsed) {
            collected.push(icalToPlannerEvent(feed, event));
          }
        } catch {
          // Agenda externa individual não deve derrubar o calendário.
        }
      }

      if (!cancelled) {
        setExternalEvents(collected);
        setLoadingFeeds(false);
      }
    }

    void run();
    return () => {
      cancelled = true;
    };
  }, [feeds]);

  const personalEvents = useMemo(
    () => (eventos ?? []).map((event) => ephemerisToPlannerEvent(event)),
    [eventos],
  );

  const plannerEvents = useMemo(
    () => [...personalEvents, ...skyEvents, ...externalEvents],
    [externalEvents, personalEvents, skyEvents],
  );

  const eventosFiltrados = useMemo(() => {
    if (filtroAtivo === "todos") {
      return plannerEvents;
    }

    return plannerEvents.filter((event) => TONE_TO_TYPE[event.tone] === filtroAtivo);
  }, [filtroAtivo, plannerEvents]);

  const diasComPrevisao = useMemo(() => {
    const dias = new Set<string>();

    for (const item of historico ?? []) {
      const diaEvento = item.eventDateIso?.slice(0, 10);
      if (diaEvento) {
        dias.add(diaEvento);
      }
    }

    return dias;
  }, [historico]);

  const eventosDiaSelecionado = useMemo(() => {
    if (!diaSelecionado) {
      return [];
    }

    return (eventos ?? []).filter((evento) => evento.data === diaSelecionado);
  }, [diaSelecionado, eventos]);

  const previsaoDiaSelecionado = useMemo(() => {
    if (!diaSelecionado) {
      return null;
    }

    const item = (historico ?? []).find((entry) => entry.eventDateIso?.slice(0, 10) === diaSelecionado);
    if (item?.prediction) {
      return item.prediction;
    }

    const eventosDoDia = (eventos ?? []).filter((evento) => evento.data === diaSelecionado);

    if (eventosDoDia.length === 0) {
      return null;
    }

    return eventosDoDia.map((evento) => evento.descricao).join("\n\n");
  }, [diaSelecionado, eventos, historico]);

  const predictionIdDiaSelecionado = useMemo(() => {
    if (!diaSelecionado) {
      return null;
    }

    const item = (historico ?? []).find((entry) => entry.eventDateIso?.slice(0, 10) === diaSelecionado);
    return item?.id ?? null;
  }, [diaSelecionado, historico]);

  function abrirDrawerData(data: string) {
    setDiaSelecionado(data);
    setDrawerAberto(true);
  }

  function syncMonthFromDate(date: Date) {
    const ano = date.getFullYear();
    const mes = date.getMonth() + 1;
    setMesSelecionado((atual) => {
      if (atual.year === ano && atual.month === mes) {
        return atual;
      }
      return { year: ano, month: mes };
    });
  }

  function handleCursorChange(next: Date) {
    setCursor(next);
    syncMonthFromDate(next);
  }

  return (
    <section className="space-y-8 font-ubuntu md:space-y-10">
      <header className="space-y-6 md:space-y-8">
        <div className="max-w-xl">
          <button
            type="button"
            onClick={() => setLearnMore((open) => !open)}
            className="text-xs tracking-[0.18em] text-muted-foreground uppercase transition-colors hover:text-iris-blue-chambray"
          >
            {learnMore ? "fechar" : "saiba mais"}
          </button>
          <div
            className={`overflow-hidden transition-all duration-500 ease-out ${
              learnMore ? "mt-3 max-h-96 opacity-100" : "max-h-0 opacity-0"
            }`}
          >
            <p className="text-sm leading-relaxed text-muted-foreground">
              Os trânsitos astrológicos em cada dia no seu mapa personalizado, diretamente na sua agenda! Ative para
              receber os avisos no seu WhatsApp.
            </p>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              Ao saber a energia do dia, você saberá o melhor momento para avançar, decidir, aguardar ou encerrar. Poderá
              entender a razão de um mal-estar passageiro, e quando vai passar! E ainda, as datas de esperar os melhores
              resultados!
            </p>
          </div>
        </div>

        <div
          className="pointer-events-none flex select-none items-baseline gap-3"
          aria-hidden="true"
        >
          <span className="font-ubuntu text-5xl leading-[0.95] font-black tracking-[-0.04em] text-iris-blue-chambray/40 sm:text-6xl md:text-7xl lg:text-8xl">
            {capitalizeMonth(cursor)}
          </span>
          <span className="font-ubuntu text-base font-bold tracking-[-0.02em] text-iris-blue-chambray/60 sm:text-lg">
            {cursor.getFullYear()}
          </span>
        </div>

        <div className="space-y-4">
          <PlannerToolbar view={view} onViewChange={setView} cursor={cursor} onCursorChange={handleCursorChange} />
          <FiltroEventos filtroAtivo={filtroAtivo} onChange={setFiltroAtivo} />
        </div>
      </header>

      <div className="space-y-4">
        {erroEventos ? (
          <div className="rounded-3xl border border-border bg-background p-4 sm:p-5">
            <p className="text-sm text-destructive">
              {faltamDadosNatais
                ? "Para ver seu calendário personalizado, complete seus dados de nascimento no Perfil."
                : "Não foi possível carregar efemérides deste período. O céu do momento e as agendas externas continuam visíveis."}
            </p>
            {faltamDadosNatais ? (
              <Button asChild variant="outline" size="sm" className="mt-3">
                <Link href="/perfil">Completar perfil astral</Link>
              </Button>
            ) : null}
          </div>
        ) : null}

        <AnimatePresence mode="wait">
          <motion.div
            key={view}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
          >
            {view === "day" ? (
              <DayView cursor={cursor} events={eventosFiltrados} onEventClick={setSelectedEvent} />
            ) : null}
            {view === "week" ? (
              <WeekView cursor={cursor} events={eventosFiltrados} onEventClick={setSelectedEvent} />
            ) : null}
            {view === "month" ? (
              <MonthView
                cursor={cursor}
                events={eventosFiltrados}
                onEventClick={setSelectedEvent}
                onDayClick={abrirDrawerData}
                predictionDays={diasComPrevisao}
              />
            ) : null}
          </motion.div>
        </AnimatePresence>

        {carregandoEventos ? <div className="mt-2 h-9 w-56 animate-pulse rounded-full bg-muted" /> : null}
        {loadingFeeds ? <p className="text-[11px] text-muted-foreground">Sincronizando agendas externas…</p> : null}
      </div>

      <ToneLegend />
      <ICalFeedManager onFeedsChange={handleFeedsChange} />

      <PrevisaoDrawer
        aberto={drawerAberto}
        onFechar={() => setDrawerAberto(false)}
        data={diaSelecionado}
        predictionId={predictionIdDiaSelecionado}
        eventos={eventosDiaSelecionado}
        previsao={previsaoDiaSelecionado}
        missingBirthData={faltamDadosNatais}
      />
      <EventDrawer event={selectedEvent} onClose={() => setSelectedEvent(null)} />
    </section>
  );
}
