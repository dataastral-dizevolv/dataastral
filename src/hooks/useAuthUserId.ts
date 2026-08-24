"use client";

import { useEffect, useState } from "react";

import { createClient } from "@/lib/supabase/client";

/** `undefined` while resolving, then the user id or `null` if signed out. */
export function useAuthUserId() {
  const [userId, setUserId] = useState<string | null | undefined>(undefined);

  useEffect(() => {
    const supabase = createClient();
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
