import { NextResponse } from "next/server";

import { getCreditPackages } from "@/lib/credits/packages";
import type { CreditPackageItem } from "@/types/credits";

export const runtime = "nodejs";

export async function GET() {
  try {
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
