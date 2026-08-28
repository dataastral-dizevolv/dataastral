"use client";

import { useEffect, useState } from "react";

import { tryCreateClient } from "@/lib/supabase/client";

/** `undefined` while resolving, then the user id or `null` if signed out. */
export function useAuthUserId() {
  const [userId, setUserId] = useState<string | null | undefined>(undefined);

  useEffect(() => {
    const supabase = tryCreateClient();
    if (!supabase) {
      setUserId(null);
      return;
    }
    supabase.auth.getUser().then(({ data }) => {
      setUserId(data.user?.id ?? null);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setUserId(session?.user?.id ?? null);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  return userId;
}
