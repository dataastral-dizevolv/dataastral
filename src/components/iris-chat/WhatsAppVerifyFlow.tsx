"use client";

import { useState } from "react";
import { Check, Loader2, MessageCircle } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface WhatsAppVerifyFlowProps {
  predictionText: string;
  predictionId?: string | null;
  onAuthRequired?: () => void;
}

type Stage = "phone" | "code" | "done";

export function WhatsAppVerifyFlow({ predictionText, predictionId, onAuthRequired }: WhatsAppVerifyFlowProps) {
  const [stage, setStage] = useState<Stage>("phone");
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);

  const sendCode = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/whatsapp/send-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone }),
      });
      const payload = (await response.json()) as { success?: boolean; error?: string; code?: string; delivery?: string };

      if (response.status === 401 || payload.code === "AUTH_REQUIRED") {
        onAuthRequired?.();
        return;
      }

      if (!response.ok || !payload.success) {
        throw new Error(payload.error || "Falha ao enviar");
      }

      if (payload.delivery === "mock") {
        const sendResponse = await fetch("/api/whatsapp/send", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ phone, text: predictionText, predictionId }),
        });
        const sendPayload = (await sendResponse.json()) as { error?: string; message?: string };
        if (!sendResponse.ok) {
          throw new Error(sendPayload.error || "Falha ao preparar o envio");
        }
        toast.success(sendPayload.message || "Previsão pronta para envio no WhatsApp.");
        setStage("done");
        return;
      }

      toast.success("Código enviado pelo WhatsApp.");
      setStage("code");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erro ao enviar código");
    } finally {
      setLoading(false);
    }
  };

  const verifyAndSend = async () => {
    if (code.length !== 6) {
      toast.error("O código tem 6 dígitos.");
      return;
    }
    setLoading(true);
    try {
      const response = await fetch("/api/whatsapp/verify-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, code, message: predictionText, predictionId }),
      });
      const payload = (await response.json()) as { success?: boolean; error?: string; code?: string; message?: string };

      if (response.status === 401 || payload.code === "AUTH_REQUIRED") {
        onAuthRequired?.();
        return;
      }

      if (!response.ok || !payload.success) {
        throw new Error(payload.error || "Código inválido");
      }

      toast.success(payload.message || "Previsão enviada para o seu WhatsApp!");
      setStage("done");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erro na verificação");
    } finally {
      setLoading(false);
    }
  };

  if (stage === "done") {
    return (
      <div className="flex items-center gap-2 text-sm text-foreground">
        <Check className="size-4" /> Enviado para {phone}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-xs tracking-[0.16em] text-muted-foreground uppercase">
        <MessageCircle className="size-3.5" />
        {stage === "phone" ? "Seu WhatsApp" : "Código recebido"}
      </div>

      {stage === "phone" ? (
        <div className="flex gap-2">
          <Input
            value={phone}
            onChange={(event) => setPhone(event.target.value)}
            placeholder="(11) 99999-9999"
            className="bg-background"
            inputMode="tel"
          />
          <Button type="button" onClick={() => void sendCode()} disabled={loading} className="rounded-xl">
            {loading ? <Loader2 className="size-4 animate-spin" /> : "Enviar código"}
          </Button>
        </div>
      ) : (
        <div className="flex gap-2">
          <Input
            value={code}
            onChange={(event) => setCode(event.target.value.replace(/\D/g, "").slice(0, 6))}
            placeholder="6 dígitos"
            className="bg-background text-center tracking-[0.4em]"
            inputMode="numeric"
            maxLength={6}
          />
          <Button type="button" onClick={() => void verifyAndSend()} disabled={loading} className="rounded-xl">
            {loading ? <Loader2 className="size-4 animate-spin" /> : "Verificar"}
          </Button>
        </div>
      )}
    </div>
  );
}
