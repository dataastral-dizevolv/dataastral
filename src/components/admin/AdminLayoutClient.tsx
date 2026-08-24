"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Menu } from "lucide-react";

import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";

interface AdminLayoutClientProps {
  userName: string;
  userEmail: string;
  children: React.ReactNode;
}

export function AdminLayoutClient({ userName, userEmail, children }: AdminLayoutClientProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex h-screen bg-background text-foreground">
      <aside className="hidden w-64 shrink-0 border-r border-border bg-card shadow-sm md:block">
        <AdminSidebar userName={userName} userEmail={userEmail} />
      </aside>

      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <header className="flex h-14 items-center gap-3 border-b border-border bg-card/80 px-4 backdrop-blur-sm md:hidden">
          <Button
            type="button"
            variant="outline"
            size="icon-sm"
            onClick={() => setMobileOpen(true)}
            aria-label="Abrir menu admin"
            className="border-border"
          >
            <Menu className="size-4" />
          </Button>
          <Link href="/admin/dashboard" className="inline-flex items-center gap-2">
            <Image src="/brand/brand-star-pastel.png" alt="" width={24} height={24} className="h-6 w-6 object-contain" />
            <span className="font-ubuntu text-base font-bold tracking-tight text-foreground">Iris Admin</span>
          </Link>
        </header>

        <main className="min-h-0 flex-1 overflow-y-auto bg-background">{children}</main>
      </div>

      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="left" className="w-[250px] max-w-[250px] border-r border-border bg-card p-0">
          <SheetHeader className="sr-only">
            <SheetTitle>Menu administrativo</SheetTitle>
            <SheetDescription>Menu de navegação do painel administrativo</SheetDescription>
          </SheetHeader>
          <AdminSidebar userName={userName} userEmail={userEmail} onNavigate={() => setMobileOpen(false)} />
        </SheetContent>
      </Sheet>
    </div>
  );
}
