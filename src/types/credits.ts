export type CreditTransactionType = "purchase" | "usage" | "bonus";

export interface CreditTransactionItem {
  id: string;
  amount: number;
  type: CreditTransactionType;
  description: string | null;
  createdAt: string;
}

export interface BuyCreditsResponse {
  credits: number;
  addedCredits: number;
  packageId: string;
}
