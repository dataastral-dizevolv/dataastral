"use client";

import { useMemo, useState } from "react";
import useSWR, { useSWRConfig } from "swr";
import { toast } from "sonner";

import { AlertTriangle } from "lucide-react";

import { DataTable } from "@/components/admin/DataTable";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { toUserFacingMessage } from "@/lib/errors/user-facing";
import type { AdminUserRow } from "@/types/admin";

interface AdminUsersResponse {
  items: AdminUserRow[];
  page: number;
  pageSize: number;
  total: number;
}

const PAGE_SIZE = 15;

const fetcher = async <T,>(url: string): Promise<T> => {
  const response = await fetch(url, { credentials: "include" });

  if (!response.ok) {
    throw new Error("Falha ao carregar usuários.");
  }

  return (await response.json()) as T;
};

function formatDateInput(value: Date) {
  return `${value.getUTCFullYear()}-${String(value.getUTCMonth() + 1).padStart(2, "0")}-${String(value.getUTCDate()).padStart(2, "0")}`;
}

export default function AdminUsersPage() {
  const { mutate } = useSWRConfig();
  const [page, setPage] = useState(1);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [deactivatingUser, setDeactivatingUser] = useState<AdminUserRow | null>(null);

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

  const key = `/api/admin/users?${queryString}`;
  const { data, isLoading } = useSWR<AdminUsersResponse>(key, fetcher, { revalidateOnFocus: true, dedupingInterval: 8000 });

  const users = data?.items ?? [];
  const totalPages = Math.max(1, Math.ceil((data?.total ?? 0) / PAGE_SIZE));

  async function handleAddCredits(userId: string, amount: number) {
    try {
      const response = await fetch("/api/admin/users/credits", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, amount }),
      });

      const payload = (await response.json()) as { error?: string };

      if (!response.ok) {
        toast.error(toUserFacingMessage(payload, "Não foi possível adicionar créditos."));
        return;
      }

      toast.success(`+${amount} crédito(s) adicionados.`);
      await mutate(key);
    } catch {
      toast.error("Falha de conexão ao atualizar créditos.");
    }
  }

  async function confirmDeactivate() {
    if (!deactivatingUser) {
      return;
    }

    try {
      const response = await fetch("/api/admin/users/deactivate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: deactivatingUser.id }),
      });

      const payload = (await response.json()) as { error?: string };

      if (!response.ok) {
        toast.error(toUserFacingMessage(payload, "Não foi possível desativar usuário."));
        return;
      }

      toast.success("Usuário desativado com sucesso.");
      setDeactivatingUser(null);
      await mutate(key);
    } catch {
      toast.error("Falha de conexão ao desativar usuário.");
    }
  }

  return (
    <div className="w-full space-y-8 px-4 py-6 md:px-8 md:py-8">
      <section className="space-y-1 border-b border-border/70 pb-4">
        <h1 className="font-display text-4xl tracking-tight">Usuários</h1>
        <p className="text-sm text-muted-foreground">Gestão de acessos, perfil astral e créditos.</p>
      </section>

      <section className="space-y-4">
        <header className="border-b border-border/70 pb-3">
          <h2 className="font-display text-2xl tracking-tight">Base de usuários</h2>
        </header>
        <div className="space-y-4">
          <div className="flex flex-wrap items-end gap-3 border-b border-border/70 pb-4">
            <div>
              <p className="mb-1 text-xs text-muted-foreground">Início</p>
              <Input type="date" value={startDate} onChange={(event) => setStartDate(event.target.value)} />
            </div>
            <div>
              <p className="mb-1 text-xs text-muted-foreground">Fim</p>
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
            rows={users}
            emptyMessage="Nenhum usuário encontrado."
            columns={[
              {
                key: "nome",
                header: "Usuário",
                render: (row) => (
                  <div>
                    <p className="text-sm text-foreground">{row.fullName ?? "Sem nome"}</p>
                    <p className="font-mono-iris text-[0.65rem] uppercase tracking-widest text-muted-foreground">{row.id}</p>
                  </div>
                ),
              },
              {
                key: "status",
                header: "Status",
                render: (row) => (
                  <Badge variant={row.active ? "default" : "destructive"}>{row.active ? "Ativo" : "Desativado"}</Badge>
                ),
              },
              {
                key: "perfil",
                header: "Perfil Astral",
                render: (row) => (
                  <Badge className={row.birthDate && row.birthTimezone ? "border-emerald-500/40 bg-emerald-500/15 text-emerald-300" : "border-amber-500/40 bg-amber-500/15 text-amber-300"}>
                    {row.birthDate && row.birthTimezone ? "Completo" : "Incompleto"}
                  </Badge>
                ),
              },
              {
                key: "credits",
                header: "Créditos",
                render: (row) => <span className="font-semibold text-foreground">{row.credits}</span>,
              },
              {
                key: "actions",
                header: "Ações",
                render: (row) => (
                  <div className="flex flex-wrap items-center gap-2">
                    <Button type="button" size="sm" variant="outline" onClick={() => void handleAddCredits(row.id, 1)} disabled={!row.active} aria-label={`Adicionar 1 crédito para ${row.fullName ?? "usuário"}`}>
                      +1
                    </Button>
                    <Button type="button" size="sm" variant="outline" onClick={() => void handleAddCredits(row.id, 3)} disabled={!row.active} aria-label={`Adicionar 3 créditos para ${row.fullName ?? "usuário"}`}>
                      +3
                    </Button>
                    <Button type="button" size="sm" variant="outline" onClick={() => void handleAddCredits(row.id, 5)} disabled={!row.active} aria-label={`Adicionar 5 créditos para ${row.fullName ?? "usuário"}`}>
                      +5
                    </Button>
                    <Button type="button" size="sm" variant="destructive" onClick={() => setDeactivatingUser(row)} disabled={!row.active} className="border border-destructive/60">
                      <AlertTriangle size={14} className="mr-1" />
                      Desativar
                    </Button>
                  </div>
                ),
              },
            ]}
          />

          <div className="flex items-center justify-between gap-2 border-t border-border/70 pt-3">
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

      <Dialog open={Boolean(deactivatingUser)} onOpenChange={(open) => (!open ? setDeactivatingUser(null) : null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar desativação de usuário</DialogTitle>
            <DialogDescription>
              Esta ação bloqueia o acesso à plataforma e o uso da calculadora para este usuário.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => setDeactivatingUser(null)}>
              Cancelar
            </Button>
            <Button type="button" variant="destructive" onClick={() => void confirmDeactivate()}>
              Confirmar desativação
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
