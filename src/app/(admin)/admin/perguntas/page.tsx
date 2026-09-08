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
import { Textarea } from "@/components/ui/textarea";
import {
  CALCULATOR_CATEGORY_LABELS,
  CALCULATOR_CATEGORY_VALUES,
  type CalculatorCategory,
} from "@/lib/calculator-categories";
import { toUserFacingMessage } from "@/lib/errors/user-facing";
import type { AdminCalculatorQuestion, AdminCalculatorQuestionType } from "@/types/admin";

interface AdminCalculatorQuestionsResponse {
  items: AdminCalculatorQuestion[];
}

const fetcher = async <T,>(url: string): Promise<T> => {
  const response = await fetch(url, { credentials: "include" });

  if (!response.ok) {
    throw new Error("Falha ao carregar perguntas.");
  }

  return (await response.json()) as T;
};

function tipoPerguntaLabel(tipo: AdminCalculatorQuestionType) {
  if (tipo === "text") return "Texto livre";
  if (tipo === "select") return "Seleção única";
  return "Múltipla escolha";
}

function toOptionsText(options: Array<{ value: string; label: string }>) {
  return options.map((option) => (option.value === option.label ? option.value : `${option.value}|${option.label}`)).join("\n");
}

function parseOptionsText(value: string) {
  return value
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .map((line) => {
      const [rawValue, rawLabel] = line.split("|");
      const parsedValue = (rawValue ?? "").trim();
      const parsedLabel = (rawLabel ?? rawValue ?? "").trim();
      return {
        value: parsedValue,
        label: parsedLabel || parsedValue,
      };
    })
    .filter((option) => option.value.length > 0 && option.label.length > 0);
}

type FormState = {
  id: number | null;
  category: CalculatorCategory;
  pergunta: string;
  tipo: AdminCalculatorQuestionType;
  opcoesTexto: string;
  prioridade: string;
  obrigatoria: boolean;
  ativa: boolean;
};

const initialFormState: FormState = {
  id: null,
  category: "amor",
  pergunta: "",
  tipo: "text",
  opcoesTexto: "",
  prioridade: "100",
  obrigatoria: false,
  ativa: true,
};

