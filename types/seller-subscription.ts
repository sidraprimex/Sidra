import type { DateTimeValue } from "@/types/firestore";

export type SellerSubscriptionPlan =
  | "commission"
  | "monthly500"
  | "monthly2000";

export const SELLER_PLANS: Readonly<Record<SellerSubscriptionPlan, {
  readonly label: string;
  readonly monthlyFeePaise: number;
  readonly maximumCommissionBasisPoints: number;
}>> = {
  commission: {
    label: "Commission only",
    monthlyFeePaise: 0,
    maximumCommissionBasisPoints: 1200,
  },
  monthly500: {
    label: "₹500 monthly",
    monthlyFeePaise: 50_000,
    maximumCommissionBasisPoints: 1000,
  },
  monthly2000: {
    label: "₹2,000 monthly",
    monthlyFeePaise: 200_000,
    maximumCommissionBasisPoints: 200,
  },
};

export interface SellerSubscriptionRequest {
  readonly id: string;
  readonly studioId: string;
  readonly sellerUid: string;
  readonly plan: SellerSubscriptionPlan;
  readonly monthlyFeePaise: number;
  readonly maximumCommissionBasisPoints: number;
  readonly paymentReference: string | null;
  readonly status: "pending" | "approved" | "rejected";
  readonly adminNote: string | null;
  readonly reviewedBy: string | null;
  readonly createdAt: DateTimeValue;
  readonly updatedAt: DateTimeValue;
}
