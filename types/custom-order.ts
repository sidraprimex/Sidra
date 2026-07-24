import type { AuditedDocument, DateTimeValue } from "@/types/firestore";

export type CustomOrderStatus = "submitted" | "assigned" | "inDiscussion" | "quoted" | "accepted" | "paymentPending" | "paid" | "inProduction" | "shipped" | "completed" | "rejected" | "cancelled";

export interface BudgetRange {
  readonly minimum: number;
  readonly maximum: number;
}

export interface CustomOrderRequest extends AuditedDocument {
  readonly requestId: string;
  readonly customerId: string;
  readonly assignedStudioId: string | null;
  readonly category: string;
  readonly description: string;
  readonly budgetRange: BudgetRange;
  readonly deadline: DateTimeValue;
  readonly referenceImageUrls: readonly string[];
  readonly conversationId: string | null;
  readonly quotedPrice: number | null;
  readonly acceptedPrice: number | null;
  readonly status: CustomOrderStatus;
  readonly paymentId: string | null;
  readonly revisionCount: number;
}
