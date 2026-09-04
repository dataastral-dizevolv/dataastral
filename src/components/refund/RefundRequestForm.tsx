"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import useSWR from "swr";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { CreateRefundResponse, RefundsMeResponse } from "@/types/refunds";

const REFUNDS_KEY = "/api/refunds";

const fetcher = async (url: string): Promise<RefundsMeResponse> => {
  const response = await fetch(url, { credentials: "include" });
  if (!response.ok) {
    throw new Error("Falha ao carregar créditos.");
  }
  return (await response.json()) as RefundsMeResponse;
};

function statusLabel(status: RefundsMeResponse["requests"][number]["status"]) {
  if (status === "approved") return "Aprovado";
  if (status === "rejected") return "Recusado";
  return "Pendente";
}

export function RefundRequestForm() {
  const router = useRouter();
  const { data, error, isLoading, mutate } = useSWR<RefundsMeResponse>(REFUNDS_KEY, fetcher, {
    revalidateOnFocus: false,
  });
  const [amount, setAmount] = useState("");
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const credits = data?.credits ?? 0;
  const amountNumber = Number(amount);

  async function submit() {
    setSubmitting(true);
    try {
      const response = await fetch("/api/refunds", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ amount: amountNumber, reason }),
      });
      const payload = (await response.json().catch(() => ({}))) as CreateRefundResponse | { error?: string };

      if (!response.ok) {
        toast.error(("error" in payload && payload.error) || "Não foi possível enviar o pedido.");
        return;
      }

      toast.success("Pedido de reembolso enviado");
      await mutate();
      router.push("/perfil");
    } catch {
      toast.error("Falha de conexão ao enviar o pedido.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      <p className="text-sm text-muted-foreground">
        {isLoading ? (
          "Carregando saldo…"
        ) : error ? (
          "Não foi possível carregar seu saldo agora."
        ) : (
          <>
            Você tem <strong className="text-foreground">{credits}</strong> crédito{credits === 1 ? "" : "s"} não
            utilizado{credits === 1 ? "" : "s"}. CDC art. 49 garante reembolso em até 7 dias.
          </>
        )}
      </p>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="refund-amount">Quantidade de créditos a reembolsar</Label>
          <Input
            id="refund-amount"
            type="number"
            inputMode="numeric"
            min={1}
            max={Math.max(credits, 1)}
            value={amount}
            onChange={(event) => setAmount(event.target.value)}
            disabled={isLoading || credits <= 0}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="refund-reason">Motivo (opcional)</Label>
          <Textarea
            id="refund-reason"
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            rows={4}
            maxLength={1000}
          />
        </div>
        <Button
          type="button"
          className="w-full rounded-full"
          disabled={
            submitting ||
            !amount ||
            credits <= 0 ||
            !Number.isFinite(amountNumber) ||
            amountNumber < 1 ||
            amountNumber > credits
          }
          onClick={() => void submit()}
        >
          {submitting ? "Enviando…" : "Solicitar reembolso"}
        </Button>
      </div>

      {(data?.requests.length ?? 0) > 0 ? (
        <div className="space-y-3 border-t border-border pt-6">
          <h2 className="font-jakarta text-base font-bold text-foreground">Pedidos anteriores</h2>
          <ul className="divide-y divide-border">
            {(data?.requests ?? []).map((item) => (
              <li key={item.id} className="flex items-start justify-between gap-3 py-3 text-sm">
                <div>
                  <p className="text-foreground">
                    {item.amount} crédito{item.amount === 1 ? "" : "s"} · {statusLabel(item.status)}
                  </p>
                  {item.reason ? <p className="mt-1 text-xs text-muted-foreground">{item.reason}</p> : null}
                </div>
                <p className="shrink-0 text-xs text-muted-foreground">
                  {new Intl.DateTimeFormat("pt-BR", { dateStyle: "medium" }).format(new Date(item.createdAt))}
                </p>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
