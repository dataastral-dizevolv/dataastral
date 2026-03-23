import { createClient } from "@/lib/supabase/server";

export async function requireAdminUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { user: null, isAdmin: false };
  }

  const { data: profileRow } = await supabase.from("user_profiles").select("role, active").eq("id", user.id).maybeSingle();

  if (profileRow?.active === false) {
    return { user, isAdmin: false };
  }

  const { data: rpcData, error: rpcError } = await supabase.rpc("is_admin", { user_id: user.id });

  let isAdmin = rpcData === true;

  if (rpcError || !isAdmin) {
    isAdmin = profileRow?.role === "admin";
  }

  return { user, isAdmin };
}
