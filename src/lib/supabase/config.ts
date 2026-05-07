export function getSupabaseConfig() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabasePublishableKey =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY;

  if (!supabaseUrl) {
    throw new Error("Configuração de ambiente indisponível.");
  }

  if (!supabasePublishableKey) {
    throw new Error("Configuração de ambiente indisponível.");
  }

  return {
    supabaseUrl,
    supabasePublishableKey,
  };
}
