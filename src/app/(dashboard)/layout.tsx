import { redirect } from "next/navigation";

import { DashboardLayoutClient } from "@/components/dashboard/DashboardLayoutClient";
import { fetchDashboardUser } from "@/lib/auth/user";
import { createClient } from "@/lib/supabase/server";

export default async function DashboardLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const dashboardUser = await fetchDashboardUser(supabase, user);

  return <DashboardLayoutClient user={dashboardUser}>{children}</DashboardLayoutClient>;
}
