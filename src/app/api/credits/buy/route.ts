import { NextResponse, type NextRequest } from "next/server";

import { getCreditPackageById } from "@/lib/credits/packages";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import type { BuyCreditsResponse } from "@/types/credits";

interface BuyCreditsRequestBody {
  packageId?: string;
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }

  const body = (await request.json().catch(() => ({}))) as BuyCreditsRequestBody;
  const selectedPackage = getCreditPackageById(body.packageId ?? "");

  if (!selectedPackage) {
    return NextResponse.json({ error: "Pacote de créditos inválido." }, { status: 400 });
  }

  let adminClient: ReturnType<typeof createAdminClient>;

  try {
    adminClient = createAdminClient();
  } catch {
    return NextResponse.json({ error: "Servidor sem configuração de compra." }, { status: 500 });
  }

  const { data: updatedCredits, error: updateError } = await adminClient.rpc("add_profile_credits", {
    p_user_id: user.id,
    p_amount: selectedPackage.credits,
    p_type: "purchase",
    p_description: `Compra simulada de ${selectedPackage.credits} crédito(s)`,
  });

  if (updateError || updatedCredits === null) {
    return NextResponse.json({ error: "Falha ao processar compra de créditos." }, { status: 500 });
  }

  const payload: BuyCreditsResponse = {
    credits: updatedCredits,
    addedCredits: selectedPackage.credits,
    packageId: selectedPackage.id,
  };

  return NextResponse.json(payload);
}
