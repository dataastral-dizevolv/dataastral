"use client";

import { useMemo, useState } from "react";
import useSWR, { useSWRConfig } from "swr";
import { toast } from "sonner";

import { DataTable } from "@/components/admin/DataTable";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { AdminCreditPackage } from "@/types/admin";

interface AdminCreditPackagesResponse {
  items: AdminCreditPackage[];
}

const KEY = "/api/admin/credit-packages";

const fetcher = async <T,>(url: string): Promise<T> => {
  const response = await fetch(url, { credentials: "include" });

  if (!response.ok) {
    throw new Error("Falha ao carregar pacotes de créditos.");
  }

  return (await response.json()) as T;
};

type EditState = {
  packageId: string;
  packageLabel: string;
  packageCredits: number;
  priceReais: string;
  isActive: boolean;
  originalPriceCents: number;
};

const initialEditState: EditState = {
  packageId: "",
  packageLabel: "",
  packageCredits: 0,
  priceReais: "",
  isActive: true,
  originalPriceCents: 0,
};

function formatCurrency(cents: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(cents / 100);
}

function formatReaisInput(cents: number) {
  return (cents / 100).toFixed(2);
}

function parseReaisToCents(value: string) {
  const normalized = value.replace(",", ".").trim();
  const parsed = Number(normalized);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return null;
  }

  return Math.round(parsed * 100);
}

