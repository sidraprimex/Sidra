export type AdminContentStatus = "draft" | "published" | "archived";

export interface PlatformContentEntry {
  readonly contentId: string;
  readonly namespace: string;
  readonly key: string;
  readonly value: string;
  readonly description: string;
  readonly status: AdminContentStatus;
  readonly updatedBy: string;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface CommerceSettings {
  readonly currency: "INR";
  readonly platformFeePercent: number;
  readonly defaultSellerCommissionPercent: number;
  readonly minimumPayoutPaise: number;
  readonly payoutHoldDays: number;
  readonly customOrderDepositPercent: number;
  readonly maximumDiscountPercent: number;
  readonly sellerSubscriptionEnabled: boolean;
  readonly sellerSubscriptionPricePaise: number;
  readonly customerCancellationWindowMinutes: number;
  readonly updatedBy: string;
  readonly updatedAt: string;
}

export interface FounderFinanceSummary {
  readonly grossRevenuePaise: number;
  readonly platformRevenuePaise: number;
  readonly sellerPayablePaise: number;
  readonly refundsPaise: number;
  readonly pendingPayoutPaise: number;
  readonly completedPayoutPaise: number;
  readonly orderCount: number;
  readonly customOrderCount: number;
}

export interface FinanceLedgerEntry {
  readonly ledgerEntryId: string;
  readonly type: string;
  readonly direction: "credit" | "debit";
  readonly amountPaise: number;
  readonly reference: string;
  readonly note: string;
  readonly createdBy: string;
  readonly createdAt: string;
}

export interface AdminAuditLog {
  readonly auditId: string;
  readonly actorId: string;
  readonly actorRole: "founder";
  readonly action: string;
  readonly entityType: string;
  readonly entityId: string;
  readonly createdAt: string;
}

export interface FounderControlCenterSummary {
  readonly pendingSellerApplications: number;
  readonly activeSellers: number;
  readonly publishedProducts: number;
  readonly pendingOrders: number;
  readonly pendingCustomOrders: number;
  readonly pendingReviews: number;
  readonly unreadFounderAlerts: number;
  readonly finance: FounderFinanceSummary;
}
