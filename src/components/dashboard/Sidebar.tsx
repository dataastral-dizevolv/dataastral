"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  ShieldStar,
  CalendarDots,
  CreditCard,
  House,
  Plus,
  SignOut,
  Sparkle,
  UserCircle,
} from "@phosphor-icons/react";
import { toast } from "sonner";
import useSWR from "swr";

import { CreditosWidget } from "@/components/dashboard/CreditosWidget";
import { useDashboardUser } from "@/components/dashboard/DashboardUserContext";
import { getTodayRelevantEvent } from "@/lib/astrology/ephemerides";
import { createClient } from "@/lib/supabase/client";
import { EVENT_TYPE_COLORS } from "@/lib/theme/event-colors";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { EphemerisEvent } from "@/types/dashboard";

interface SidebarProps {
  onNavigate?: () => void;
}

const links = [
  { href: "/dashboard", label: "Início", icon: House },
  { href: "/calculadora", label: "Calculadora", icon: Sparkle },
  { href: "/calendario", label: "Calendário", icon: CalendarDots },
  { href: "/financeiro", label: "Financeiro", icon: CreditCard },
  { href: "/perfil", label: "Perfil", icon: UserCircle },
];

function getIniciais(nome: string) {
  return nome
    .split(" ")
    .map((parte) => parte[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

const fetcher = async <T,>(url: string): Promise<T> => {
  const response = await fetch(url, { credentials: "include" });

  if (!response.ok) {
    throw new Error("Falha ao carregar widget lateral.");
  }

  return (await response.json()) as T;
};

export function Sidebar({ onNavigate }: SidebarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, loading } = useDashboardUser();
  const hoje = new Date();
  const hojeIso = hoje.toISOString().slice(0, 10);
  const { data: eventosMes } = useSWR<EphemerisEvent[]>(
    `/api/astrology/ephemerides?year=${hoje.getFullYear()}&month=${hoje.getMonth() + 1}`,
    fetcher,
    { revalidateOnFocus: false, dedupingInterval: 60000 },
  );
  const eventoHoje = getTodayRelevantEvent(eventosMes ?? [], hojeIso);

  async function handleSignOut() {
    const supabase = createClient();
    const { error } = await supabase.auth.signOut();

    if (error) {
      toast.error("Não foi possível sair agora.");
      return;
    }

    toast.success("Sessao encerrada.");
    router.push("/login");
    router.refresh();
  }

  return (
    <aside className="flex h-full w-full flex-col bg-card text-card-foreground">
      <div className="px-5 py-6">
        <Link
          href="/dashboard"
          onClick={onNavigate}
          className="inline-flex items-center gap-2.5 transition-opacity hover:opacity-80"
        >
          <Image
            src="/brand/brand-star-pastel.png"
            alt=""
            width={28}
            height={28}
            className="h-7 w-7 object-contain"
          />
          <span className="font-ubuntu text-lg font-bold tracking-tight text-foreground">Data Astral</span>
        </Link>
      </div>

      <nav className="space-y-1 px-3">
        {links.map((item) => {
          const ativo = pathname === item.href || pathname.startsWith(`${item.href}/`);
          const Icone = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              className={`flex items-center gap-3 rounded-xl border-l-[3px] px-3 py-2.5 text-sm transition-colors ${
                ativo
                  ? "border-l-powder-blue bg-powder-blue/15 font-medium text-foreground"
                  : "border-l-transparent text-muted-foreground hover:bg-muted/60 hover:text-foreground"
              }`}
            >
              <span className={ativo ? "text-iris-accent" : undefined}>
                <Icone size={20} weight={ativo ? "regular" : "thin"} />
              </span>
              <span>{item.label}</span>
            </Link>
          );
        })}
        {user.role === "admin" ? (
          <Link
            href="/admin"
            onClick={onNavigate}
            className="flex items-center gap-3 rounded-xl border-l-[3px] border-l-iris-accent/50 px-3 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-muted/60"
          >
            <ShieldStar size={20} weight="thin" />
            <span>Admin</span>
          </Link>
        ) : null}
      </nav>

      <div className="mt-auto px-3 pb-4">
        <div className="mb-4 h-px w-full bg-border" />
        <div className="mb-3">
          <CreditosWidget
            credits={user.credits}
            loading={loading}
            actions={
              <Button
                asChild
                variant="outline"
                size="icon-sm"
                className="h-6 w-6 border-powder-blue/50 text-iris-accent hover:bg-powder-blue/15"
              >
                <Link href="/financeiro" aria-label="Comprar créditos" onClick={onNavigate}>
                  <Plus size={14} weight="bold" />
                </Link>
              </Button>
            }
          />
        </div>
        <div className="mb-3 rounded-xl border border-border bg-background/70 p-3">
          <p className="font-ubuntu text-[0.6rem] uppercase tracking-widest text-iris-accent">Hoje no céu</p>
          <p className="mt-1 line-clamp-2 text-sm text-foreground">{eventoHoje?.titulo ?? "Sem destaque para hoje"}</p>
          {eventoHoje ? (
            <Badge
              style={{
                borderColor: EVENT_TYPE_COLORS[eventoHoje.tipo].primary,
                backgroundColor: EVENT_TYPE_COLORS[eventoHoje.tipo].surface,
                color: EVENT_TYPE_COLORS[eventoHoje.tipo].text,
              }}
              className="mt-2 border"
            >
              {eventoHoje.tipo.toUpperCase()}
            </Badge>
          ) : null}
        </div>
        <div className="flex items-center gap-3 rounded-xl border border-border bg-background/70 p-3">
          <Avatar>
            <AvatarFallback className="bg-powder-blue/25 text-foreground">{getIniciais(user.nome)}</AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm text-foreground">{user.nome}</p>
            <p className="truncate font-ubuntu text-[0.65rem] uppercase tracking-widest text-muted-foreground">
              {user.email}
            </p>
            {user.role === "admin" ? (
              <p className="font-ubuntu text-[0.6rem] uppercase tracking-widest text-iris-accent">Administrador</p>
            ) : null}
          </div>
          <Button type="button" variant="ghost" size="icon-sm" onClick={handleSignOut} aria-label="Sair">
            <SignOut size={20} weight="thin" />
          </Button>
        </div>
      </div>
    </aside>
  );
}
