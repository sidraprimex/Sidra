import { doc, getDoc, onSnapshot, type Unsubscribe } from "firebase/firestore";
import { requireFirebaseServices } from "@/services/firebaseClient";
import { SELLER_PLANS, type SellerCommerceSettings, type SellerPlanDefinition } from "@/types/seller-subscription";
import type { LogisticsSettings, SellerKycSettings } from "@/types/logistics";

export const defaultSellerPlans: readonly SellerPlanDefinition[] = (
  Object.entries(SELLER_PLANS) as Array<
    [SellerPlanDefinition["id"], (typeof SELLER_PLANS)[SellerPlanDefinition["id"]]]
  >
).map(([id, plan]) => ({
  id,
  label: plan.label,
  description:
    id === "free"
      ? "No monthly fee. Fixed platform commission on verified profit."
      : id === "custom"
        ? "A founder-configured plan for negotiated Studio requirements."
        : "Lower platform commission and expanded Studio tools.",
  enabled: true,
  monthlyFeePaise: plan.monthlyFeePaise,
  originalMonthlyFeePaise: plan.originalMonthlyFeePaise,
  commissionBasisPoints: plan.maximumCommissionBasisPoints,
  maximumCommissionBasisPoints: plan.maximumCommissionBasisPoints,
  commissionMode: plan.commissionMode,
  benefits:
    id === "luxury"
      ? ["All Studio tools", "Priority support", "Lowest standard commission"]
      : ["Studio dashboard", "Orders and payouts", "Coupons and campaigns"],
}));

export const defaultSellerCommerceSettings: SellerCommerceSettings = {
  plans: defaultSellerPlans,
  onboardingFeePaise: 200_000,
  installmentAmountsPaise: [66_700, 66_700, 66_600],
  installmentGraceDays: 7,
  overdueRestrictionMode: "gradual",
  productionFundingMode: "staged",
  materialAdvancePercent: 50,
  makingAdvancePercent: 50,
  disputeWindowDays: 3,
};

export const defaultLogisticsSettings: LogisticsSettings = {
  enabled: true,
  primaryProvider: "delhivery",
  backupProvider: "none",
  defaultPickupLocation: "",
  shippingCostAllocation: "buyerPaid",
  sellerShareBasisPoints: 0,
  buyerShareBasisPoints: 10_000,
  requireDeliveryOtp: true,
  protectHighValueShipments: true,
  protectThresholdPaise: 300_000,
  pickupLeadHours: 4,
  ndrMaxReattempts: 2,
  buyerCancellationFeePaise: 0,
  buyerCausedReturnRecoveryEnabled: true,
  claimWindowHours: 72,
};

export const defaultSellerKycSettings: SellerKycSettings = {
  enabled: true,
  level: "standard",
  requirePan: true,
  requireIdentityProof: true,
  acceptedIdentityProofs: ["aadhaar", "voterId", "passport"],
  requireBankDetails: true,
  requirePickupAddress: true,
  documentStorageProvider: "b2",
};

export async function getSellerCommerceSettings(): Promise<SellerCommerceSettings> {
  const { db } = requireFirebaseServices();
  const snapshot = await getDoc(doc(db, "settings", "sellerCommerce"));
  return snapshot.exists()
    ? { ...defaultSellerCommerceSettings, ...snapshot.data() } as SellerCommerceSettings
    : defaultSellerCommerceSettings;
}

export function watchSellerCommerceSettings(
  onValue: (value: SellerCommerceSettings) => void,
  onError?: (error: Error) => void,
): Unsubscribe {
  const { db } = requireFirebaseServices();
  return onSnapshot(
    doc(db, "settings", "sellerCommerce"),
    (snapshot) => onValue(snapshot.exists()
      ? { ...defaultSellerCommerceSettings, ...snapshot.data() } as SellerCommerceSettings
      : defaultSellerCommerceSettings),
    onError,
  );
}

export async function getLogisticsSettings(): Promise<LogisticsSettings> {
  const { db } = requireFirebaseServices();
  const snapshot = await getDoc(doc(db, "settings", "logistics"));
  return snapshot.exists()
    ? { ...defaultLogisticsSettings, ...snapshot.data() } as LogisticsSettings
    : defaultLogisticsSettings;
}

export async function getSellerKycSettings(): Promise<SellerKycSettings> {
  const { db } = requireFirebaseServices();
  const snapshot = await getDoc(doc(db, "settings", "sellerKyc"));
  return snapshot.exists()
    ? { ...defaultSellerKycSettings, ...snapshot.data() } as SellerKycSettings
    : defaultSellerKycSettings;
}
