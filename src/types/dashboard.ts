import type { UserRole } from "@/lib/auth/user";

export interface DashboardMeResponse {
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
  phone: string | null;
  phoneCountry: string | null;
  whatsapp: string | null;
  pendingDeletionScheduledFor: string | null;
}

export interface PredictionHistoryItem {
  id: string;
  theme: string;
  question: string;
  prediction: string;
  eventDateIso: string | null;
  createdAt: string;
}

export interface PredictionHistoryWithCountResponse {
  items: PredictionHistoryItem[];
  total: number;
}

export type EphemerisEventType = "tensao" | "harmonia" | "portal" | "neutro";

export interface EphemerisEvent {
  id: string;
  data: string;
  titulo: string;
  descricao: string;
  tipo: EphemerisEventType;
  planeta?: string;
  aspecto?: string;
}
