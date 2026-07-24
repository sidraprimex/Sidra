import type { AuditedDocument } from "@/types/firestore";

export type SubscriptionTier = "starter" | "professional" | "premium";
export type VerificationBadge = "none" | "verified" | "top" | "featured" | "premiumChoice";

export interface StudioSeo {
  readonly title: string;
  readonly description: string;
  readonly ogImage: string | null;
}

export interface StudioPolicies {
  readonly shipping: string;
  readonly returns: string;
  readonly customOrderTerms: string;
}

export interface Studio extends AuditedDocument {
  readonly studioId: string;
  readonly ownerUid: string;
  readonly name: string;
  readonly slug: string;
  readonly description: string;
  readonly logoUrl: string | null;
  readonly bannerUrl: string | null;
  readonly galleryUrls: readonly string[];
  readonly category: string;
  readonly followerCount: number;
  readonly rating: number;
  readonly reviewCount: number;
  readonly totalOrders: number;
  readonly revenueTotal: number;
  readonly subscriptionTier: SubscriptionTier;
  readonly verificationBadge: VerificationBadge;
  readonly featured: boolean;
  readonly active: boolean;
  readonly seo: StudioSeo;
  readonly policies: StudioPolicies;
}
