"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Gauge, ListChecks, SignOut, UsersThree } from "@phosphor-icons/react";
import { toast } from "sonner";

import { createClient } from "@/lib/supabase/client";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface AdminSidebarProps {
  userName: string;
  userEmail: string;
  onNavigate?: () => void;
}

const adminLinks = [
  { href: "/admin/dashboard", label: "Dashboard", icon: Gauge },
  { href: "/admin/usuarios", label: "Usuários", icon: UsersThree },
  { href: "/admin/logs", label: "Logs do Motor", icon: ListChecks },
];

function getIniciais(nome: string) {
  return nome
    .split(" ")
    .map((parte) => parte[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export function AdminSidebar({ userName, userEmail, onNavigate }: AdminSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();

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
          href="/admin/dashboard"
          onClick={onNavigate}
          className="inline-flex items-center gap-2.5 transition-opacity hover:opacity-80"
        >
          <Image
            src="/brand/iris-mark.png"
            alt="Data Iris"
            width={28}
            height={28}
            className="h-7 w-7 object-contain"
          />
          <span className="font-ubuntu text-lg font-bold tracking-tight text-foreground">Iris Admin</span>
        </Link>
      </div>

      <nav className="space-y-1 px-3">
        {adminLinks.map((item) => {
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
      </nav>

      <div className="mt-auto px-3 pb-4">
        <div className="mb-4 h-px w-full bg-border" />
        <div className="mb-3 rounded-xl border border-border bg-background/70 p-3">
          <p className="font-ubuntu text-[0.6rem] uppercase tracking-widest text-iris-accent">Área Restrita</p>
          <p className="mt-1 text-sm text-foreground">Administração central do motor e usuários.</p>
        </div>
        <div className="flex items-center gap-3 rounded-xl border border-border bg-background/70 p-3">
          <Avatar>
            <AvatarFallback className="bg-powder-blue/25 text-foreground">{getIniciais(userName)}</AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm text-foreground">{userName}</p>
            <p className="truncate font-ubuntu text-[0.65rem] uppercase tracking-widest text-muted-foreground">
              {userEmail}
            </p>
            <Badge className="mt-1 border-powder-blue/40 bg-powder-blue/15 text-foreground">Admin</Badge>
          </div>
          <Button type="button" variant="ghost" size="icon-sm" onClick={handleSignOut} aria-label="Sair">
            <SignOut size={20} weight="thin" />
          </Button>
        </div>
      </div>
    </aside>
  );
}
