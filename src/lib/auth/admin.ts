import { tryGetSupabaseConfig } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";

export async function requireAdminUser() {
  if (!tryGetSupabaseConfig()) {
    return { user: null, isAdmin: false };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { user: null, isAdmin: false };
  }

  const { data: rpcData, error: rpcError } = await supabase.rpc("is_admin", { user_id: user.id });
  const isAdmin = !rpcError && rpcData === true;
  return { user, isAdmin };
}
