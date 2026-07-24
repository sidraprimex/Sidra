import type { DateTimeValue } from "@/types/firestore";

export type CampaignStatus = "draft" | "scheduled" | "active" | "paused" | "completed" | "cancelled";

export interface Campaign {
  readonly campaignId: string;
  readonly name: string;
  readonly slug: string;
  readonly status: CampaignStatus;
  readonly startsAt: DateTimeValue;
  readonly endsAt: DateTimeValue;
  readonly homepageBlockIds: readonly string[];
  readonly landingPageCmsId: string | null;
  readonly couponIds: readonly string[];
  readonly createdBy: string;
  readonly createdAt: DateTimeValue;
  readonly updatedAt: DateTimeValue;
}

export type JournalStatus = "draft" | "scheduled" | "published" | "archived";

export interface JournalArticle {
  readonly articleId: string;
  readonly slug: string;
  readonly title: string;
  readonly excerpt: string;
  readonly body: readonly Readonly<Record<string, unknown>>[];
  readonly coverImageUrl: string | null;
  readonly authorUid: string;
  readonly category: string;
  readonly tags: readonly string[];
  readonly status: JournalStatus;
  readonly publishedAt: DateTimeValue;
  readonly createdAt: DateTimeValue;
  readonly updatedAt: DateTimeValue;
}

export type MediaOwnerType = "studio" | "product" | "user" | "journal" | "campaign" | "supportTicket" | "invoice" | "temp";

export interface MediaAsset {
  readonly mediaId: string;
  readonly ownerType: MediaOwnerType;
  readonly ownerId: string;
  readonly storagePath: string;
  readonly downloadUrl: string;
  readonly fileName: string;
  readonly contentType: string;
  readonly sizeBytes: number;
  readonly width: number | null;
  readonly height: number | null;
  readonly altText: string;
  readonly createdBy: string;
  readonly createdAt: DateTimeValue;
}