export default function AdminPrecosPage() {
  const { mutate } = useSWRConfig();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editState, setEditState] = useState<EditState>(initialEditState);

  const { data, isLoading } = useSWR<AdminCreditPackagesResponse>(KEY, fetcher, {
    revalidateOnFocus: true,
    dedupingInterval: 5000,
  });

  const packages = useMemo(() => data?.items ?? [], [data?.items]);

  const summary = useMemo(() => {
    const active = packages.filter((item) => item.isActive).length;
    const inactive = packages.filter((item) => !item.isActive).length;
    return {
      total: packages.length,
      active,
      inactive,
    };
  }, [packages]);

  function openEditModal(item: AdminCreditPackage) {
    setEditState({
      packageId: item.id,
      packageLabel: item.label,
      packageCredits: item.credits,
      priceReais: formatReaisInput(item.priceCents),
      isActive: item.isActive,
      originalPriceCents: item.priceCents,
    });
    setIsModalOpen(true);
  }

  function closeEditModal() {
    setIsModalOpen(false);
    setIsSaving(false);
    setEditState(initialEditState);
  }

  async function handleSave(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!editState.packageId) {
      toast.error("Selecione um pacote para editar.");
      return;
    }

    const parsedPriceCents = parseReaisToCents(editState.priceReais);
    if (parsedPriceCents === null) {
      toast.error("Informe um valor válido em reais.");
      return;
    }

    setIsSaving(true);

    try {
      const response = await fetch(`/api/admin/credit-packages/${editState.packageId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          priceCents: parsedPriceCents,
          isActive: editState.isActive,
        }),
      });

      await response.json().catch(() => ({}));
      if (!response.ok) {
        toast.error("Não foi possível atualizar este pacote agora.");
        return;
      }

      toast.success("Valor atualizado com sucesso.");
      await mutate(KEY);
      closeEditModal();
    } catch {
      toast.error("Falha de conexão ao atualizar pacote.");
    } finally {
      setIsSaving(false);
    }
  }

  const priceChanged = parseReaisToCents(editState.priceReais) !== editState.originalPriceCents;

  return (
    <div className="w-full space-y-8 px-4 py-6 font-sans md:px-8 md:py-8">
      <section className="space-y-1 border-b border-border/70 pb-4">
        <h1 className="font-display text-4xl tracking-tight">Preços e Pacotes</h1>
        <p className="text-sm text-muted-foreground">Atualize valores e status de venda sem fricção técnica.</p>
      </section>

      <section className="grid grid-cols-1 gap-4 border-b border-border/70 pb-6 sm:grid-cols-3">
        <div className="space-y-2 border-b border-border/70 pb-4 sm:border-b-0 sm:border-r sm:pr-4">
            <p className="font-mono-iris text-[0.65rem] uppercase tracking-widest text-muted-foreground">Pacotes</p>
            <p className="mt-2 font-display text-3xl tracking-tight">{summary.total}</p>
        </div>
        <div className="space-y-2 border-b border-border/70 pb-4 sm:border-b-0 sm:border-r sm:pr-4">
            <p className="font-mono-iris text-[0.65rem] uppercase tracking-widest text-muted-foreground">Ativos</p>
            <p className="mt-2 font-display text-3xl tracking-tight">{summary.active}</p>
        </div>
        <div className="space-y-2">
            <p className="font-mono-iris text-[0.65rem] uppercase tracking-widest text-muted-foreground">Inativos</p>
            <p className="mt-2 font-display text-3xl tracking-tight">{summary.inactive}</p>
        </div>
      </section>

      <section className="space-y-4">
        <header className="border-b border-border/70 pb-3">
          <h2 className="font-display text-2xl tracking-tight">Pacotes disponíveis</h2>
        </header>
        <div className="space-y-4">
            {isLoading ? <div className="h-24 animate-pulse rounded-md bg-muted/30" /> : null}

            {!isLoading ? (
              <DataTable
                rows={packages}
                emptyMessage="Nenhum pacote cadastrado."
                columns={[
                  {
                    key: "package",
                    header: "Pacote",
                    render: (row) => <span className="font-medium">{row.label}</span>,
                  },
                  {
                    key: "credits",
                    header: "Quantidade",
                    render: (row) => <span>{row.credits} créditos</span>,
                  },
                  {
                    key: "price",
                    header: "Valor do Pacote",
                    render: (row) => <span>{formatCurrency(row.priceCents)}</span>,
                  },
                  {
                    key: "status",
                    header: "Status de Venda",
                    render: (row) => <Badge variant={row.isActive ? "default" : "secondary"}>{row.isActive ? "Ativo" : "Inativo"}</Badge>,
                  },
                  {
                    key: "action",
                    header: "Ação",
                    render: (row) => (
                      <Button type="button" variant="outline" size="sm" onClick={() => openEditModal(row)}>
                        Editar
                      </Button>
                    ),
                  },
                ]}
              />
            ) : null}
          </div>
      </section>

      <Dialog open={isModalOpen} onOpenChange={(open) => (open ? setIsModalOpen(true) : closeEditModal())}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Atualizar Valor</DialogTitle>
            <DialogDescription className="sr-only">Edite o nome e valor do pacote de créditos</DialogDescription>
          </DialogHeader>

          <form className="space-y-4" onSubmit={(event) => void handleSave(event)}>
            <div className="space-y-2">
              <Label>Nome do Pacote</Label>
              <p className="rounded-md border border-border px-3 py-2 text-sm text-foreground">{editState.packageLabel || "-"}</p>
            </div>

            <div className="space-y-2">
              <Label>Quantidade de Créditos</Label>
              <p className="rounded-md border border-border px-3 py-2 text-sm text-foreground">{editState.packageCredits} créditos</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="package-price-modal">Valor do Pacote (R$)</Label>
              <Input
                id="package-price-modal"
                type="number"
                min={0.01}
                step={0.01}
                value={editState.priceReais}
                onChange={(event) => setEditState((prev) => ({ ...prev, priceReais: event.target.value }))}
                disabled={isSaving}
              />
            </div>

            <div className="flex items-center justify-between rounded-md border border-border px-3 py-2">
              <div>
                <p className="text-sm font-medium">Status de Venda</p>
                <p className="text-xs text-muted-foreground">Defina se o pacote aparece para compra.</p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={editState.isActive}
                onClick={() => setEditState((prev) => ({ ...prev, isActive: !prev.isActive }))}
                disabled={isSaving}
                className={`relative inline-flex h-6 w-11 items-center rounded-md border border-border transition-colors ${
                  editState.isActive ? "bg-primary" : "bg-muted"
                } ${isSaving ? "opacity-60" : ""}`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-sm bg-foreground transition-transform ${
                    editState.isActive ? "translate-x-6" : "translate-x-1"
                  }`}
                />
              </button>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={closeEditModal} disabled={isSaving}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isSaving}>
                {isSaving ? (priceChanged ? "Sincronizando..." : "Salvando...") : "Atualizar Valor"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
