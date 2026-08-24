"use client";

import { useState } from "react";
import { useSWRConfig } from "swr";
import { toast } from "sonner";

import { DASHBOARD_ME_KEY } from "@/components/dashboard/DashboardUserContext";
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
import { Button } from "@/components/ui/button";
import type { DashboardUser } from "@/lib/auth/user";

interface DeleteAccountDialogProps {
  user: DashboardUser;
}

export function DeleteAccountDialog({ user }: DeleteAccountDialogProps) {
  const { mutate } = useSWRConfig();
  const [busy, setBusy] = useState(false);

  async function requestDeletion() {
    setBusy(true);
    try {
      const response = await fetch("/api/profile/delete-request", {
        method: "POST",
        credentials: "include",
      });
      const payload = (await response.json().catch(() => ({}))) as { error?: string };
      if (!response.ok && response.status !== 202) {
        toast.error(payload.error ?? "Não foi possível iniciar a exclusão.");
        return;
      }
      toast.success("Link de confirmação enviado para o seu e-mail");
      await mutate(DASHBOARD_ME_KEY);
    } catch {
      toast.error("Falha de conexão ao solicitar exclusão.");
    } finally {
      setBusy(false);
    }
  }

  async function cancelDeletion() {
    setBusy(true);
    try {
      const response = await fetch("/api/profile/delete-request", {
        method: "DELETE",
        credentials: "include",
      });
      if (!response.ok) {
        toast.error("Não foi possível cancelar a exclusão.");
        return;
      }
      toast.success("Pedido de exclusão cancelado.");
      await mutate(DASHBOARD_ME_KEY);
    } finally {
      setBusy(false);
    }
  }

  const scheduledLabel = user.pendingDeletionScheduledFor
    ? new Intl.DateTimeFormat("pt-BR", { day: "numeric", month: "long", year: "numeric" }).format(
        new Date(user.pendingDeletionScheduledFor),
      )
    : null;

  return (
    <section className="border-t border-border py-6">
      <p className="text-[12px] font-black tracking-[0.22em] text-foreground uppercase">Conta</p>

      <div className="mt-4 border border-cherry bg-blush px-4 py-3">
        <p className="text-xs font-black tracking-[0.14em] text-cherry uppercase">Aviso de segurança</p>
        <p className="mt-1 text-xs leading-relaxed text-cherry">
          Nunca compartilhe sua senha ou o link de acesso enviado por e-mail. Data Astral nunca pede sua senha por
          mensagem. A exclusão de dados é confirmada por e-mail e é definitiva.
        </p>
      </div>

      {scheduledLabel ? (
        <div className="mt-4 border border-border px-4 py-3 text-sm">
          <p>
            Exclusão agendada para <strong>{scheduledLabel}</strong>. Você pode cancelar até lá.
          </p>
          <Button type="button" variant="outline" className="mt-3" disabled={busy} onClick={() => void cancelDeletion()}>
            Cancelar exclusão
          </Button>
        </div>
      ) : null}

      <div className="mt-4 space-y-2">
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="outline" className="w-full bg-transparent font-black">
              Limpar histórico
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Limpar histórico</AlertDialogTitle>
              <AlertDialogDescription>
                Todas as suas perguntas e respostas serão removidas permanentemente. Esta ação não pode ser desfeita.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction
                className="font-black"
                onClick={() => {
                  void fetch("/api/predictions/history?all=1", { method: "DELETE", credentials: "include" }).then(
                    async (response) => {
                      if (!response.ok) {
                        toast.error("Não foi possível limpar o histórico.");
                        return;
                      }
                      toast.success("Histórico de perguntas excluído");
                      await mutate(
                        (key) => typeof key === "string" && key.startsWith("/api/predictions/history"),
                        undefined,
                        { revalidate: true },
                      );
                    },
                  );
                }}
              >
                Limpar tudo
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="outline" className="w-full border-cherry bg-transparent font-black text-cherry hover:bg-blush">
              Excluir conta
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle className="text-cherry">Excluir conta</AlertDialogTitle>
              <AlertDialogDescription>
                Enviaremos um link de confirmação para o seu e-mail. A exclusão só acontece depois que você confirmar por
                lá. Após confirmar, sua conta e seus dados são apagados em 7 dias e a ação é irreversível.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction
                className="bg-cherry text-background hover:bg-cherry/90 font-black"
                disabled={busy}
                onClick={() => void requestDeletion()}
              >
                Enviar link de confirmação
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </section>
  );
}
