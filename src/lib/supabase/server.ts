import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { SupabaseClient } from "@supabase/supabase-js";

import { tryGetSupabaseConfig } from "@/lib/supabase/config";

export async function tryCreateClient(): Promise<SupabaseClient | null> {
  const config = tryGetSupabaseConfig();
  if (!config) {
    return null;
  }

  const cookieStore = await cookies();

  return createServerClient(config.supabaseUrl, config.supabasePublishableKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        } catch {
          // Ignorado em contextos onde set cookie não é permitido.
        }
      },
    },
  });
}

export async function createClient() {
  const client = await tryCreateClient();
  if (!client) {
    throw new Error("Configuração de ambiente indisponível.");
  }
  return client;
}
