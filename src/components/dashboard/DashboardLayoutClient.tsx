"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu } from "lucide-react";

import { DashboardUserProvider } from "@/components/dashboard/DashboardUserContext";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { DashboardUser } from "@/lib/auth/user";

interface DashboardLayoutClientProps {
  user: DashboardUser;
  children: React.ReactNode;
}

export function DashboardLayoutClient({ user, children }: DashboardLayoutClientProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <DashboardUserProvider user={user}>
      <div className="flex h-screen bg-background text-foreground">
        <aside className="hidden w-60 shrink-0 border-r border-border md:block">
          <Sidebar />
        </aside>

        <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
          <header className="flex h-14 items-center gap-3 border-b border-border px-4 md:hidden">
            <Button
              type="button"
              variant="outline"
              size="icon-sm"
              onClick={() => setMobileOpen(true)}
              aria-label="Abrir menu"
            >
              <Menu className="size-4" />
            </Button>
            <Link href="/dashboard" className="font-display text-lg italic tracking-tight text-iris-accent">
              Data Astral
            </Link>
          </header>

          <main className="min-h-0 flex-1 overflow-y-auto">{children}</main>
        </div>

        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetContent side="left" className="w-[240px] max-w-[240px] border-r border-border p-0">
            <SheetHeader className="sr-only">
              <SheetTitle>Menu de navegação</SheetTitle>
              <SheetDescription>Menu de navegação do dashboard</SheetDescription>
            </SheetHeader>
            <Sidebar onNavigate={() => setMobileOpen(false)} />
          </SheetContent>
        </Sheet>
      </div>
    </DashboardUserProvider>
  );
}
