import type { DateTimeValue } from "@/types/firestore";

export type SellerSubscriptionPlan =
  | "free"
  | "starter"
  | "growth"
  | "luxury"
  | "custom";

export const SELLER_PLANS: Readonly<Record<SellerSubscriptionPlan, {
  readonly label: string;
  readonly monthlyFeePaise: number;
  readonly originalMonthlyFeePaise: number;
  readonly maximumCommissionBasisPoints: number;
  readonly commissionMode: "fixed" | "range" | "custom";
}>> = {
  free: {
    label: "Free",
    monthlyFeePaise: 0,
    originalMonthlyFeePaise: 0,
    maximumCommissionBasisPoints: 1200,
    commissionMode: "fixed",
  },
  starter: {
    label: "Starter launch offer",
    monthlyFeePaise: 50_000,
    originalMonthlyFeePaise: 250_000,
    maximumCommissionBasisPoints: 1000,
    commissionMode: "range",
  },
  growth: {
    label: "Growth launch offer",
    monthlyFeePaise: 250_000,
    originalMonthlyFeePaise: 550_000,
    maximumCommissionBasisPoints: 400,
    commissionMode: "fixed",
  },
  luxury: {
    label: "Luxury Elite",
    monthlyFeePaise: 750_000,
    originalMonthlyFeePaise: 750_000,
    maximumCommissionBasisPoints: 100,
    commissionMode: "fixed",
  },
  custom: {
    label: "Custom",
    monthlyFeePaise: 0,
    originalMonthlyFeePaise: 0,
    maximumCommissionBasisPoints: 0,
    commissionMode: "custom",
  },
};

export interface SellerPlanDefinition {
  readonly id: SellerSubscriptionPlan;
  readonly label: string;
  readonly description: string;
  readonly enabled: boolean;
  readonly monthlyFeePaise: number;
  readonly originalMonthlyFeePaise: number;
  readonly commissionBasisPoints: number;
  readonly maximumCommissionBasisPoints: number;
  readonly commissionMode: "fixed" | "range" | "custom";
  readonly benefits: readonly string[];
}

export interface SellerCommerceSettings {
  readonly plans: readonly SellerPlanDefinition[];
  readonly onboardingFeePaise: number;
  readonly installmentAmountsPaise: readonly number[];
  readonly installmentGraceDays: number;
  readonly overdueRestrictionMode: "remindersOnly" | "gradual" | "manual";
  readonly productionFundingMode: "none" | "staged" | "fullCost";
  readonly materialAdvancePercent: number;
  readonly makingAdvancePercent: number;
  readonly disputeWindowDays: number;
}

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

export interface SellerInstallmentSchedule {
  readonly studioId: string;
  readonly sellerUid: string;
  readonly applicationId: string;
  readonly totalPaise: number;
  readonly paidPaise: number;
  readonly accessMode: "full";
  readonly overdueRestrictionMode: "remindersOnly" | "gradual" | "manual";
  readonly status: "active" | "paid" | "overdue" | "waived";
  readonly installments: readonly {
    readonly number: number;
    readonly amountPaise: number;
    readonly status: "pending" | "submitted" | "paid" | "overdue" | "waived";
  }[];
}
