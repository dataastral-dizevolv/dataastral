"use client";

import { useMemo, useRef, useState } from "react";
import Link from "next/link";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";
import timeGridPlugin from "@fullcalendar/timegrid";
import ptBrLocale from "@fullcalendar/core/locales/pt-br";
import { ChevronLeft, ChevronRight } from "lucide-react";
import useSWR from "swr";

import { FiltroEventos } from "@/components/dashboard/FiltroEventos";
import { PrevisaoDrawer } from "@/components/dashboard/PrevisaoDrawer";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EVENT_TYPE_COLORS } from "@/lib/theme/event-colors";
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

function formatarDataLocalIso(data: Date) {
  const ano = data.getFullYear();
  const mes = String(data.getMonth() + 1).padStart(2, "0");
  const dia = String(data.getDate()).padStart(2, "0");
  return `${ano}-${mes}-${dia}`;
}

function formatarTitulo(
  view: "dayGridMonth" | "timeGridWeek",
  referencia: Date,
): string {
  if (view === "dayGridMonth") {
    return new Intl.DateTimeFormat("pt-BR", {
      month: "long",
      year: "numeric",
    }).format(referencia);
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
  const [view, setView] = useState<"dayGridMonth" | "timeGridWeek">("dayGridMonth");
  const [filtroAtivo, setFiltroAtivo] = useState<EphemerisEventType | "todos">("todos");
  const [referenciaTitulo, setReferenciaTitulo] = useState(hoje);
  const [mesSelecionado, setMesSelecionado] = useState({
    year: hoje.getFullYear(),
    month: hoje.getMonth() + 1,
  });

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

  const eventosFiltrados = useMemo(() => {
    const lista = eventos ?? [];

    if (filtroAtivo === "todos") {
      return lista;
    }

    return lista.filter((evento) => evento.tipo === filtroAtivo);
  }, [eventos, filtroAtivo]);

  const eventosCalendar = useMemo(
    () =>
      eventosFiltrados.map((evento) => {
        const cores = EVENT_TYPE_COLORS[evento.tipo];

        return {
          id: evento.id,
          title: evento.titulo,
          start: evento.data,
          allDay: true,
          backgroundColor: cores.surface,
          borderColor: cores.primary,
          textColor: cores.text,
          extendedProps: {
            tipo: evento.tipo,
          },
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

  function abrirDrawerData(data: string) {
    setDiaSelecionado(data);
    setDrawerAberto(true);
  }

  function navegarCalendario(direcao: "prev" | "next") {
    const api = calendarRef.current?.getApi();
    if (!api) {
      return;
    }

    if (direcao === "prev") {
      api.prev();
      return;
    }

    api.next();
  }

  function alterarView(novaView: "dayGridMonth" | "timeGridWeek") {
    setView(novaView);
    const api = calendarRef.current?.getApi();
    api?.changeView(novaView);
  }

  return (
    <section className="space-y-4">
      <header className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="font-display text-3xl tracking-tight capitalize text-foreground">
            {formatarTitulo(view, referenciaTitulo)}
          </h1>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant={view === "dayGridMonth" ? "default" : "outline"}
              onClick={() => alterarView("dayGridMonth")}
              className="text-xs uppercase tracking-widest"
            >
              Mensal
            </Button>
            <Button
              type="button"
              variant={view === "timeGridWeek" ? "default" : "outline"}
              onClick={() => alterarView("timeGridWeek")}
              className="text-xs uppercase tracking-widest"
            >
              Semanal
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

      <Card className="border border-border bg-card p-4 shadow-none">
        {erroEventos ? (
          <div className="mb-3 rounded-xl border border-border bg-muted/30 p-4">
            <p className="text-sm text-destructive">
              {faltamDadosNatais
                ? "Para ver seu calendário personalizado, complete seus dados de nascimento no Perfil."
                : "Não foi possível carregar efemérides deste período."}
            </p>
            {faltamDadosNatais ? (
              <Button asChild variant="outline" size="sm" className="mt-3 border-iris-accent/40 text-iris-accent hover:bg-iris-accent/10">
                <Link href="/perfil">Completar perfil astral</Link>
              </Button>
            ) : null}
          </div>
        ) : null}
        <FullCalendar
          ref={calendarRef}
          plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
          initialView="dayGridMonth"
          locale={ptBrLocale}
          headerToolbar={false}
          height="auto"
          events={eventosCalendar}
          dayMaxEvents={2}
          eventClick={(info) => {
            const data = info.event.startStr.slice(0, 10);
            abrirDrawerData(data);
          }}
          dateClick={(info) => {
            abrirDrawerData(info.dateStr);
          }}
          datesSet={(info) => {
            const dataReferencia = info.view.currentStart;
            setReferenciaTitulo(dataReferencia);

            const ano = dataReferencia.getFullYear();
            const mes = dataReferencia.getMonth() + 1;

            if (ano !== mesSelecionado.year || mes !== mesSelecionado.month) {
              setMesSelecionado({ year: ano, month: mes });
            }
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
            marker.style.boxShadow = "0 0 0 2px hsl(var(--card))";

            const frame = info.el as HTMLElement;
            frame.style.position = "relative";
            frame.appendChild(marker);
          }}
        />
        {carregandoEventos ? (
          <div className="mt-4 h-9 w-56 animate-pulse rounded-md bg-muted" />
        ) : null}
      </Card>

      <PrevisaoDrawer
        aberto={drawerAberto}
        onFechar={() => setDrawerAberto(false)}
        data={diaSelecionado}
        eventos={eventosDiaSelecionado}
        previsao={previsaoDiaSelecionado}
        missingBirthData={faltamDadosNatais}
      />
    </section>
  );
}
