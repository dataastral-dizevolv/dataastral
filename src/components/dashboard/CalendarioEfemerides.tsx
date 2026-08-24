"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";
import listPlugin from "@fullcalendar/list";
import timeGridPlugin from "@fullcalendar/timegrid";
import ptBrLocale from "@fullcalendar/core/locales/pt-br";
import { ChevronLeft, ChevronRight } from "lucide-react";
import useSWR from "swr";

import { ICalFeedManager } from "@/components/calendar/ICalFeedManager";
import { FiltroEventos } from "@/components/dashboard/FiltroEventos";
import { PrevisaoDrawer } from "@/components/dashboard/PrevisaoDrawer";
import { DayView } from "@/components/planner/DayView";
import { EventDrawer } from "@/components/planner/EventDrawer";
import { ToneLegend } from "@/components/planner/ToneLegend";
import { Button } from "@/components/ui/button";
import { addDays, addMonths, addWeeks, formatLongDay, formatMonthYear, toIsoDate } from "@/lib/planner/dates";
import { parseICal } from "@/lib/planner/icalParser";
import { ephemerisToPlannerEvent, icalToPlannerEvent, TONE_TO_TYPE } from "@/lib/planner/mapEvents";
import { generateSkyEvents, type PlannerEvent } from "@/lib/planner/plannerEvents";
import { EVENT_TYPE_COLORS } from "@/lib/theme/event-colors";
import type { ICalFeed } from "@/types/calendar";
import type { EphemerisEvent, EphemerisEventType, PredictionHistoryItem } from "@/types/dashboard";

class CalendarApiError extends Error {
  code?: string;

  constructor(message: string, code?: string) {
    super(message);
    this.code = code;
  }
}

type CalendarMode = "month" | "week" | "list" | "day";

const fetcher = async <T,>(url: string): Promise<T> => {
  const response = await fetch(url, { credentials: "include" });

  if (!response.ok) {
    const payload = (await response.json().catch(() => ({}))) as { error?: string; code?: string };
    throw new CalendarApiError(payload.error || "Falha ao carregar dados do calendário.", payload.code);
  }

  return (await response.json()) as T;
};

function formatarDataLocalIso(data: Date) {
  return toIsoDate(data);
}

function formatarTitulo(mode: CalendarMode, referencia: Date): string {
  if (mode === "month") {
    return formatMonthYear(referencia);
  }

  if (mode === "day") {
    return formatLongDay(referencia);
  }

  return `Semana de ${new Intl.DateTimeFormat("pt-BR", {
    day: "numeric",
    month: "long",
  }).format(referencia)}`;
}

