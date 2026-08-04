export type StorefrontLayout = "editorial" | "gallery" | "catalog";
export type StorefrontHeroAlignment = "left" | "center";
export type StorefrontMotion = "subtle" | "cinematic" | "still";
export type StorefrontSection =
  | "hero"
  | "story"
  | "collections"
  | "products"
  | "policies";
export const SIDRA_STOREFRONT_ACCENTS = [
  "#3b1e35",
  "#d9a7b0",
  "#f8f4f0",
  "#d5bd9f",
  "#1c1c1c",
] as const;
export interface StudioStoreCollection {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly enabled: boolean;
  readonly sortOrder: number;
}
export interface StudioStorefrontConfig {
  readonly studioId: string;
  readonly sellerUid: string;
  readonly announcement: string;
  readonly headline: string;
  readonly accentColor: string;
  readonly layout: StorefrontLayout;
  readonly heroAlignment: StorefrontHeroAlignment;
  readonly motion: StorefrontMotion;
  readonly sectionOrder: readonly StorefrontSection[];
  readonly showStory: boolean;
  readonly showCollections: boolean;
  readonly showPolicies: boolean;
  readonly collections: readonly StudioStoreCollection[];
  readonly createdAt?: unknown;
  readonly updatedAt?: unknown;
}
export function defaultStudioStorefront(
  studioId: string,
  sellerUid = "",
): StudioStorefrontConfig {
  return {
    studioId,
    sellerUid,
    announcement: "",
    headline: "Handcrafted with intention.",
    accentColor: "#4a193c",
    layout: "editorial",
    heroAlignment: "left",
    motion: "subtle",
    sectionOrder: ["hero", "story", "collections", "products", "policies"],
    showStory: true,
    showCollections: true,
    showPolicies: true,
    collections: [],
  };
}
