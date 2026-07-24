import type { DateTimeValue } from "@/types/firestore";

/** Inactive in V1. Type reserved to avoid a later data migration. */
export interface AffiliateReserved {
  readonly affiliateId: string;
  readonly uid: string;
  readonly status: "inactive";
  readonly createdAt: DateTimeValue;
}

/** Inactive in V1. Type reserved to avoid a later data migration. */
export interface GiftCardReserved {
  readonly giftCardId: string;
  readonly status: "inactive";
  readonly createdAt: DateTimeValue;
}

/** Inactive in V1. No earning or redemption logic ships in this phase. */
export interface LoyaltyLedgerReserved {
  readonly entryId: string;
  readonly uid: string;
  readonly status: "inactive";
  readonly createdAt: DateTimeValue;
}

/** Inactive in V1. Seller tier billing is not activated by this schema stub. */
export interface SubscriptionBillingReserved {
  readonly subscriptionBillingId: string;
  readonly studioId: string;
  readonly status: "inactive";
  readonly createdAt: DateTimeValue;
}