export function CalendarioEfemerides() {
  const hoje = new Date();
  const calendarRef = useRef<FullCalendar | null>(null);

  const [diaSelecionado, setDiaSelecionado] = useState<string | null>(null);
  const [drawerAberto, setDrawerAberto] = useState(false);
  const [mode, setMode] = useState<CalendarMode>("month");
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

  const plannerById = useMemo(() => {
    const map = new Map<string, PlannerEvent>();
    for (const event of eventosFiltrados) {
      map.set(event.id, event);
    }
    return map;
  }, [eventosFiltrados]);

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

  const eventosCalendar = useMemo(
    () =>
      eventosFiltrados.map((event) => {
        const tipo = TONE_TO_TYPE[event.tone];
        const cores = EVENT_TYPE_COLORS[tipo];
        const startIso = toIsoDate(event.start);
        const sameDay = toIsoDate(event.start) === toIsoDate(event.end);

        return {
          id: event.id,
          title: event.title,
          start: startIso,
          end: sameDay ? undefined : toIsoDate(addDays(event.end, 1)),
          allDay: true,
          backgroundColor: event.channel === "personal" ? cores.surface : event.color,
          borderColor: event.channel === "personal" ? cores.primary : event.color,
          textColor: event.channel === "personal" ? cores.text : "hsl(var(--background))",
        };
      }),
    [eventosFiltrados],
  );

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

  function navegarCalendario(direcao: "prev" | "next") {
    const delta = direcao === "next" ? 1 : -1;

    if (mode === "day") {
      const next = addDays(cursor, delta);
      setCursor(next);
      syncMonthFromDate(next);
      return;
    }

    const api = calendarRef.current?.getApi();
    if (!api) {
      const next = mode === "week" ? addWeeks(cursor, delta) : addMonths(cursor, delta);
      setCursor(next);
      syncMonthFromDate(next);
      return;
    }

    if (direcao === "prev") {
      api.prev();
      return;
    }

    api.next();
  }

  function alterarView(novaView: CalendarMode) {
    setMode(novaView);
  }

  return (
    <section className="space-y-6 font-ubuntu">
      <header className="space-y-4">
        <div>
          <button
            type="button"
            onClick={() => setLearnMore((open) => !open)}
            className="text-xs tracking-[0.18em] text-muted-foreground uppercase transition-colors hover:text-foreground"
          >
            {learnMore ? "fechar" : "saiba mais"}
          </button>
          <AnimatePresence>
            {learnMore ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="mt-3 max-w-xl space-y-3 text-sm leading-relaxed text-muted-foreground"
              >
                <p>
                  Os trânsitos astrológicos em cada dia no seu mapa personalizado, diretamente na sua agenda. Ative para
                  receber os avisos no seu WhatsApp.
                </p>
                <p>
                  Ao saber a energia do dia, você saberá o melhor momento para avançar, decidir, aguardar ou encerrar.
                </p>
              </motion.div>
            ) : null}
          </AnimatePresence>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-ubuntu text-3xl font-black tracking-tight text-foreground capitalize">
            {formatarTitulo(mode, cursor)}
          </h2>
          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              variant={mode === "month" ? "default" : "outline"}
              onClick={() => alterarView("month")}
              className="text-xs tracking-widest uppercase"
            >
              Mensal
            </Button>
            <Button
              type="button"
              variant={mode === "week" ? "default" : "outline"}
              onClick={() => alterarView("week")}
              className="text-xs tracking-widest uppercase"
            >
              Semanal
            </Button>
            <Button
              type="button"
              variant={mode === "day" ? "default" : "outline"}
              onClick={() => alterarView("day")}
              className="text-xs tracking-widest uppercase"
            >
              Dia
            </Button>
            <Button
              type="button"
              variant={mode === "list" ? "default" : "outline"}
              onClick={() => alterarView("list")}
              className="text-xs tracking-widest uppercase sm:hidden"
            >
              Lista
            </Button>
            <Button type="button" variant="outline" size="icon-sm" onClick={() => navegarCalendario("prev")} aria-label="Periodo anterior">
              <ChevronLeft className="size-4" />
            </Button>
            <Button type="button" variant="outline" size="icon-sm" onClick={() => navegarCalendario("next")} aria-label="Proximo periodo">
              <ChevronRight className="size-4" />
            </Button>
          </div>
        </div>

        <FiltroEventos filtroAtivo={filtroAtivo} onChange={setFiltroAtivo} />
      </header>

      <div className="space-y-4 border border-border bg-background p-3 sm:p-4">
        {erroEventos ? (
          <div className="mb-3 border border-border bg-background p-4">
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
            key={mode}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
          >
            {mode === "day" ? (
              <DayView cursor={cursor} events={eventosFiltrados} onEventClick={setSelectedEvent} />
            ) : (
              <FullCalendar
                ref={calendarRef}
                plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin, listPlugin]}
                initialView={mode === "week" ? "timeGridWeek" : mode === "list" ? "listWeek" : "dayGridMonth"}
                initialDate={cursor}
                locale={ptBrLocale}
                headerToolbar={false}
                height="auto"
                events={eventosCalendar}
                dayMaxEvents={2}
                eventClick={(info) => {
                  const planner = plannerById.get(info.event.id);
                  if (planner) {
                    setSelectedEvent(planner);
                    return;
                  }
                  const data = info.event.startStr.slice(0, 10);
                  abrirDrawerData(data);
                }}
                dateClick={(info) => {
                  abrirDrawerData(info.dateStr);
                }}
                datesSet={(info) => {
                  const dataReferencia = info.view.currentStart;
                  setCursor(dataReferencia);
                  syncMonthFromDate(dataReferencia);
                }}
                dayCellDidMount={(info) => {
                  const dayIso = formatarDataLocalIso(info.date);

                  if (!diasComPrevisao.has(dayIso)) {
                    return;
                  }

                  if (info.el.querySelector(".prediction-history-marker")) {
                    return;
                  }

                  const marker = document.createElement("span");
                  marker.className = "prediction-history-marker";
                  marker.setAttribute("aria-label", "Dia com previsão pessoal");
                  marker.title = "Você já tem previsão pessoal neste dia";
                  marker.style.position = "absolute";
                  marker.style.right = "6px";
                  marker.style.bottom = "6px";
                  marker.style.width = "6px";
                  marker.style.height = "6px";
                  marker.style.borderRadius = "9999px";
                  marker.style.backgroundColor = EVENT_TYPE_COLORS.portal.primary;
                  marker.style.border = "2px solid hsl(var(--background))";

                  const frame = info.el as HTMLElement;
                  frame.style.position = "relative";
                  frame.appendChild(marker);
                }}
              />
            )}
          </motion.div>
        </AnimatePresence>

        {carregandoEventos ? <div className="mt-4 h-9 w-56 animate-pulse bg-muted" /> : null}
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
