"use client";

import { useMemo, useState } from "react";
import useSWR from "swr";

import { DataTable } from "@/components/admin/DataTable";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { EngineAuditLogItem } from "@/types/admin";

interface AdminLogsResponse {
  items: EngineAuditLogItem[];
  page: number;
  pageSize: number;
  total: number;
}

const PAGE_SIZE = 20;

const fetcher = async <T,>(url: string): Promise<T> => {
  const response = await fetch(url, { credentials: "include" });

  if (!response.ok) {
    throw new Error("Falha ao carregar logs.");
  }

  return (await response.json()) as T;
};

function formatDateInput(value: Date) {
  return `${value.getUTCFullYear()}-${String(value.getUTCMonth() + 1).padStart(2, "0")}-${String(value.getUTCDate()).padStart(2, "0")}`;
}

function humanizeCode(code: string | null) {
  const dictionary: Record<string, string> = {
    ASPECT_FOUND: "Sucesso: Aspecto Identificado",
    NO_RELEVANT_ASPECT_FOUND: "Busca Concluída: Sem Trânsitos",
    RETROGRADE_RETURN_FOUND: "Atenção: Planeta Retrógrado",
    CACHE_HIT: "Resposta em Cache",
    INSUFFICIENT_CREDITS: "Erro de Crédito",
    CREDIT_DEBIT_FAILED: "Erro de Crédito",
    PREDICTION_ENGINE_FAILED: "Falha no Motor",
    ENGINE_ERROR: "Falha no Motor",
  };

  if (!code) return "Sem código";
  return dictionary[code] ?? "Falha no Motor";
}

function renderStatusBadge(log: EngineAuditLogItem) {
  if (log.success) {
    return <Badge className="border-emerald-500/40 bg-emerald-500/15 text-emerald-300">Sucesso</Badge>;
  }

  if (log.engineCode === "INSUFFICIENT_CREDITS" || log.engineCode === "CREDIT_DEBIT_FAILED") {
    return <Badge className="border-amber-500/40 bg-amber-500/15 text-amber-300">Erro de Crédito</Badge>;
  }

  return <Badge variant="destructive">Falha no Motor</Badge>;
}

function summarizeSupportView(details: Record<string, unknown> | null) {
  if (!details || typeof details !== "object") {
    return "Sem detalhes relevantes";
  }

  const transitPlanet = typeof details.transitPlanet === "string" ? details.transitPlanet : undefined;
  const natalPlanet = typeof details.natalPlanet === "string" ? details.natalPlanet : undefined;
  const aspectAngle = typeof details.aspectAngle === "number" ? details.aspectAngle : undefined;

  const parts = [];

  if (transitPlanet) {
    parts.push(`Trânsito: ${transitPlanet}`);
  }

  if (natalPlanet) {
    parts.push(`Natal: ${natalPlanet}`);
  }

  if (aspectAngle !== undefined) {
    parts.push(`Ângulo: ${aspectAngle}°`);
  }

  return parts.length > 0 ? parts.join(" | ") : "Sem detalhes relevantes";
}

export default function AdminLogsPage() {
  const [page, setPage] = useState(1);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const queryString = useMemo(() => {
    const params = new URLSearchParams();
    params.set("page", String(page));
    params.set("pageSize", String(PAGE_SIZE));

    if (startDate && endDate) {
      params.set("startDate", startDate);
      params.set("endDate", endDate);
    }

    return params.toString();
  }, [endDate, page, startDate]);

  const { data, isLoading } = useSWR<AdminLogsResponse>(`/api/admin/logs?${queryString}`, fetcher, {
    revalidateOnFocus: true,
    dedupingInterval: 10000,
  });

  const logs = data?.items ?? [];
  const totalPages = Math.max(1, Math.ceil((data?.total ?? 0) / PAGE_SIZE));

  return (
    <div className="w-full space-y-6 px-4 py-6 md:px-8 md:py-8">
      <section className="space-y-1">
        <h1 className="font-display text-4xl tracking-tight">Logs de Atendimento</h1>
        <p className="text-sm text-muted-foreground">Histórico legível das previsões processadas pelo motor.</p>
      </section>

      <section className="space-y-4 border-t border-border/50 pt-4">
        <header className="space-y-1">
          <p className="text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground">Monitoramento</p>
          <h2 className="font-display text-2xl tracking-tight">Execuções recentes</h2>
        </header>
        <div className="space-y-4 border-b border-border/50 pb-4">
          <div className="flex flex-wrap items-end gap-3 border-b border-border/50 pb-3">
            <div>
              <p className="mb-1 text-xs font-medium uppercase tracking-[0.08em] text-muted-foreground">Início</p>
              <Input type="date" value={startDate} onChange={(event) => setStartDate(event.target.value)} />
            </div>
            <div>
              <p className="mb-1 text-xs font-medium uppercase tracking-[0.08em] text-muted-foreground">Fim</p>
              <Input type="date" value={endDate} onChange={(event) => setEndDate(event.target.value)} />
            </div>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                const end = new Date();
                const start = new Date();
                start.setUTCDate(start.getUTCDate() - 6);
                setStartDate(formatDateInput(start));
                setEndDate(formatDateInput(end));
                setPage(1);
              }}
            >
              Últimos 7 dias
            </Button>
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                setStartDate("");
                setEndDate("");
                setPage(1);
              }}
            >
              Limpar
            </Button>
          </div>

          {isLoading ? <div className="h-16 animate-pulse rounded-md bg-muted/30" /> : null}

          <DataTable
            rows={logs}
            emptyMessage="Nenhum log registrado no momento."
            columns={[
              {
                key: "status",
                header: "Status",
                render: (row) => renderStatusBadge(row),
              },
              {
                key: "tema",
                header: "Tema",
                render: (row) => <span className="text-sm text-foreground">{row.theme ?? "-"}</span>,
              },
              {
                key: "resultado",
                header: "Resultado",
                render: (row) => <span className="text-sm text-foreground">{humanizeCode(row.engineCode)}</span>,
              },
              {
                key: "tempo",
                header: "Tempo",
                render: (row) => <span className="text-sm text-foreground">{row.executionTimeMs != null ? `${row.executionTimeMs} ms` : "-"}</span>,
              },
              {
                key: "detalhes",
                header: "Contexto",
                render: (row) => <span className="text-sm text-muted-foreground">{summarizeSupportView(row.technicalDetails)}</span>,
              },
              {
                key: "data",
                header: "Criado em",
                render: (row) => (
                  <span className="text-sm text-muted-foreground">
                    {new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" }).format(new Date(row.createdAt))}
                  </span>
                ),
              },
            ]}
          />

          <div className="flex items-center justify-between gap-2 border-t border-border/50 pt-3">
            <p className="text-sm text-muted-foreground">
              Página {page} de {totalPages}
            </p>
            <div className="flex items-center gap-2">
              <Button type="button" variant="outline" onClick={() => setPage((current) => Math.max(1, current - 1))} disabled={page <= 1}>
                Anterior
              </Button>
              <Button type="button" variant="outline" onClick={() => setPage((current) => Math.min(totalPages, current + 1))} disabled={page >= totalPages}>
                Próxima
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
