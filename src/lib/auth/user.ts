import type { User } from "@supabase/supabase-js";

export type UserRole = "user" | "admin";

export interface DashboardUser {
  id: string;
  nome: string;
  email: string;
  role: UserRole;
  credits: number;
  freeQuestionsRemaining: number;
  referralCode: string | null;
  referralPoints: number;
  birthDate: string | null;
  birthTime: string | null;
  birthLocation: string | null;
  birthTimezone: string | null;
  birthLat: number | null;
  birthLng: number | null;
  phone: string | null;
  phoneCountry: string | null;
  whatsapp: string | null;
  pendingDeletionScheduledFor: string | null;
}

interface DashboardUserProfileRow {
  full_name?: string | null;
  role?: string | null;
}

interface DashboardProfileRow {
  full_name?: string | null;
  credits?: number | null;
  free_questions_remaining?: number | null;
  referral_code?: string | null;
  referral_points?: number | null;
  birth_date?: string | null;
  birth_time?: string | null;
  birth_location?: string | null;
  birth_timezone?: string | null;
  birth_lat?: number | null;
  birth_lng?: number | null;
  phone?: string | null;
  phone_country?: string | null;
  whatsapp?: string | null;
}

interface DashboardPendingDeletionRow {
  scheduled_for?: string | null;
}

interface DashboardSupabaseClient {
  from: (table: "user_profiles" | "profiles" | "pending_deletions") => {
    select: (columns: string) => {
      eq: (column: "id" | "user_id", value: string) => {
        maybeSingle: () => Promise<{
          data: DashboardUserProfileRow | DashboardProfileRow | DashboardPendingDeletionRow | null;
        }>;
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
  pendingDeletion: DashboardPendingDeletionRow | null = null,
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
    freeQuestionsRemaining: profileData?.free_questions_remaining ?? 0,
    referralCode: profileData?.referral_code ?? null,
    referralPoints: profileData?.referral_points ?? 0,
    birthDate: profileData?.birth_date ?? null,
    birthTime: profileData?.birth_time ?? null,
    birthLocation: profileData?.birth_location ?? null,
    birthTimezone: profileData?.birth_timezone ?? null,
    birthLat: profileData?.birth_lat ?? null,
    birthLng: profileData?.birth_lng ?? null,
    phone: profileData?.phone ?? null,
    phoneCountry: profileData?.phone_country ?? "+55",
    whatsapp: profileData?.whatsapp ?? null,
    pendingDeletionScheduledFor: pendingDeletion?.scheduled_for ?? null,
  };
}

export async function fetchDashboardUser(supabase: unknown, user: User): Promise<DashboardUser> {
  const client = supabase as DashboardSupabaseClient;

  const [{ data: profile }, { data: profileData }, { data: pendingDeletion }] = await Promise.all([
    client.from("user_profiles").select("full_name, role").eq("id", user.id).maybeSingle(),
    client
      .from("profiles")
      .select(
        "credits, free_questions_remaining, referral_code, referral_points, full_name, birth_date, birth_time, birth_location, birth_timezone, birth_lat, birth_lng, phone, phone_country, whatsapp",
      )
      .eq("id", user.id)
      .maybeSingle(),
    client.from("pending_deletions").select("scheduled_for").eq("user_id", user.id).maybeSingle(),
  ]);

  return buildDashboardUser(
    user,
    profile as DashboardUserProfileRow | null,
    profileData as DashboardProfileRow | null,
    pendingDeletion as DashboardPendingDeletionRow | null,
  );
}
