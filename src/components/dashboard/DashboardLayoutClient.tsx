"use client";

import { usePathname } from "next/navigation";

import { DashboardUserProvider } from "@/components/dashboard/DashboardUserContext";
import Header from "@/components/landing/Header";
import { DashboardUser } from "@/lib/auth/user";

interface DashboardLayoutClientProps {
  user: DashboardUser;
  children: React.ReactNode;
}

const FULL_HEIGHT_ROUTES = ["/calculadora"];

export function DashboardLayoutClient({ user, children }: DashboardLayoutClientProps) {
  const pathname = usePathname();
  const fullHeight = FULL_HEIGHT_ROUTES.some((route) => pathname === route || pathname.startsWith(`${route}/`));

  return (
    <DashboardUserProvider user={user}>
      <div
        className={
          fullHeight
            ? "iris-chat relative flex h-[100dvh] flex-col overflow-hidden bg-background text-foreground"
            : "iris-chat relative min-h-screen bg-background text-foreground"
        }
      >
        <Header />
        <div className={fullHeight ? "flex min-h-0 flex-1 flex-col pt-11 md:pt-14" : "pt-11 md:pt-14"}>{children}</div>
      </div>
    </DashboardUserProvider>
  );
}
