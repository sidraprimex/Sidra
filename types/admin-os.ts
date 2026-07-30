import type { DateTimeValue } from "@/types/firestore";

export type AdminWorkspaceTab =
  | "overview"
  | "search"
  | "users"
  | "sellers"
  | "verification"
  | "products"
  | "orders"
  | "support"
  | "content"
  | "appearance"
  | "payments"
  | "business"
  | "subscriptions"
  | "payouts"
  | "settlements"
  | "database"
  | "audit";

export interface AdminRecord {
  readonly id: string;
  readonly data: Readonly<Record<string, unknown>>;
}

export interface AdminSnapshot {
  readonly users: readonly AdminRecord[];
  readonly studios: readonly AdminRecord[];
  readonly products: readonly AdminRecord[];
  readonly orders: readonly AdminRecord[];
  readonly customOrders: readonly AdminRecord[];
  readonly supportTickets: readonly AdminRecord[];
  readonly sellerApplications: readonly AdminRecord[];
  readonly manualPaymentRequests: readonly AdminRecord[];
  readonly sellerSubscriptionRequests: readonly AdminRecord[];
  readonly payouts: readonly AdminRecord[];
  readonly sellerWithdrawals: readonly AdminRecord[];
  readonly sellerVerifications: readonly AdminRecord[];
  readonly auditLogs: readonly AdminRecord[];
}

export interface SidraThemeSettings {
  readonly deepPlum: string;
  readonly dustyRose: string;
  readonly porcelain: string;
  readonly champagne: string;
  readonly deepOnyx: string;
  readonly cardRadiusRem: number;
  readonly updatedBy: string;
  readonly updatedAt: DateTimeValue;
}

export type SidraPaymentMode = "razorpay" | "manual" | "hybrid" | "disabled";

export interface SidraPaymentSettings {
  readonly mode: SidraPaymentMode;
  readonly razorpayEnabled: boolean;
  readonly manualEnabled: boolean;
  readonly razorpayPaymentLink: string;
  readonly sellerAccessFeePaise: number;
  readonly upiId: string;
  readonly accountHolderName: string;
  readonly bankName: string;
  readonly accountNumber: string;
  readonly ifsc: string;
  readonly instructions: string;
  readonly supportContact: string;
  readonly updatedBy: string;
  readonly updatedAt: DateTimeValue;
}

export interface SidraIntegrationSettings {
  readonly razorpayPublicKey: string;
  readonly razorpayConfigured: boolean;
  readonly appleSignInConfigured: boolean;
  readonly googleSignInConfigured: boolean;
  readonly emailProvider: string;
  readonly shippingProvider: string;
  readonly notes: string;
  readonly updatedBy: string;
  readonly updatedAt: DateTimeValue;
}
