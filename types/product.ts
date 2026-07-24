import type { AuditedDocument } from "@/types/firestore";

export type InventoryMode = "stock" | "madeToOrder" | "unlimited";
export type ProductStatus = "draft" | "pendingReview" | "approved" | "published" | "hidden" | "archived" | "suspended";

export interface ProductVariant {
  readonly id: string;
  readonly type: string;
  readonly value: string;
  readonly priceModifier: number;
  readonly inventoryCount: number;
  readonly sku: string;
}

export interface ProductSeo {
  readonly title: string;
  readonly description: string;
  readonly keywords: readonly string[];
}

export interface Product extends AuditedDocument {
  readonly productId: string;
  readonly studioId: string;
  readonly name: string;
  readonly slug: string;
  readonly shortDescription: string;
  readonly description: string;
  readonly story: string;
  readonly category: string;
  readonly collectionIds: readonly string[];
  readonly price: number;
  readonly salePrice: number | null;
  readonly sku: string;
  readonly inventoryCount: number;
  readonly inventoryMode: InventoryMode;
  readonly images: readonly string[];
  readonly videos: readonly string[];
  readonly variants: readonly ProductVariant[];
  readonly materials: readonly string[];
  readonly dimensions: string;
  readonly weight: number | null;
  readonly productionTimeDays: number;
  readonly shippingTimeDays: number;
  readonly status: ProductStatus;
  readonly featured: boolean;
  readonly viewCount: number;
  readonly wishlistCount: number;
  readonly salesCount: number;
  readonly rating: number;
  readonly reviewCount: number;
  readonly seo: ProductSeo;
}
