import {
  collection,
  getDocs,
  limit,
  query,
  where,
} from "firebase/firestore";
import { phase4Firestore } from "@/services/phase4Firebase";
import type {
  PublicProduct,
  SearchSuggestion,
} from "@/types/phase5-discovery";

export function tokenizeSearchText(
  value: string,
): readonly string[] {
  const normalized = value
    .normalize("NFKD")
    .toLowerCase()
    .replace(/[^a-z0-9 -]/g, " ")
    .replace(/ +/g, " ")
    .trim();

  if (!normalized) {
    return [];
  }

  const words = normalized
    .split(" ")
    .filter((word) => word.length >= 2);

  const prefixes = words.flatMap((word) =>
    Array.from(
      {
        length:
          Math.min(word.length, 20) - 1,
      },
      (_, index) =>
        word.slice(0, index + 2),
    ),
  );

  return [
    ...new Set([
      normalized,
      ...words,
      ...prefixes,
    ]),
  ].slice(0, 200);
}

function searchableText(product: PublicProduct): string {
  return [
    product.name,
    product.shortDescription,
    product.description,
    product.story,
    product.studioName,
    product.categorySlug,
    ...(Array.isArray(product.collectionIds)
      ? product.collectionIds
      : []),
    ...(Array.isArray(product.materials)
      ? product.materials
      : []),
  ]
    .filter(
      (value): value is string =>
        typeof value === "string",
    )
    .join(" ")
    .normalize("NFKD")
    .replace(/[\\u0300-\\u036f]/g, "")
    .toLowerCase();
}

export async function searchProducts(
  term: string,
  pageSize = 40,
): Promise<readonly PublicProduct[]> {
  const words = tokenizeSearchText(term);

  if (words.length === 0) {
    return [];
  }

  const snapshot = await getDocs(
    query(
      collection(phase4Firestore(), "products"),
      where("status", "==", "published"),
      limit(200),
    ),
  );

  return snapshot.docs
    .map(
      (entry) =>
        ({
          id: entry.id,
          ...entry.data(),
        }) as PublicProduct,
    )
    .filter((product) => {
      const haystack = searchableText(product);
      return words.every((word) =>
        haystack.includes(word),
      );
    })
    .sort((first, second) => {
      const firstName = first.name.toLowerCase();
      const secondName = second.name.toLowerCase();
      const phrase = words.join(" ");

      const firstExact = firstName.includes(phrase);
      const secondExact = secondName.includes(phrase);

      if (firstExact !== secondExact) {
        return firstExact ? -1 : 1;
      }

      return firstName.localeCompare(secondName);
    })
    .slice(0, Math.max(1, Math.min(pageSize, 100)));
}

export async function getSearchSuggestions(
  term: string,
): Promise<readonly SearchSuggestion[]> {
  const products = await searchProducts(term, 6);

  return products.map((product) => ({
    id: product.id,
    type: "product",
    label: product.name,
    href: "/product/" + encodeURIComponent(product.slug),
    imageUrl: product.heroImageUrl,
  }));
}
