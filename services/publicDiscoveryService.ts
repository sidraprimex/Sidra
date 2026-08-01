import {
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  where,
} from "firebase/firestore";
import { phase4Firestore } from "@/services/phase4Firebase";
import type {
  DiscoveryFilters,
  HomepageDocument,
  PublicProduct,
  PublicStudio,
} from "@/types/phase5-discovery";
import defaultHomepage from "@/cms/phase5-homepage.default.json";
import { defaultStudioStorefront, type StudioStorefrontConfig } from "@/types/studio-storefront";

function stringValue(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value : fallback;
}

function numberValue(value: unknown): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function timestampMillis(value: unknown): number {
  if (
    value &&
    typeof value === "object" &&
    "toMillis" in value &&
    typeof value.toMillis === "function"
  ) {
    return value.toMillis();
  }
  const parsed = Date.parse(stringValue(value));
  return Number.isFinite(parsed) ? parsed : 0;
}

function normalizePublicStudio(
  id: string,
  source: Record<string, unknown>,
): PublicStudio {
  const categories = Array.isArray(source.categories)
    ? source.categories.filter(
        (value): value is string =>
          typeof value === "string" && value.trim().length > 0,
      )
    : stringValue(source.category)
      ? [stringValue(source.category)]
      : [];
  const location =
    stringValue(source.location) ||
    [stringValue(source.city), stringValue(source.state)]
      .filter(Boolean)
      .join(", ");
  const verificationBadge = stringValue(
    source.verificationBadge,
  );

  return {
    id,
    slug: stringValue(source.slug, id),
    name: stringValue(source.name, "Sidra Studio"),
    story:
      stringValue(source.story) ||
      stringValue(source.description),
    logoUrl: stringValue(source.logoUrl) || null,
    bannerUrl:
      stringValue(source.bannerUrl) ||
      stringValue(source.heroImageUrl) ||
      null,
    location,
    categories,
    rating: numberValue(source.rating),
    reviewCount: numberValue(source.reviewCount),
    followerCount: numberValue(source.followerCount),
    productCount: numberValue(source.productCount),
    featured: source.featured === true,
    verified:
      source.verified === true ||
      [
        "verified",
        "verifiedSeller",
        "top",
        "featured",
        "premiumChoice",
      ].includes(verificationBadge),
    active: source.active === true,
    status: stringValue(
      source.status,
      source.active === true ? "active" : "suspended",
    ),
    contactEnabled: source.contactEnabled !== false,
    policies:
      source.policies && typeof source.policies === "object"
        ? (source.policies as Readonly<Record<string, string>>)
        : {},
    seo:
      source.seo && typeof source.seo === "object"
        ? (source.seo as PublicStudio["seo"])
        : undefined,
  };
}

function safeHomepage(data: unknown): HomepageDocument {
  if (!data || typeof data !== "object" || !("blocks" in data) || !Array.isArray((data as { blocks?: unknown }).blocks)) {
    return defaultHomepage as HomepageDocument;
  }
  return data as HomepageDocument;
}

export async function getHomepageDocument(): Promise<HomepageDocument> {
  try {
    const snapshot = await getDoc(doc(phase4Firestore(), "cms", "homepage"));
    return snapshot.exists() ? safeHomepage(snapshot.data()) : (defaultHomepage as HomepageDocument);
  } catch {
    return defaultHomepage as HomepageDocument;
  }
}

export async function listPublicStudios(filters: DiscoveryFilters = {}): Promise<readonly PublicStudio[]> {
  const constraints = [where("active", "==", true), limit(100)];
  const snapshot = await getDocs(query(collection(phase4Firestore(), "studios"), ...constraints));
  const studios = snapshot.docs
    .map((entry) =>
      normalizePublicStudio(entry.id, entry.data()),
    )
    .filter((studio) => studio.status !== "suspended")
    .filter((studio) => !filters.category || studio.categories?.includes(filters.category))
    .filter((studio) => !filters.location || studio.location?.toLowerCase().includes(filters.location.toLowerCase()))
    .filter((studio) => !filters.minimumRating || studio.rating >= filters.minimumRating);

  return [...studios].sort((a, b) => {
    if (filters.sort === "newest") return b.id.localeCompare(a.id);
    if (filters.sort === "rating") return b.rating - a.rating;
    return Number(b.featured) - Number(a.featured) || b.rating - a.rating || b.id.localeCompare(a.id);
  });
}

export async function getPublicStudioBySlug(slug: string): Promise<PublicStudio | null> {
  const snapshot = await getDocs(
    query(
      collection(phase4Firestore(), "studios"),
      where("slug", "==", slug),
      where("active", "==", true),
      limit(1),
    ),
  );
  if (snapshot.empty) return null;
  const studio = normalizePublicStudio(
    snapshot.docs[0].id,
    snapshot.docs[0].data(),
  );
  if (!studio.active || studio.status === "suspended") return null;
  const storefrontSnapshot = await getDoc(doc(phase4Firestore(), "studioStorefronts", studio.id));
  const storefront = storefrontSnapshot.exists() ? ({ ...defaultStudioStorefront(studio.id), ...storefrontSnapshot.data(), studioId: studio.id } as StudioStorefrontConfig) : defaultStudioStorefront(studio.id);
  return { ...studio, storefront };
}

export async function listPublishedProducts(
  filters: {
    readonly studioId?: string;
    readonly categorySlug?: string;
    readonly collectionId?: string;
    readonly sort?: DiscoveryFilters["sort"];
    readonly pageSize?: number;
  } = {},
): Promise<readonly PublicProduct[]> {
  const constraints = [where("status", "==", "published"), limit(filters.pageSize ?? 60)];
  if (filters.studioId) constraints.unshift(where("studioId", "==", filters.studioId));
  if (filters.categorySlug) constraints.unshift(where("categorySlug", "==", filters.categorySlug));
  if (filters.collectionId) constraints.unshift(where("collectionIds", "array-contains", filters.collectionId));
  const snapshot = await getDocs(query(collection(phase4Firestore(), "products"), ...constraints));
  const products = snapshot.docs.map(
    (entry) =>
      ({ id: entry.id, ...entry.data() }) as PublicProduct,
  );
  return [...products].sort((a, b) => {
    const aPrice = a.salePricePaise ?? a.pricePaise;
    const bPrice = b.salePricePaise ?? b.pricePaise;
    if (filters.sort === "priceLow") return aPrice - bPrice;
    if (filters.sort === "priceHigh") return bPrice - aPrice;
    return (
      timestampMillis(b.updatedAt) -
      timestampMillis(a.updatedAt)
    );
  });
}

export async function getPublicProductBySlug(slug: string): Promise<PublicProduct | null> {
  const snapshot = await getDocs(
    query(
      collection(phase4Firestore(), "products"),
      where("slug", "==", slug),
      where("status", "==", "published"),
      limit(1),
    ),
  );
  return snapshot.empty ? null : ({ id: snapshot.docs[0].id, ...snapshot.docs[0].data() } as PublicProduct);
}

export async function listRelatedProducts(product: PublicProduct): Promise<readonly PublicProduct[]> {
  const snapshot = await getDocs(
    query(
      collection(phase4Firestore(), "products"),
      where("status", "==", "published"),
      where("categorySlug", "==", product.categorySlug),
      orderBy("updatedAt", "desc"),
      limit(8),
    ),
  );
  return snapshot.docs
    .map((entry) => ({ id: entry.id, ...entry.data() }) as PublicProduct)
    .filter((item) => item.id !== product.id)
    .slice(0, 6);
}
