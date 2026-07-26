import { listActiveCategories } from "@/services/categoryService";
import { listActiveCollections } from "@/services/collectionService";
import { listPublishedJournal } from "@/services/journalService";
import { listPublishedVerifiedReviews } from "@/services/homepageReviewService";
import {
  getHomepageDocument,
  listPublicStudios,
  listPublishedProducts,
} from "@/services/publicDiscoveryService";
import type { Category, Collection } from "@/types/catalog";
import type { JournalArticle } from "@/types/marketing";
import type { ProductReview } from "@/types/phase9-customer";
import type {
  HomepageDocument,
  PublicProduct,
  PublicStudio,
} from "@/types/phase5-discovery";

export interface HomepageExperienceData {
  readonly document: HomepageDocument;
  readonly studios: readonly PublicStudio[];
  readonly collections: readonly Collection[];
  readonly categories: readonly Category[];
  readonly products: readonly PublicProduct[];
  readonly journal: readonly JournalArticle[];
  readonly reviews: readonly ProductReview[];
}

async function safeList<T>(
  sectionName: string,
  operation: Promise<readonly T[]>,
): Promise<readonly T[]> {
  try {
    return await operation;
  } catch (error: unknown) {
    console.error(
      `[Sidra homepage] Failed to load ${sectionName}.`,
      error,
    );

    return [];
  }
}

export async function getHomepageExperienceData(): Promise<HomepageExperienceData> {
  const [
    document,
    studios,
    collections,
    categories,
    products,
    journal,
    reviews,
  ] = await Promise.all([
    getHomepageDocument(),
    safeList<PublicStudio>(
      "Studios",
      listPublicStudios({
        sort: "featured",
      }),
    ),
    safeList<Collection>(
      "Collections",
      listActiveCollections(24),
    ),
    safeList<Category>(
      "Categories",
      listActiveCategories(24),
    ),
    safeList<PublicProduct>(
      "Products",
      listPublishedProducts({
        sort: "newest",
        pageSize: 60,
      }),
    ),
    safeList<JournalArticle>(
      "Journal",
      listPublishedJournal(8),
    ),
    safeList<ProductReview>(
      "Verified reviews",
      listPublishedVerifiedReviews(12),
    ),
  ]);

  return {
    document,
    studios,
    collections,
    categories,
    products,
    journal,
    reviews,
  };
}
