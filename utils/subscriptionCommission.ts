import {
  SELLER_PLANS,
  type SellerSubscriptionPlan,
} from "@/types/seller-subscription";

export function commissionRateForPlan(
  plan: SellerSubscriptionPlan,
  configuredBasisPoints?: number,
): number {
  const maximum = SELLER_PLANS[plan].maximumCommissionBasisPoints;
  if (configuredBasisPoints === undefined) return maximum;
  return Math.min(maximum, Math.max(0, Math.round(configuredBasisPoints)));
}

export function calculateProfitCommission(params: {
  readonly sellingSubtotalPaise: number;
  readonly sellerCostPaise: number;
  readonly plan: SellerSubscriptionPlan;
  readonly configuredBasisPoints?: number;
}): {
  readonly profitPaise: number;
  readonly commissionBasisPoints: number;
  readonly commissionPaise: number;
  readonly sellerProfitAfterCommissionPaise: number;
} {
  const profitPaise = Math.max(
    0,
    Math.round(params.sellingSubtotalPaise) -
      Math.round(params.sellerCostPaise),
  );
  const commissionBasisPoints = commissionRateForPlan(
    params.plan,
    params.configuredBasisPoints,
  );
  const commissionPaise = Math.min(
    profitPaise,
    Math.round((profitPaise * commissionBasisPoints) / 10_000),
  );
  return {
    profitPaise,
    commissionBasisPoints,
    commissionPaise,
    sellerProfitAfterCommissionPaise: profitPaise - commissionPaise,
  };
}
