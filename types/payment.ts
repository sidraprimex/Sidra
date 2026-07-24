import type { CurrencyCode, DateTimeValue } from "@/types/firestore";

export type PaymentState = "initiated" | "succeeded" | "failed" | "refunded" | "partiallyRefunded";

export interface Payment {
  readonly paymentId: string;
  readonly orderId: string | null;
  readonly gateway: string;
  readonly amount: number;
  readonly currency: CurrencyCode;
  readonly status: PaymentState;
  readonly gatewayTransactionId: string | null;
  readonly gatewayResponseRaw?: Readonly<Record<string, unknown>>;
  readonly createdAt: DateTimeValue;
}
