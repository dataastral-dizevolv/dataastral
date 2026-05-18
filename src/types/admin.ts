export interface EngineAuditLogItem {
  id: string;
  userId: string;
  theme: string | null;
  question: string | null;
  success: boolean;
  engineCode: string | null;
  executionTimeMs: number | null;
  technicalDetails: Record<string, unknown> | null;
  createdAt: string;
}

export interface AdminUserRow {
  id: string;
  fullName: string | null;
  email: string | null;
  role: "admin" | "user";
  active: boolean;
  credits: number;
  birthDate: string | null;
  birthTimezone: string | null;
  createdAt: string;
}

export interface AdminDashboardMetrics {
  grossRevenue: number;
  salesVolume: number;
  creditsInCirculation: number;
  range: "7d" | "30d" | "90d";
  signupSeries: Array<{
    date: string;
    count: number;
  }>;
  salesSeries: Array<{
    date: string;
    count: number;
  }>;
  deltas: {
    revenuePercent: number | null;
    salesPercent: number | null;
    creditsPercent: number | null;
  };
}

export type AdminCalculatorQuestionType = "select" | "text" | "checkbox";

export interface AdminCalculatorQuestion {
  id: number;
  category: "amor" | "carreira" | "financas" | "saude" | "familia" | "viagens";
  label: string;
  fieldName: string;
  type: AdminCalculatorQuestionType;
  options: Array<{ value: string; label: string }>;
  order: number;
  isRequired: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export interface AdminCreditPackage {
  id: string;
  label: string;
  credits: number;
  priceCents: number;
  stripePriceId: string | null;
  badge: string | null;
  isActive: boolean;
  order: number;
}
