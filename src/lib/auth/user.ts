import type { User } from "@supabase/supabase-js";

export type UserRole = "user" | "admin";

export interface DashboardUser {
  id: string;
  nome: string;
  email: string;
  role: UserRole;
  credits: number;
  birthDate: string | null;
  birthTime: string | null;
  birthLocation: string | null;
  birthTimezone: string | null;
  birthLat: number | null;
  birthLng: number | null;
}

interface DashboardUserProfileRow {
  full_name?: string | null;
  role?: string | null;
}

interface DashboardProfileRow {
  full_name?: string | null;
  credits?: number | null;
  birth_date?: string | null;
  birth_time?: string | null;
  birth_location?: string | null;
  birth_timezone?: string | null;
  birth_lat?: number | null;
  birth_lng?: number | null;
}

interface DashboardSupabaseClient {
  from: (table: "user_profiles" | "profiles") => {
    select: (columns: string) => {
      eq: (column: "id", value: string) => {
        maybeSingle: () => Promise<{ data: DashboardUserProfileRow | DashboardProfileRow | null }>;
      };
    };
  };
}

function getUserMetadataFullName(user: User) {
  const metadata = user.user_metadata;

  if (!metadata || typeof metadata !== "object") {
    return null;
  }

  const fullName = Reflect.get(metadata, "full_name");

  if (typeof fullName !== "string") {
    return null;
  }

  const trimmed = fullName.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function getProfileFullName(value: string | null | undefined) {
  if (!value) {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function getEmailPrefix(user: User) {
  const prefix = user.email?.split("@")[0]?.trim();
  return prefix && prefix.length > 0 ? prefix : "Usuário";
}

export function buildDashboardUser(
  user: User,
  profile: DashboardUserProfileRow | null,
  profileData: DashboardProfileRow | null,
): DashboardUser {
  return {
    id: user.id,
    nome:
      getProfileFullName(profileData?.full_name) ??
      getProfileFullName(profile?.full_name) ??
      getUserMetadataFullName(user) ??
      getEmailPrefix(user),
    email: user.email ?? "",
    role: profile?.role === "admin" ? "admin" : "user",
    credits: profileData?.credits ?? 0,
    birthDate: profileData?.birth_date ?? null,
    birthTime: profileData?.birth_time ?? null,
    birthLocation: profileData?.birth_location ?? null,
    birthTimezone: profileData?.birth_timezone ?? null,
    birthLat: profileData?.birth_lat ?? null,
    birthLng: profileData?.birth_lng ?? null,
  };
}

export async function fetchDashboardUser(supabase: unknown, user: User): Promise<DashboardUser> {
  const client = supabase as DashboardSupabaseClient;

  const [{ data: profile }, { data: profileData }] = await Promise.all([
    client.from("user_profiles").select("full_name, role").eq("id", user.id).maybeSingle(),
    client
      .from("profiles")
      .select("credits, full_name, birth_date, birth_time, birth_location, birth_timezone, birth_lat, birth_lng")
      .eq("id", user.id)
      .maybeSingle(),
  ]);

  return buildDashboardUser(user, profile as DashboardUserProfileRow | null, profileData as DashboardProfileRow | null);
}
