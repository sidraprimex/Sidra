import {
  collection,
  endAt,
  getDocs,
  limit,
  orderBy,
  query,
  startAt,
} from "firebase/firestore";
import { phase4Firestore } from "@/services/phase4Firebase";
import type { PublicProduct, SearchSuggestion } from "@/types/phase5-discovery";

export function tokenizeSearchText(value: string): readonly string[] {
  const normalized = value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  const words = normalized.split(" ").filter((word) => word.length >= 2);
  const prefixes = words.flatMap((word) =>
    Array.from({ length: Math.min(word.length, 20) - 1 }, (_, index) => word.slice(0, index + 2)),
  );
  return [...new Set([normalized, ...words, ...prefixes])].slice(0, 200);
}

export async function searchProducts(term: string, pageSize = 40): Promise<readonly PublicProduct[]> {
  const normalized = term.trim().toLowerCase();
  if (normalized.length < 2) return [];
  const snapshot = await getDocs(
    query(
      collection(phase4Firestore(), "products"),
      orderBy("searchSortKey"),
      startAt(normalized),
      endAt(`${normalized}\uf8ff`),
      limit(pageSize),
    ),
  );
  return snapshot.docs
    .map((entry) => ({ id: entry.id, ...entry.data() }) as PublicProduct)
    .filter((product) => product.status === "published");
}

export async function getSearchSuggestions(term: string): Promise<readonly SearchSuggestion[]> {
  const products = await searchProducts(term, 6);
  return products.map((product) => ({
    id: product.id,
    type: "product",
    label: product.name,
    href: `/product/${product.slug}`,
    imageUrl: product.heroImageUrl,
  }));
}
