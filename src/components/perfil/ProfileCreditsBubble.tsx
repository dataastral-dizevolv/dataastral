"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Copy, Users } from "lucide-react";
import { toast } from "sonner";

import { useDashboardUser } from "@/components/dashboard/DashboardUserContext";
import { ChatBubble } from "@/components/iris-chat/ChatBubble";
import { Button } from "@/components/ui/button";
import { REFERRAL_POINTS_PER_SIGNUP } from "@/lib/referrals";

function SectionLabel({ index, title }: { index: string; title: string }) {
  return (
    <p className="font-jakarta text-[12px] font-black uppercase tracking-[0.22em] text-current sm:text-[13px]">
      {index} · {title}
    </p>
  );
}

export function ProfileCreditsBubble() {
  const { user } = useDashboardUser();

  return (
    <ChatBubble
      from="iris"
      className="!border-casper !bg-casper text-[15px] font-black text-casper-foreground sm:text-[17px]"
    >
      <div className="space-y-3 py-1">
        <SectionLabel index="03" title="Saldo" />
        <div className="flex items-center justify-between gap-4">
          <div className="flex flex-1 flex-col gap-3">
            <div className="flex items-baseline gap-3">
              <p className="font-jakarta text-2xl font-black leading-none">{user.freeQuestionsRemaining}</p>
              <p className="text-xs uppercase tracking-wider opacity-70">Perguntas grátis</p>
            </div>
            <div className="flex items-baseline gap-3">
              <p className="font-jakarta text-2xl font-black leading-none">{user.credits}</p>
              <p className="text-xs uppercase tracking-wider opacity-70">Créditos</p>
            </div>
          </div>
          <div className="flex shrink-0 flex-col gap-2">
            <Button size="sm" asChild className="transition-all active:scale-95 active:opacity-70">
              <Link href="/precos">Comprar</Link>
            </Button>
            <Button
              size="sm"
              variant="outline"
              asChild
              className="border-current bg-transparent transition-all active:scale-95 active:opacity-70"
            >
              <Link href="/reembolso">Reembolso</Link>
            </Button>
          </div>
        </div>
        <p className="text-xs font-normal opacity-70">
          Histórico de compras e transações em{" "}
          <Link href="/financeiro" className="underline underline-offset-2">
            Financeiro
          </Link>
          .
        </p>
      </div>
    </ChatBubble>
  );
}

export function ProfileReferralBubble() {
  const { user } = useDashboardUser();
  const [referralLink, setReferralLink] = useState("");

  useEffect(() => {
    if (!user.referralCode) {
      setReferralLink("");
      return;
    }

    setReferralLink(`${window.location.origin}/cadastro?ref=${user.referralCode}`);
  }, [user.referralCode]);

  return (
    <ChatBubble
      from="iris"
      className="!border-jungle-mist !bg-jungle-mist text-[15px] font-black text-jungle-mist-foreground sm:text-[17px]"
    >
      <div className="space-y-4">
        <SectionLabel index="04" title="Indicação de amigos" />
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-2xl border border-foreground/10 bg-bubble">
              <Users className="size-5 text-casper" strokeWidth={2.5} />
            </div>
            <p className="text-sm font-normal text-foreground/80">
              Ganhe {REFERRAL_POINTS_PER_SIGNUP} ponto a cada amigo que se cadastrar com o seu link.
            </p>
          </div>
          <div className="shrink-0 text-right">
            <p className="font-jakarta text-3xl font-black leading-none">{user.referralPoints}</p>
            <p className="mt-1 text-[10px] font-normal uppercase tracking-wider text-muted-foreground">pontos</p>
          </div>
        </div>
        <div className="flex items-center justify-between gap-2 border-t border-foreground/10 pt-3">
          <code className="flex-1 truncate text-xs font-normal text-foreground/70">
            {referralLink || (user.referralCode ? "Carregando link…" : "Código indisponível")}
          </code>
          <Button
            size="sm"
            variant="outline"
            disabled={!referralLink}
            onClick={() => {
              if (!referralLink) {
                return;
              }
              void navigator.clipboard.writeText(referralLink);
              toast.success("Link copiado");
            }}
            className="transition-all active:scale-95"
          >
            <Copy className="mr-1.5 size-3.5" /> Copiar
          </Button>
        </div>
        <p className="text-[11px] font-normal text-muted-foreground">
          Compartilhe o link. Quando a pessoa criar a conta, você recebe {REFERRAL_POINTS_PER_SIGNUP} ponto de
          indicação.
        </p>
      </div>
    </ChatBubble>
  );
}
