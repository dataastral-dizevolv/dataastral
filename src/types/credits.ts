export type CreditTransactionType = "purchase" | "usage" | "bonus";

export interface CreditTransactionItem {
  id: string;
  amount: number;
  type: CreditTransactionType;
  description: string | null;
  createdAt: string;
}

export interface BuyCreditsResponse {
  packageId: string;
  checkoutUrl: string;
}

export interface CreditPackageItem {
  id: string;
  label: string;
  credits: number;
  priceCents: number;
  badge: string | null;
}
