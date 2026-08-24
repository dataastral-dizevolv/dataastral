export type RefundRequestStatus = "pending" | "approved" | "rejected";

export interface RefundRequestItem {
  id: string;
  amount: number;
  reason: string | null;
  status: RefundRequestStatus;
  createdAt: string;
}

export interface RefundsMeResponse {
  credits: number;
  requests: RefundRequestItem[];
}

export interface CreateRefundRequestBody {
  amount?: number;
  reason?: string;
}

export interface CreateRefundResponse {
  ok: true;
  request: RefundRequestItem;
}
