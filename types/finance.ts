import type { CurrencyCode, DateTimeValue } from "@/types/firestore";

export type PayoutStatus = "pending" | "available" | "paid" | "held" | "cancelled";

export interface Payout {
  readonly payoutId: string;
  readonly studioId: string;
  readonly orderIds: readonly string[];
  readonly grossAmount: number;
  readonly commissionAmount: number;
  readonly refundAmount: number;
  readonly netAmount: number;
  readonly currency: CurrencyCode;
  readonly status: PayoutStatus;
  readonly bankReference: string | null;
  readonly availableAt: DateTimeValue;
  readonly paidAt: DateTimeValue;
  readonly createdAt: DateTimeValue;
  readonly updatedAt: DateTimeValue;
}

export type CouponDiscountType = "fixed" | "percentage" | "freeShipping";

export interface CouponScope {
  readonly productIds: readonly string[];
  readonly categoryIds: readonly string[];
  readonly studioIds: readonly string[];
}

export interface Coupon {
  readonly couponId: string;
  readonly code: string;
  readonly discountType: CouponDiscountType;
  readonly value: number;
  readonly minimumOrderValue: number;
  readonly maximumDiscount: number | null;
  readonly scope: CouponScope;
  readonly startsAt: DateTimeValue;
  readonly endsAt: DateTimeValue;
  readonly usageLimit: number | null;
  readonly usageCount: number;
  readonly perCustomerLimit: number;
  readonly active: boolean;
  readonly createdAt: DateTimeValue;
  readonly updatedAt: DateTimeValue;
}
