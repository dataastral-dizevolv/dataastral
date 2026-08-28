import { NextResponse } from "next/server";

import { getCreditPackages } from "@/lib/credits/packages";
import { tryGetSupabaseConfig } from "@/lib/supabase/config";
import type { CreditPackageItem } from "@/types/credits";

export const runtime = "nodejs";

export async function GET() {
  try {
    if (!tryGetSupabaseConfig() || !process.env.SUPABASE_SERVICE_ROLE_KEY?.trim()) {
      return NextResponse.json({ error: "Pacotes indisponíveis." }, { status: 503 });
    }

    const packages = await getCreditPackages({ onlyActive: true });
    const payload: CreditPackageItem[] = packages.map((item) => ({
      id: item.id,
      label: item.label,
      credits: item.credits,
      priceCents: item.priceCents,
      badge: item.badge,
    }));

    return NextResponse.json(payload);
  } catch {
    return NextResponse.json({ error: "Falha ao carregar pacotes de créditos." }, { status: 500 });
  }
}
