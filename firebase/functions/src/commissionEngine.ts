export interface CommissionConfig {
  readonly mode: "percentage" | "flat" | "category" | "subscriptionTier";
  readonly percentageBasisPoints?: number;
  readonly flatPaise?: number;
  readonly categoryBasisPoints?: Readonly<Record<string, number>>;
  readonly subscriptionTierBasisPoints?: Readonly<Record<string, number>>;
}

export function calculateCommissionPaise(
  grossPaise: number,
  config: CommissionConfig,
  categoryId: string,
  subscriptionTier: string,
): number {
  if (grossPaise < 0) throw new Error("Gross amount cannot be negative.");
  if (config.mode === "flat") return Math.min(grossPaise, Math.max(0, config.flatPaise ?? 0));
  const basisPoints = config.mode === "category"
    ? config.categoryBasisPoints?.[categoryId] ?? config.percentageBasisPoints ?? 0
    : config.mode === "subscriptionTier"
      ? config.subscriptionTierBasisPoints?.[subscriptionTier] ?? config.percentageBasisPoints ?? 0
      : config.percentageBasisPoints ?? 0;
  return Math.min(grossPaise, Math.round(grossPaise * Math.max(0, basisPoints) / 10_000));
}
