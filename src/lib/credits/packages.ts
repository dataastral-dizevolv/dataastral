export interface CreditPackage {
  id: "starter" | "popular" | "value";
  credits: 1 | 3 | 5;
  priceCents: number;
  badge?: string;
  savingsLabel?: string;
}

export const CREDIT_PACKAGES: CreditPackage[] = [
  {
    id: "starter",
    credits: 1,
    priceCents: 1290,
  },
  {
    id: "popular",
    credits: 3,
    priceCents: 3390,
    badge: "Mais Popular",
    savingsLabel: "Economize 12%",
  },
  {
    id: "value",
    credits: 5,
    priceCents: 4990,
    badge: "Melhor Valor",
    savingsLabel: "Economize 22%",
  },
];

export function getCreditPackageById(id: string) {
  return CREDIT_PACKAGES.find((item) => item.id === id);
}
