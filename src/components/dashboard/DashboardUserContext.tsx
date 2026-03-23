"use client";

import { createContext, useContext } from "react";
import useSWR from "swr";

import type { DashboardUser } from "@/lib/auth/user";
import type { DashboardMeResponse } from "@/types/dashboard";

export const DASHBOARD_ME_KEY = "/api/dashboard/me";

const DashboardUserContext = createContext<{
  user: DashboardUser;
  loading: boolean;
  refresh: () => Promise<DashboardMeResponse | undefined>;
} | null>(null);

interface DashboardUserProviderProps {
  user: DashboardUser;
  children: React.ReactNode;
}

const fetcher = async (url: string) => {
  const response = await fetch(url, { credentials: "include" });

  if (!response.ok) {
    throw new Error("Falha ao carregar dados do usuario.");
  }

  return (await response.json()) as DashboardMeResponse;
};

export function DashboardUserProvider({ user, children }: DashboardUserProviderProps) {
  const { data, isLoading, mutate } = useSWR<DashboardMeResponse>(DASHBOARD_ME_KEY, fetcher, {
    fallbackData: user,
    revalidateOnFocus: true,
    revalidateOnReconnect: true,
    dedupingInterval: 4000,
  });

  const resolvedUser: DashboardUser = {
    id: data?.id ?? user.id,
    nome: data?.nome ?? user.nome,
    email: data?.email ?? user.email,
    role: data?.role ?? user.role,
    credits: data?.credits ?? user.credits,
    birthDate: data?.birthDate ?? user.birthDate,
    birthTime: data?.birthTime ?? user.birthTime,
    birthLocation: data?.birthLocation ?? user.birthLocation,
    birthTimezone: data?.birthTimezone ?? user.birthTimezone,
    birthLat: data?.birthLat ?? user.birthLat,
    birthLng: data?.birthLng ?? user.birthLng,
  };

  return (
    <DashboardUserContext.Provider
      value={{
        user: resolvedUser,
        loading: isLoading,
        refresh: async () => await mutate(),
      }}
    >
      {children}
    </DashboardUserContext.Provider>
  );
}

export function useDashboardUser() {
  const context = useContext(DashboardUserContext);

  if (!context) {
    throw new Error("useDashboardUser precisa ser usado dentro de DashboardUserProvider.");
  }

  return context;
}

export function useOptionalDashboardUser() {
  return useContext(DashboardUserContext);
}
