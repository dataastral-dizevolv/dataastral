import { redirect } from "next/navigation";

import { AdminLayoutClient } from "@/components/admin/AdminLayoutClient";
import { requireAdminUser } from "@/lib/auth/admin";

export default async function AdminLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const { user, isAdmin } = await requireAdminUser();

  if (!user) {
    redirect("/login");
  }

  if (!isAdmin) {
    redirect("/dashboard");
  }

  return <AdminLayoutClient userName={user.user_metadata?.full_name ?? user.email ?? "Admin"} userEmail={user.email ?? ""}>{children}</AdminLayoutClient>;
}
