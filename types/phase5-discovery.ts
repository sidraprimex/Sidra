import type { StudioProduct } from "@/types/phase4-product";

export type HomepageBlockType =
  | "Hero"
  | "FeaturedStudios"
  | "FeaturedCollections"
  | "SignatureCategories"
  | "BestSellers"
  | "NewArrivals"
  | "CustomOrderBanner"
  | "WhySidra"
  | "ArtistStories"
  | "Testimonials"
  | "Journal"
  | "Newsletter";

export interface HomepageBlock {
  readonly id: string;
  readonly type: HomepageBlockType;
  readonly enabled: boolean;
  readonly order: number;
  readonly data: Readonly<Record<string, unknown>>;
}

export interface HomepageDocument {
  readonly blocks: readonly HomepageBlock[];
  readonly updatedAt?: string;
}

export interface PublicStudio {
  readonly id: string;
  readonly slug: string;
  readonly name: string;
  readonly story: string;
  readonly logoUrl: string | null;
  readonly bannerUrl: string | null;
  readonly location: string;
  readonly categories: readonly string[];
  readonly rating: number;
  readonly reviewCount: number;
  readonly followerCount: number;
  readonly productCount: number;
  readonly featured: boolean;
  readonly verified: boolean;
  readonly active: boolean;
  readonly status: string;
  readonly contactEnabled: boolean;
  readonly policies: Readonly<Record<string, string>>;
  readonly seo?: {
    readonly title?: string;
    readonly description?: string;
  };
}

export interface PublicProduct extends StudioProduct {
  readonly studioName?: string;
  readonly studioSlug?: string;
  readonly rating?: number;
  readonly reviewCount?: number;
  readonly featured?: boolean;
  readonly viewCount?: number;
  readonly wishlistCount?: number;
  readonly salesCount?: number;
  readonly tags?: readonly string[];
  readonly searchTokens?: readonly string[];
}

export interface SearchSuggestion {
  readonly id: string;
  readonly type: "product" | "studio" | "category" | "collection";
  readonly label: string;
  readonly href: string;
  readonly imageUrl?: string | null;
}

export interface DiscoveryFilters {
  readonly category?: string;
  readonly location?: string;
  readonly minimumRating?: number;
  readonly sort?: "featured" | "rating" | "newest" | "priceLow" | "priceHigh";
}
