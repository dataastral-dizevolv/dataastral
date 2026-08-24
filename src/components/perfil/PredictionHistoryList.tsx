"use client";

import { useState } from "react";
import { Trash2 } from "lucide-react";
import useSWR, { useSWRConfig } from "swr";
import { toast } from "sonner";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import type { PredictionHistoryItem } from "@/types/dashboard";

const HISTORY_KEY = "/api/predictions/history?limit=50";

const fetcher = async (url: string) => {
  const response = await fetch(url, { credentials: "include" });
  if (!response.ok) {
    throw new Error("Falha ao carregar histórico.");
  }
  return (await response.json()) as PredictionHistoryItem[];
};

export function PredictionHistoryList() {
  const { mutate } = useSWRConfig();
  const { data, isLoading } = useSWR<PredictionHistoryItem[]>(HISTORY_KEY, fetcher, {
    revalidateOnFocus: true,
    dedupingInterval: 8000,
  });
  const [busyId, setBusyId] = useState<string | null>(null);
  const history = data ?? [];

  async function deleteItem(id: string) {
    setBusyId(id);
    try {
      const response = await fetch(`/api/predictions/history?id=${id}`, { method: "DELETE", credentials: "include" });
      if (!response.ok) {
        toast.error("Não foi possível excluir esta pergunta.");
        return;
      }
      await mutate(HISTORY_KEY);
      await mutate((key) => typeof key === "string" && key.startsWith("/api/predictions/history"), undefined, {
        revalidate: true,
      });
    } finally {
      setBusyId(null);
    }
  }

  async function deleteAll() {
    setBusyId("all");
    try {
      const response = await fetch("/api/predictions/history?all=1", { method: "DELETE", credentials: "include" });
      if (!response.ok) {
        toast.error("Não foi possível limpar o histórico.");
        return;
      }
      toast.success("Histórico de perguntas excluído");
      await mutate(HISTORY_KEY);
      await mutate((key) => typeof key === "string" && key.startsWith("/api/predictions/history"), undefined, {
        revalidate: true,
      });
    } finally {
      setBusyId(null);
    }
  }

  return (
    <section className="border-t border-border">
      <div className="flex items-center justify-between py-5">
        <p className="text-[12px] font-black tracking-[0.22em] text-foreground uppercase">03 · Histórico de perguntas</p>
        {history.length > 0 ? (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <button type="button" aria-label="Excluir histórico de perguntas" className="text-cherry hover:opacity-80">
                <Trash2 className="size-5" />
              </button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle className="text-cherry">Excluir histórico de perguntas</AlertDialogTitle>
                <AlertDialogDescription>
                  Tem certeza? Todas as suas perguntas e respostas serão removidas permanentemente. Esta ação não pode ser
                  desfeita.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction className="bg-cherry text-background hover:bg-cherry/90" onClick={() => void deleteAll()}>
                  Excluir tudo
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        ) : null}
      </div>

      {isLoading ? <p className="pb-5 text-sm text-muted-foreground">Carregando histórico…</p> : null}

      {!isLoading && history.length === 0 ? (
        <p className="pb-5 text-sm text-muted-foreground">Nenhuma pergunta ainda.</p>
      ) : null}

      {history.length > 0 ? (
        <div className="divide-y divide-border border-y border-border">
          {history.map((item) => (
            <details key={item.id} className="py-3">
              <summary className="flex cursor-pointer items-center justify-between gap-3 text-sm">
                <span className="min-w-0 flex-1 truncate rounded-full border border-border bg-muted/40 px-3 py-1.5">
                  {item.question}
                </span>
                <button
                  type="button"
                  disabled={busyId === item.id}
                  onClick={(event) => {
                    event.preventDefault();
                    void deleteItem(item.id);
                  }}
                  className="text-muted-foreground hover:text-cherry"
                  aria-label="Excluir pergunta"
                >
                  <Trash2 className="size-4" />
                </button>
              </summary>
              <p className="mt-3 whitespace-pre-wrap text-xs text-muted-foreground">{item.prediction}</p>
            </details>
          ))}
        </div>
      ) : null}
    </section>
  );
}
