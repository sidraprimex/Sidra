import type { DateTimeValue } from "@/types/firestore";

export type AnalyticsPeriod = "day" | "week" | "month" | "lifetime";

export interface AnalyticsMetricDocument {
  readonly analyticsId: string;
  readonly subjectType: "platform" | "studio" | "product" | "campaign";
  readonly subjectId: string;
  readonly period: AnalyticsPeriod;
  readonly periodStart: DateTimeValue;
  readonly views: number;
  readonly visitors: number;
  readonly conversions: number;
  readonly orders: number;
  readonly grossRevenue: number;
  readonly refunds: number;
  readonly followers: number;
  readonly updatedAt: DateTimeValue;
}

export interface SubscriptionTierSettings {
  readonly tier: "starter" | "professional" | "premium";
  readonly productLimit: number;
  readonly galleryImageLimit: number;
  readonly featuredPlacementEligible: boolean;
}

export interface CommissionSettings {
  readonly mode: "percentage" | "flat" | "category" | "subscriptionTier";
  readonly defaultPercentage: number;
  readonly defaultFlatFee: number;
  readonly categoryRates: Readonly<Record<string, number>>;
  readonly tierRates: Readonly<Record<string, number>>;
}

export interface PlatformSettings {
  readonly settingsId: string;
  readonly maintenanceMode: boolean;
  readonly productModerationApprovalRequired: boolean;
  readonly defaultReturnWindowDays: number;
  readonly reviewEditWindowDays: number;
  readonly subscriptionTiers: readonly SubscriptionTierSettings[];
  readonly commission: CommissionSettings;
  readonly updatedBy: string;
  readonly updatedAt: DateTimeValue;
}

export type AutomationTrigger = "orderStatusChanged" | "paymentSucceeded" | "lowInventory" | "campaignSchedule" | "priceDropped" | "accountDeletionDue";

export interface AutomationRule {
  readonly automationRuleId: string;
  readonly name: string;
  readonly trigger: AutomationTrigger;
  readonly conditions: readonly Readonly<Record<string, unknown>>[];
  readonly actions: readonly Readonly<Record<string, unknown>>[];
  readonly enabled: boolean;
  readonly createdBy: string;
  readonly createdAt: DateTimeValue;
  readonly updatedAt: DateTimeValue;
}

export type CorporateLeadStatus = "new" | "contacted" | "qualified" | "proposalSent" | "won" | "lost";

export interface CorporateLead {
  readonly leadId: string;
  readonly companyName: string;
  readonly contactName: string;
  readonly email: string;
  readonly phone: string;
  readonly city: string;
  readonly requirement: string;
  readonly estimatedQuantity: number | null;
  readonly budget: number | null;
  readonly deadline: DateTimeValue;
  readonly status: CorporateLeadStatus;
  readonly assignedAdminUid: string | null;
  readonly notes: readonly string[];
  readonly createdAt: DateTimeValue;
  readonly updatedAt: DateTimeValue;
}

export interface SeoDocument {
  readonly seoId: string;
  readonly entityType: "studio" | "product" | "category" | "collection" | "journal" | "campaign" | "page";
  readonly entityId: string;
  readonly slug: string;
  readonly title: string;
  readonly description: string;
  readonly canonicalUrl: string;
  readonly ogImage: string | null;
  readonly keywords: readonly string[];
  readonly searchTokens: readonly string[];
  readonly structuredData: Readonly<Record<string, unknown>>;
  readonly noIndex: boolean;
  readonly updatedAt: DateTimeValue;
}
