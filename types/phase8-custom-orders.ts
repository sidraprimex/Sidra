export type CustomOrderStatus =
  | "draft"
  | "submitted"
  | "sellerReview"
  | "clarificationRequested"
  | "quoteSent"
  | "quoteAccepted"
  | "paymentPending"
  | "paid"
  | "inProduction"
  | "proofReady"
  | "revisionRequested"
  | "approved"
  | "readyToShip"
  | "shipped"
  | "delivered"
  | "completed"
  | "cancelled"
  | "disputed"
  | "refunded";

export type CustomOrderPaymentStatus =
  | "notSubmitted"
  | "pendingVerification"
  | "verified"
  | "rejected";

export interface CustomOrderBrief {
  readonly title: string;
  readonly description: string;
  readonly occasion: string;
  readonly colors: readonly string[];
  readonly dimensions: string;
  readonly personalizationText: string;
  readonly referenceImageUrls: readonly string[];
  readonly targetDeliveryDate: string;
  readonly budgetMinPaise: number | null;
  readonly budgetMaxPaise: number | null;
}

export interface CustomOrderQuote {
  readonly quoteId: string;
  readonly pricePaise: number;
  readonly shippingPaise: number;
  readonly totalPaise: number;
  readonly productionDays: number;
  readonly revisionLimit: number;
  readonly expiresAt: string;
  readonly terms: string;
  readonly createdAt: string;
  readonly acceptedAt: string | null;
}

export interface CustomOrderMessage {
  readonly messageId: string;
  readonly senderId: string;
  readonly senderRole: "customer" | "seller" | "founder" | "support";
  readonly body: string;
  readonly attachmentUrls: readonly string[];
  readonly createdAt: unknown;
}

export interface CustomOrderProof {
  readonly proofId: string;
  readonly imageUrls: readonly string[];
  readonly note: string;
  readonly revisionNumber: number;
  readonly status: "pendingApproval" | "approved" | "revisionRequested";
  readonly createdAt: string;
  readonly reviewedAt: string | null;
}

export interface CustomOrder {
  readonly customOrderId: string;
  readonly customerId: string;
  readonly customerName: string;
  readonly studioId: string;
  readonly studioName: string;
  readonly status: CustomOrderStatus;
  readonly brief: CustomOrderBrief;
  readonly quote: CustomOrderQuote | null;
  readonly messages: readonly CustomOrderMessage[];
  readonly proofs: readonly CustomOrderProof[];
  readonly paymentStatus: CustomOrderPaymentStatus;
  readonly paymentReference: string | null;
  readonly paymentSubmittedAt: unknown;
  readonly paymentVerifiedAt: unknown;
  readonly paymentVerifiedBy: string | null;
  readonly paymentReviewNote: string | null;
  readonly chatUnlocked: boolean;
  readonly linkedOrderId: string | null;
  readonly createdAt: unknown;
  readonly updatedAt: unknown;
}

export interface SubmitCustomOrderInput {
  readonly studioId: string;
  readonly brief: CustomOrderBrief;
}

export interface SendCustomQuoteInput {
  readonly customOrderId: string;
  readonly pricePaise: number;
  readonly shippingPaise: number;
  readonly productionDays: number;
  readonly revisionLimit: number;
  readonly expiresAt: string;
  readonly terms: string;
}

export interface CustomOrderMessageInput {
  readonly customOrderId: string;
  readonly body: string;
  readonly attachmentUrls: readonly string[];
}

export interface SubmitCustomOrderProofInput {
  readonly customOrderId: string;
  readonly imageUrls: readonly string[];
  readonly note: string;
}

export interface ReviewCustomOrderProofInput {
  readonly customOrderId: string;
  readonly proofId: string;
  readonly decision: "approve" | "requestRevision";
  readonly reason?: string;
}
