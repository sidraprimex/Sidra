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
    .map((entry) => ({ id: entry.id, ...entry.data() }) as PublicStudio)
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
    query(collection(phase4Firestore(), "studios"), where("slug", "==", slug), limit(1)),
  );
  if (snapshot.empty) return null;
  const studio = { id: snapshot.docs[0].id, ...snapshot.docs[0].data() } as PublicStudio;
  return studio.active && studio.status !== "suspended" ? studio : null;
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
  const products = snapshot.docs.map((entry) => ({ id: entry.id, ...entry.data() }) as PublicProduct);
  return [...products].sort((a, b) => {
    const aPrice = a.salePricePaise ?? a.pricePaise;
    const bPrice = b.salePricePaise ?? b.pricePaise;
    if (filters.sort === "priceLow") return aPrice - bPrice;
    if (filters.sort === "priceHigh") return bPrice - aPrice;
    return b.updatedAt.localeCompare(a.updatedAt);
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
