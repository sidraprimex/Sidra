export type ReviewStatus = "pending" | "published" | "rejected" | "hidden";
export type FollowTargetType = "studio";

export interface ProductReview {
  readonly reviewId: string;
  readonly orderId: string;
  readonly productId: string;
  readonly productSlug: string;
  readonly productName: string;
  readonly customerId: string;
  readonly customerName: string;
  readonly studioId: string;
  readonly rating: 1 | 2 | 3 | 4 | 5;
  readonly title: string;
  readonly body: string;
  readonly imageUrls: readonly string[];
  readonly status: ReviewStatus;
  readonly verifiedPurchase: true;
  readonly sellerResponse: string | null;
  readonly sellerRespondedAt: string | null;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface ReviewSubmissionInput {
  readonly orderId: string;
  readonly productId: string;
  readonly rating: 1 | 2 | 3 | 4 | 5;
  readonly title: string;
  readonly body: string;
  readonly imageUrls: readonly string[];
}

export interface StudioFollow {
  readonly followId: string;
  readonly customerId: string;
  readonly studioId: string;
  readonly targetType: FollowTargetType;
  readonly createdAt: string;
}

export interface WishlistItem {
  readonly wishlistItemId: string;
  readonly customerId: string;
  readonly productId: string;
  readonly productSlug: string;
  readonly productName: string;
  readonly imageUrl: string | null;
  readonly studioId: string;
  readonly studioName: string;
  readonly pricePaise: number;
  readonly createdAt: string;
}

export interface CustomerDashboardSummary {
  readonly activeOrderCount: number;
  readonly deliveredOrderCount: number;
  readonly customOrderCount: number;
  readonly wishlistCount: number;
  readonly followedStudioCount: number;
  readonly pendingReviewCount: number;
  readonly unreadNotificationCount: number;
}

export interface CustomerNotification {
  readonly notificationId: string;
  readonly type: string;
  readonly title: string;
  readonly body: string;
  readonly href: string | null;
  readonly read: boolean;
  readonly createdAt: string;
}