export default function AdminPerguntasPage() {
  const { mutate } = useSWRConfig();
  const [form, setForm] = useState<FormState>(initialFormState);
  const [filtroCategoria, setFiltroCategoria] = useState<"todas" | CalculatorCategory>("todas");
  const [isSaving, setIsSaving] = useState(false);
  const [deletingQuestion, setDeletingQuestion] = useState<AdminCalculatorQuestion | null>(null);

  const key = useMemo(() => {
    const params = new URLSearchParams();
    if (filtroCategoria !== "todas") {
      params.set("category", filtroCategoria);
    }
    const query = params.toString();
    return query.length > 0 ? `/api/admin/calculator-questions?${query}` : "/api/admin/calculator-questions";
  }, [filtroCategoria]);

  const { data, isLoading } = useSWR<AdminCalculatorQuestionsResponse>(key, fetcher, {
    revalidateOnFocus: true,
    dedupingInterval: 5000,
  });

  const questions = useMemo(() => data?.items ?? [], [data?.items]);
  const isSelectionType = form.tipo === "select" || form.tipo === "checkbox";
  const nativeSelectStyle = useMemo(
    () => ({ color: "hsl(var(--foreground))", backgroundColor: "hsl(var(--background))" }),
    [],
  );

  const summary = {
    total: questions.length,
    obrigatorias: questions.filter((item) => item.isRequired).length,
    ativas: questions.filter((item) => item.isActive).length,
  };

  function resetForm() {
    setForm(initialFormState);
  }

  function loadQuestionToForm(item: AdminCalculatorQuestion) {
    setForm({
      id: item.id,
      category: item.category,
      pergunta: item.label,
      tipo: item.type,
      opcoesTexto: toOptionsText(item.options),
      prioridade: String(item.order),
      obrigatoria: item.isRequired,
      ativa: item.isActive,
    });
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSaving(true);

    const opcoes = parseOptionsText(form.opcoesTexto);
    if (isSelectionType && opcoes.length === 0) {
      toast.error("Perguntas de seleção exigem opções válidas.");
      setIsSaving(false);
      return;
    }

    const payload = {
      category: form.category,
      label: form.pergunta,
      type: form.tipo,
      options: opcoes,
      order: Number(form.prioridade || "100"),
      isRequired: form.obrigatoria,
      isActive: form.ativa,
    };

    try {
      const url = form.id ? `/api/admin/calculator-questions/${form.id}` : "/api/admin/calculator-questions";
      const method = form.id ? "PATCH" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const body = (await response.json()) as { error?: string };
      if (!response.ok) {
        toast.error(toUserFacingMessage(body, "Não foi possível salvar a pergunta."));
        return;
      }

      toast.success(form.id ? "Pergunta atualizada." : "Pergunta criada.");
      resetForm();
      await Promise.all([mutate(key), mutate((cacheKey) => typeof cacheKey === "string" && cacheKey.startsWith("/api/calculator/questions"))]);
    } catch {
      toast.error("Falha de conexão ao salvar pergunta.");
    } finally {
      setIsSaving(false);
    }
  }

  async function confirmDelete() {
    if (!deletingQuestion) return;

    try {
      const response = await fetch(`/api/admin/calculator-questions/${deletingQuestion.id}`, {
        method: "DELETE",
      });
      const body = (await response.json()) as { error?: string };

      if (!response.ok) {
        toast.error(toUserFacingMessage(body, "Não foi possível remover a pergunta."));
        return;
      }

      toast.success("Pergunta removida com segurança.");
      setDeletingQuestion(null);
      await Promise.all([mutate(key), mutate((cacheKey) => typeof cacheKey === "string" && cacheKey.startsWith("/api/calculator/questions"))]);
      if (form.id === deletingQuestion.id) {
        resetForm();
      }
    } catch {
      toast.error("Falha de conexão ao remover pergunta.");
    }
  }

  return (
    <div className="w-full space-y-8 px-4 py-6 font-sans md:px-8 md:py-8">
      <section className="space-y-1 border-b border-border/70 pb-4">
        <h1 className="font-display text-4xl tracking-tight">Perguntas por Pilar</h1>
        <p className="text-sm text-muted-foreground">Gestão das perguntas dinâmicas por categoria oficial do produto.</p>
      </section>

      <section className="grid grid-cols-1 gap-4 border-b border-border/70 pb-6 sm:grid-cols-3">
        <div className="space-y-2 border-b border-border/70 pb-4 sm:border-b-0 sm:border-r sm:pr-4">
            <p className="font-mono-iris text-[0.65rem] uppercase tracking-widest text-muted-foreground">Perguntas</p>
            <p className="mt-2 font-display text-3xl tracking-tight">{summary.total}</p>
        </div>
        <div className="space-y-2 border-b border-border/70 pb-4 sm:border-b-0 sm:border-r sm:pr-4">
            <p className="font-mono-iris text-[0.65rem] uppercase tracking-widest text-muted-foreground">Obrigatórias</p>
            <p className="mt-2 font-display text-3xl tracking-tight">{summary.obrigatorias}</p>
        </div>
        <div className="space-y-2">
            <p className="font-mono-iris text-[0.65rem] uppercase tracking-widest text-muted-foreground">Ativas</p>
            <p className="mt-2 font-display text-3xl tracking-tight">{summary.ativas}</p>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 lg:grid-cols-5">
        <section className="space-y-4 border-b border-border/70 pb-6 lg:col-span-2 lg:border-b-0 lg:border-r lg:pr-4">
          <header className="border-b border-border/70 pb-3">
            <h2 className="font-display text-2xl tracking-tight">{form.id ? "Editar pergunta" : "Nova pergunta"}</h2>
          </header>
          <div>
            <form className="space-y-4" onSubmit={(event) => void handleSubmit(event)}>
              <div className="space-y-2">
                <Label htmlFor="categoria-pergunta">Categoria</Label>
                <select
                  id="categoria-pergunta"
                  value={form.category}
                  onChange={(event) => setForm((previous) => ({ ...previous, category: event.target.value as CalculatorCategory }))}
                  className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm text-foreground"
                  style={nativeSelectStyle}
                >
                  {CALCULATOR_CATEGORY_VALUES.map((category) => (
                    <option key={category} value={category} style={nativeSelectStyle}>
                      {CALCULATOR_CATEGORY_LABELS[category]}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="texto-pergunta">Texto da pergunta</Label>
                <Input
                  id="texto-pergunta"
                  value={form.pergunta}
                  onChange={(event) => setForm((previous) => ({ ...previous, pergunta: event.target.value }))}
                  placeholder="Ex: Qual seu objetivo para este ciclo?"
                  className="border-border bg-background"
                  required
                />
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="tipo-campo">Tipo de resposta</Label>
                  <select
                    id="tipo-campo"
                    value={form.tipo}
                    onChange={(event) => setForm((previous) => ({ ...previous, tipo: event.target.value as AdminCalculatorQuestionType }))}
                    className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm text-foreground"
                    style={nativeSelectStyle}
                  >
                    <option value="text" style={nativeSelectStyle}>Texto livre</option>
                    <option value="select" style={nativeSelectStyle}>Seleção única</option>
                    <option value="checkbox" style={nativeSelectStyle}>Múltipla escolha</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="prioridade-visual">Prioridade visual</Label>
                  <Input
                    id="prioridade-visual"
                    type="number"
                    min={0}
                    value={form.prioridade}
                    onChange={(event) => setForm((previous) => ({ ...previous, prioridade: event.target.value }))}
                    className="border-border bg-background"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <label className="flex items-center gap-2 text-sm text-foreground">
                  <input
                    type="checkbox"
                    checked={form.obrigatoria}
                    onChange={(event) => setForm((previous) => ({ ...previous, obrigatoria: event.target.checked }))}
                  />
                  Resposta obrigatória
                </label>
                <label className="flex items-center gap-2 text-sm text-foreground">
                  <input
                    type="checkbox"
                    checked={form.ativa}
                    onChange={(event) => setForm((previous) => ({ ...previous, ativa: event.target.checked }))}
                  />
                  Exibir na calculadora
                </label>
              </div>

              {isSelectionType ? (
                <div className="space-y-2">
                  <Label htmlFor="opcoes-resposta">Opções (uma por linha; opcional: valor|texto)</Label>
                  <Textarea
                    id="opcoes-resposta"
                    value={form.opcoesTexto}
                    onChange={(event) => setForm((previous) => ({ ...previous, opcoesTexto: event.target.value }))}
                    placeholder={"Estável\nEm transição|Em fase de transição"}
                    className="min-h-24 border-border bg-background"
                  />
                </div>
              ) : null}

              <div className="flex gap-2">
                <Button type="submit" disabled={isSaving}>
                  {isSaving ? "Salvando..." : form.id ? "Salvar alterações" : "Cadastrar pergunta"}
                </Button>
                {form.id ? (
                  <Button type="button" variant="ghost" onClick={resetForm}>
                    Cancelar edição
                  </Button>
                ) : null}
              </div>
            </form>
          </div>
        </section>

        <section className="space-y-4 lg:col-span-3">
          <header className="space-y-4 border-b border-border/70 pb-3">
            <h2 className="font-display text-2xl tracking-tight">Perguntas cadastradas</h2>
            <div className="flex items-center gap-2">
              <Label htmlFor="filtro-categoria" className="text-xs text-muted-foreground">
                Filtrar por pilar
              </Label>
              <select
                id="filtro-categoria"
                value={filtroCategoria}
                onChange={(event) => setFiltroCategoria(event.target.value as "todas" | CalculatorCategory)}
                className="h-9 rounded-md border border-border bg-background px-3 text-sm text-foreground"
                style={nativeSelectStyle}
              >
                <option value="todas" style={nativeSelectStyle}>Todas as categorias</option>
                {CALCULATOR_CATEGORY_VALUES.map((category) => (
                  <option key={category} value={category} style={nativeSelectStyle}>
                    {CALCULATOR_CATEGORY_LABELS[category]}
                  </option>
                ))}
              </select>
            </div>
          </header>
          <div className="space-y-4">
            {isLoading ? <div className="h-16 animate-pulse rounded-md bg-muted/30" /> : null}
            <DataTable
              rows={questions}
              emptyMessage="Nenhuma pergunta cadastrada para este filtro."
              columns={[
                {
                  key: "categoria",
                  header: "Pilar",
                  render: (row) => <Badge variant="outline">{CALCULATOR_CATEGORY_LABELS[row.category]}</Badge>,
                },
                {
                  key: "pergunta",
                  header: "Pergunta",
                  render: (row) => <p className="text-sm text-foreground">{row.label}</p>,
                },
                {
                  key: "tipo",
                  header: "Tipo de resposta",
                  render: (row) => <Badge variant="outline">{tipoPerguntaLabel(row.type)}</Badge>,
                },
                {
                  key: "regras",
                  header: "Regras",
                  render: (row) => (
                    <div className="flex flex-wrap gap-1">
                      <Badge variant={row.isRequired ? "default" : "secondary"}>{row.isRequired ? "Obrigatória" : "Opcional"}</Badge>
                      <Badge className={row.isActive ? "border-emerald-500/40 bg-emerald-500/15 text-emerald-300" : "border-amber-500/40 bg-amber-500/15 text-amber-300"}>
                        {row.isActive ? "Ativa" : "Inativa"}
                      </Badge>
                    </div>
                  ),
                },
                {
                  key: "posicao",
                  header: "Posição",
                  render: (row) => <span className="text-sm text-foreground">{row.order}</span>,
                },
                {
                  key: "acoes",
                  header: "Ações",
                  render: (row) => (
                    <div className="flex gap-2">
                      <Button type="button" size="sm" variant="outline" onClick={() => loadQuestionToForm(row)}>
                        Editar
                      </Button>
                      <Button type="button" size="sm" variant="destructive" onClick={() => setDeletingQuestion(row)}>
                        Excluir
                      </Button>
                    </div>
                  ),
                },
              ]}
            />
          </div>
        </section>
      </section>

      <Dialog open={Boolean(deletingQuestion)} onOpenChange={(open) => (!open ? setDeletingQuestion(null) : null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar exclusão</DialogTitle>
            <DialogDescription>
              Esta pergunta será desativada e removida da calculadora, mantendo histórico interno para segurança.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => setDeletingQuestion(null)}>
              Cancelar
            </Button>
            <Button type="button" variant="destructive" onClick={() => void confirmDelete()}>
              Confirmar exclusão
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
