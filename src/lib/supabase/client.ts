import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";

import { tryGetSupabaseConfig } from "@/lib/supabase/config";

let browserClient: SupabaseClient | undefined;

export function tryCreateClient(): SupabaseClient | null {
  if (browserClient) {
    return browserClient;
  }

  const config = tryGetSupabaseConfig();
  if (!config) {
    return null;
  }

  browserClient = createBrowserClient(config.supabaseUrl, config.supabasePublishableKey);
  return browserClient;
}

export function createClient(): SupabaseClient {
  const client = tryCreateClient();

  if (!client) {
    throw new Error("Configuração de ambiente indisponível.");
  }

  return client;
}
