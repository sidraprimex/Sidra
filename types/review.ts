import type { DateTimeValue } from "@/types/firestore";

export type ReviewModerationStatus = "visible" | "hidden" | "flagged";

export interface Review {
  readonly reviewId: string;
  readonly customerId: string;
  readonly studioId: string;
  readonly productId: string;
  readonly orderId: string;
  readonly rating: 1 | 2 | 3 | 4 | 5;
  readonly title: string;
  readonly body: string;
  readonly imageUrls: readonly string[];
  readonly verifiedPurchase: boolean;
  readonly moderationStatus: ReviewModerationStatus;
  readonly createdAt: DateTimeValue;
  readonly editableUntil: DateTimeValue;
  readonly sellerResponse?: string | null;
}

export interface CreateReviewInput {
  readonly orderId: string;
  readonly productId: string;
  readonly rating: 1 | 2 | 3 | 4 | 5;
  readonly title: string;
  readonly body: string;
  readonly imageUrls: readonly string[];
}
