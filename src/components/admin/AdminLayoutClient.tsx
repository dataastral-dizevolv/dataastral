"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu } from "lucide-react";

import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent } from "@/components/ui/sheet";

interface AdminLayoutClientProps {
  userName: string;
  userEmail: string;
  children: React.ReactNode;
}

export function AdminLayoutClient({ userName, userEmail, children }: AdminLayoutClientProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex h-screen bg-background text-foreground">
      <aside className="hidden w-64 shrink-0 border-r border-border md:block">
        <AdminSidebar userName={userName} userEmail={userEmail} />
      </aside>
      <div className="hidden w-px shrink-0 bg-gradient-to-b from-transparent via-iris-accent/20 to-transparent md:block" />

      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <header className="flex h-14 items-center gap-3 border-b border-border px-4 md:hidden">
          <Button type="button" variant="outline" size="icon-sm" onClick={() => setMobileOpen(true)} aria-label="Abrir menu admin">
            <Menu className="size-4" />
          </Button>
          <Link href="/admin/dashboard" className="font-display text-lg italic tracking-tight text-iris-accent">
            Iris Admin
          </Link>
        </header>

        <main className="min-h-0 flex-1 overflow-y-auto">{children}</main>
      </div>

      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="left" className="w-[250px] max-w-[250px] border-r border-border p-0">
          <AdminSidebar userName={userName} userEmail={userEmail} onNavigate={() => setMobileOpen(false)} />
        </SheetContent>
      </Sheet>
    </div>
  );
}
