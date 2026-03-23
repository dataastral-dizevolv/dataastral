"use client";

import { useMemo, useState } from "react";
import useSWR from "swr";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { AdminDashboardMetrics } from "@/types/admin";

type DashboardRange = "7d" | "30d" | "90d";

const fetcher = async <T,>(url: string): Promise<T> => {
  const response = await fetch(url, { credentials: "include" });

  if (!response.ok) {
    throw new Error("Falha ao carregar indicadores.");
  }

  return (await response.json()) as T;
};

function formatDayLabel(value: string) {
  return new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "2-digit" }).format(new Date(`${value}T00:00:00.000Z`));
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
}

function formatInteger(value: number) {
  return new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 0 }).format(value);
}

function formatDelta(value: number | null) {
  if (value === null) return "Sem base comparativa";
  const signal = value >= 0 ? "+" : "";
  return `${signal}${value.toFixed(1)}% vs período anterior`;
}

function RangeTooltip({ active, payload, label, metricLabel }: { active?: boolean; payload?: Array<{ value: number }>; label?: string; metricLabel: string }) {
  if (!active || !payload || payload.length === 0) {
    return null;
  }

  return (
    <div className="rounded-lg border border-border bg-card px-3 py-2 shadow-lg">
      <p className="text-xs text-muted-foreground">Data: {label}</p>
      <p className="text-sm text-foreground">{metricLabel}: {formatInteger(payload[0]?.value ?? 0)}</p>
    </div>
  );
}

export default function AdminDashboardPage() {
  const [range, setRange] = useState<DashboardRange>("7d");

  const { data, isLoading, isValidating } = useSWR<AdminDashboardMetrics>(`/api/admin/dashboard/metrics?range=${range}`, fetcher, {
    revalidateOnFocus: true,
    dedupingInterval: 15000,
    keepPreviousData: true,
  });

  const signupChartData = useMemo(
    () =>
      (data?.signupSeries ?? []).map((item) => ({
        ...item,
        label: formatDayLabel(item.date),
      })),
    [data?.signupSeries],
  );

  const salesChartData = useMemo(
    () =>
      (data?.salesSeries ?? []).map((item) => ({
        ...item,
        label: formatDayLabel(item.date),
      })),
    [data?.salesSeries],
  );

  const hasSignupActivity = signupChartData.some((item) => item.count > 0);
  const hasSalesActivity = salesChartData.some((item) => item.count > 0);

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6 px-4 py-6 md:px-8 md:py-8">
      <section className="space-y-1">
        <h1 className="font-display text-4xl tracking-tight">Inteligência de Operação</h1>
        <p className="text-sm text-muted-foreground">Indicadores de receita, crescimento de base e performance comercial.</p>
      </section>

      <section className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Card className="border border-border py-0 shadow-none">
          <CardContent className="p-5">
            <p className="font-mono-iris text-[0.65rem] uppercase tracking-widest text-muted-foreground">Receita Bruta</p>
            <p className="mt-2 font-display text-3xl tracking-tight">{isLoading ? "..." : formatCurrency(data?.grossRevenue ?? 0)}</p>
            <p className="mt-1 text-xs text-muted-foreground">{formatDelta(data?.deltas.revenuePercent ?? null)}</p>
          </CardContent>
        </Card>

        <Card className="border border-border py-0 shadow-none">
          <CardContent className="p-5">
            <p className="font-mono-iris text-[0.65rem] uppercase tracking-widest text-muted-foreground">Volume de Vendas</p>
            <p className="mt-2 font-display text-3xl tracking-tight">{isLoading ? "..." : formatInteger(data?.salesVolume ?? 0)}</p>
            <p className="mt-1 text-xs text-muted-foreground">{formatDelta(data?.deltas.salesPercent ?? null)}</p>
          </CardContent>
        </Card>

        <Card className="border border-border py-0 shadow-none">
          <CardContent className="p-5">
            <p className="font-mono-iris text-[0.65rem] uppercase tracking-widest text-muted-foreground">Créditos em Circulação</p>
            <p className="mt-2 font-display text-3xl tracking-tight">{isLoading ? "..." : formatInteger(data?.creditsInCirculation ?? 0)}</p>
            <p className="mt-1 text-xs text-muted-foreground">{formatDelta(data?.deltas.creditsPercent ?? null)}</p>
          </CardContent>
        </Card>
      </section>

      <div className="flex justify-end">
        <Select value={range} onValueChange={(value) => setRange(value as DashboardRange)}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Período" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7d">7 dias</SelectItem>
            <SelectItem value="30d">30 dias</SelectItem>
            <SelectItem value="90d">90 dias</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <section className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card className="border border-border py-0 shadow-none">
          <CardHeader className="p-5">
            <CardTitle className="font-display text-2xl tracking-tight">Crescimento de Base</CardTitle>
          </CardHeader>
          <CardContent className="relative p-5 pt-0">
            {isLoading ? (
              <div className="h-72 animate-pulse rounded-lg bg-muted" />
            ) : !hasSignupActivity ? (
              <div className="flex h-72 items-center justify-center rounded-xl border border-dashed border-border bg-muted/20 px-6 text-center text-sm text-muted-foreground">
                Nenhuma atividade registrada neste período.
              </div>
            ) : (
              <div className="h-72 w-full rounded-xl border border-border bg-muted/20 p-3">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={signupChartData} margin={{ top: 12, right: 10, left: 0, bottom: 4 }}>
                    <defs>
                      <linearGradient id="signupAreaGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(228 82% 62%)" stopOpacity={0.36} />
                        <stop offset="95%" stopColor="hsl(228 82% 62%)" stopOpacity={0.04} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid stroke="hsl(var(--border) / 0.35)" strokeDasharray="2 4" vertical={false} />
                    <XAxis dataKey="label" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} axisLine={false} tickLine={false} />
                    <YAxis allowDecimals={false} tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} axisLine={false} tickLine={false} width={28} />
                    <Tooltip content={<RangeTooltip metricLabel="Novos Usuários" />} />
                    <Area type="monotone" dataKey="count" stroke="hsl(228 82% 62%)" fill="url(#signupAreaGradient)" strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border border-border py-0 shadow-none">
          <CardHeader className="p-5">
            <CardTitle className="font-display text-2xl tracking-tight">Performance de Vendas</CardTitle>
          </CardHeader>
          <CardContent className="relative p-5 pt-0">
            {isLoading ? (
              <div className="h-72 animate-pulse rounded-lg bg-muted" />
            ) : !hasSalesActivity ? (
              <div className="flex h-72 items-center justify-center rounded-xl border border-dashed border-border bg-muted/20 px-6 text-center text-sm text-muted-foreground">
                Nenhuma atividade registrada neste período.
              </div>
            ) : (
              <div className="h-72 w-full rounded-xl border border-border bg-muted/20 p-3">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={salesChartData} margin={{ top: 12, right: 10, left: 0, bottom: 4 }}>
                    <CartesianGrid stroke="hsl(var(--border) / 0.35)" strokeDasharray="2 4" vertical={false} />
                    <XAxis dataKey="label" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} axisLine={false} tickLine={false} />
                    <YAxis allowDecimals={false} tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} axisLine={false} tickLine={false} width={28} />
                    <Tooltip content={<RangeTooltip metricLabel="Vendas" />} />
                    <Bar dataKey="count" fill="hsl(var(--iris-accent))" radius={[6, 6, 0, 0]} maxBarSize={22} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>
      </section>

      {isValidating && !isLoading ? (
        <p className="text-xs text-muted-foreground">Atualizando dados do período selecionado...</p>
      ) : null}
    </div>
  );
}
