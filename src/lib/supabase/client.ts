import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";

import { getSupabaseConfig } from "@/lib/supabase/config";

let browserClient: SupabaseClient | undefined;

export function createClient(): SupabaseClient {
  if (!browserClient) {
    const { supabaseUrl, supabasePublishableKey } = getSupabaseConfig();
    browserClient = createBrowserClient(supabaseUrl, supabasePublishableKey);
  }

  return browserClient!;
}
