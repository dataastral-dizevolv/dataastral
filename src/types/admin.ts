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
  email: string;
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
