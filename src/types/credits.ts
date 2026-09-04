export type CreditTransactionType = "purchase" | "usage" | "bonus";

export interface CreditTransactionItem {
  id: string;
  amount: number;
  type: CreditTransactionType;
  description: string | null;
  createdAt: string;
}

export type CheckoutUiMode = "hosted" | "embedded";

export interface BuyCreditsResponse {
  packageId: string;
  uiMode?: CheckoutUiMode;
  /** Present when uiMode is hosted (default). */
  checkoutUrl?: string;
  /** Present when uiMode is embedded. */
  clientSecret?: string;
}

export interface CreditPackageItem {
  id: string;
  label: string;
  credits: number;
  priceCents: number;
  badge: string | null;
}
