export type SupabasePublicConfig = {
  supabaseUrl: string;
  supabasePublishableKey: string;
};

export function tryGetSupabaseConfig(): SupabasePublicConfig | null {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() ?? "";
  const supabasePublishableKey = (
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY ??
    ""
  ).trim();

  if (!supabaseUrl || !supabasePublishableKey) {
    return null;
  }

  return { supabaseUrl, supabasePublishableKey };
}

export function getSupabaseConfig(): SupabasePublicConfig {
  const config = tryGetSupabaseConfig();

  if (!config) {
    throw new Error("Configuração de ambiente indisponível.");
  }

  return config;
}
