export type ProductStatus =
  | "draft"
  | "pendingReview"
  | "approved"
  | "published"
  | "hidden"
  | "archived"
  | "suspended";

export type InventoryMode = "finite" | "madeToOrder" | "unlimited";

export interface ProductVariant {
  readonly id: string;
  readonly type: string;
  readonly value: string;
  readonly priceModifierPaise: number;
  readonly inventory: number | null;
  readonly sku: string;
}

export interface ProductMedia {
  readonly id: string;
  readonly kind: "image" | "video";
  readonly url: string;
  readonly storagePath: string;
  readonly originalUrl?: string;
  readonly originalStoragePath?: string;
  readonly width?: number;
  readonly height?: number;
  readonly alt: string;
  readonly sortOrder: number;
}

export interface ProductDimensions {
  readonly lengthCm: number | null;
  readonly widthCm: number | null;
  readonly heightCm: number | null;
}

export interface ProductSeo {
  readonly title: string;
  readonly description: string;
  readonly keywords: readonly string[];
}

export interface StudioProduct {
  readonly id: string;
  readonly studioId: string;
  readonly sellerId: string;
  readonly name: string;
  readonly slug: string;
  readonly categoryId: string;
  readonly categorySlug: string;
  readonly collectionIds: readonly string[];
  readonly shortDescription: string;
  readonly description: string;
  readonly story: string;
  readonly media: readonly ProductMedia[];
  readonly heroImageUrl: string | null;
  readonly generatedVideoUrl: string | null;
  readonly pricePaise: number;
  readonly salePricePaise: number | null;
  readonly sku: string;
  readonly inventoryMode: InventoryMode;
  readonly inventoryCount: number | null;
  readonly variants: readonly ProductVariant[];
  readonly materials: readonly string[];
  readonly dimensions: ProductDimensions;
  readonly weightGrams: number | null;
  readonly productionTimeDays: number;
  readonly shippingTimeDays: number;
  readonly seo: ProductSeo;
  readonly status: ProductStatus;
  readonly submittedAt: string | null;
  readonly approvedAt: string | null;
  readonly publishedAt: string | null;
  readonly archivedAt: string | null;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface ProductDraftInput {
  readonly name: string;
  readonly categoryId: string;
  readonly categorySlug: string;
  readonly collectionIds: readonly string[];
  readonly shortDescription: string;
  readonly description: string;
  readonly story: string;
  readonly pricePaise: number;
  readonly salePricePaise: number | null;
  readonly costing?: ProductCostingInput;
  readonly sku: string;
  readonly inventoryMode: InventoryMode;
  readonly inventoryCount: number | null;
  readonly variants: readonly ProductVariant[];
  readonly materials: readonly string[];
  readonly dimensions: ProductDimensions;
  readonly weightGrams: number | null;
  readonly productionTimeDays: number;
  readonly shippingTimeDays: number;
  readonly seo: ProductSeo;
}

export interface ProductCostingInput {
  readonly makingCostPaise: number;
  readonly sellerShippingCostPaise: number;
}

export interface ProductModerationSettings {
  readonly approvalRequired: boolean;
  readonly updatedAt: string;
  readonly updatedBy: string;
}
