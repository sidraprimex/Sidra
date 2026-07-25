export type CampaignStatus = "draft" | "scheduled" | "active" | "paused" | "completed" | "cancelled";
export type CouponDiscountType = "percentage" | "fixed";
export type CustomerSegmentRule = "all" | "repeatCustomers" | "highValue" | "inactive" | "wishlistIntent";

export interface SellerAnalyticsSummary {
  readonly grossSalesPaise: number;
  readonly netSalesPaise: number;
  readonly orderCount: number;
  readonly customOrderCount: number;
  readonly averageOrderValuePaise: number;
  readonly conversionRate: number;
  readonly repeatCustomerRate: number;
  readonly refundRate: number;
  readonly wishlistCount: number;
  readonly followerCount: number;
}
export interface SellerCoupon {
  readonly couponId: string;
  readonly studioId: string;
  readonly code: string;
  readonly title: string;
  readonly discountType: CouponDiscountType;
  readonly discountValue: number;
  readonly minimumOrderPaise: number;
  readonly active: boolean;
  readonly usedCount: number;
  readonly createdAt: string;
}
export interface CustomerSegment {
  readonly segmentId: string;
  readonly studioId: string;
  readonly name: string;
  readonly description: string;
  readonly rule: CustomerSegmentRule;
  readonly customerCount: number;
  readonly createdAt: string;
}
export interface SellerCampaign {
  readonly campaignId: string;
  readonly studioId: string;
  readonly name: string;
  readonly subject: string;
  readonly message: string;
  readonly segmentId: string;
  readonly status: CampaignStatus;
  readonly sentCount: number;
  readonly deliveredCount: number;
  readonly openedCount: number;
  readonly clickedCount: number;
  readonly createdAt: string;
}
