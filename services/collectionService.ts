import {
  collection as firestoreCollection,
  getDocs,
  limit,
  orderBy,
  query,
  where,
} from "firebase/firestore";
import {
  getDocumentById,
  listDocuments,
  setDocument,
  updateDocument,
} from "@/services/firestoreRepository";
import { phase4Firestore } from "@/services/phase4Firebase";
import type { Collection } from "@/types/catalog";

export interface MarketplaceCollectionCard {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly imageUrl: string | null;
  readonly href: string;
  readonly studioName: string | null;
  readonly featured: boolean;
  readonly sortOrder: number;
  readonly source: "sidra" | "studio";
}

function text(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value : fallback;
}

export function getCollection(
  collectionId: string,
): Promise<Collection | null> {
  return getDocumentById<Collection>(
    "collections",
    collectionId,
  );
}

export function listActiveCollections(
  maxResults = 100,
): Promise<readonly Collection[]> {
  return listDocuments<Collection>(
    "collections",
    [
      where("active", "==", true),
      orderBy("sortOrder", "asc"),
    ],
    maxResults,
  );
}

export async function listMarketplaceCollections(
  maxResults = 100,
): Promise<readonly MarketplaceCollectionCard[]> {
  const database = phase4Firestore();

  const [
    curatedCollections,
    storefrontSnapshot,
    studioSnapshot,
    productSnapshot,
  ] = await Promise.all([
    listActiveCollections(maxResults).catch(() => []),
    getDocs(
      query(
        firestoreCollection(database, "studioStorefronts"),
        limit(100),
      ),
    ),
    getDocs(
      query(
        firestoreCollection(database, "studios"),
        where("active", "==", true),
        limit(100),
      ),
    ),
    getDocs(
      query(
        firestoreCollection(database, "products"),
        where("status", "==", "published"),
        limit(200),
      ),
    ),
  ]);

  const studios = new Map(
    studioSnapshot.docs.map((entry) => {
      const data = entry.data();

      return [
        entry.id,
        {
          name: text(data.name, "Sidra Studio"),
          slug: text(data.slug, entry.id),
        },
      ] as const;
    }),
  );

  const products = productSnapshot.docs.map((entry) => ({
    id: entry.id,
    ...entry.data(),
  })) as ReadonlyArray<Record<string, unknown>>;

  const curatedCards: MarketplaceCollectionCard[] =
    curatedCollections.map((item, index) => ({
      id:
        "sidra:" +
        (item.collectionId || item.slug || String(index)),
      name: item.name,
      description: item.description,
      imageUrl: item.imageUrl,
      href: "/collection/" + encodeURIComponent(item.slug),
      studioName: null,
      featured: item.featured,
      sortOrder: item.sortOrder,
      source: "sidra",
    }));

  const studioCards: MarketplaceCollectionCard[] = [];

  for (const storefrontDocument of storefrontSnapshot.docs) {
    const storefront = storefrontDocument.data();
    const studio = studios.get(storefrontDocument.id);

    if (
      !studio ||
      storefront.showCollections === false ||
      !Array.isArray(storefront.collections)
    ) {
      continue;
    }

    for (const rawCollection of storefront.collections) {
      if (
        !rawCollection ||
        typeof rawCollection !== "object"
      ) {
        continue;
      }

      const item = rawCollection as Record<string, unknown>;
      const collectionId = text(item.id);
      const collectionName = text(item.name);

      if (
        !collectionId ||
        !collectionName ||
        item.enabled === false
      ) {
        continue;
      }

      const matchingProduct = products.find((product) => {
        const collectionIds = Array.isArray(
          product.collectionIds,
        )
          ? product.collectionIds
          : [];

        return (
          product.studioId === storefrontDocument.id &&
          collectionIds.includes(collectionId)
        );
      });

      const media = Array.isArray(matchingProduct?.media)
        ? matchingProduct.media
        : [];

      const firstImage = media.find(
        (entry) =>
          entry &&
          typeof entry === "object" &&
          (entry as Record<string, unknown>).kind === "image" &&
          typeof (entry as Record<string, unknown>).url ===
            "string",
      ) as Record<string, unknown> | undefined;

      const heroImage = text(
        matchingProduct?.heroImageUrl,
      );

      studioCards.push({
        id:
          "studio:" +
          storefrontDocument.id +
          ":" +
          collectionId,
        name: collectionName,
        description: text(item.description),
        imageUrl:
          heroImage ||
          text(firstImage?.url) ||
          null,
        href:
          "/studio/" +
          encodeURIComponent(studio.slug) +
          "?collection=" +
          encodeURIComponent(collectionId) +
          "#studio-products",
        studioName: studio.name,
        featured: false,
        sortOrder: Number(item.sortOrder) || 0,
        source: "studio",
      });
    }
  }

  return [...curatedCards, ...studioCards]
    .sort((first, second) => {
      if (first.featured !== second.featured) {
        return first.featured ? -1 : 1;
      }

      return (
        first.sortOrder - second.sortOrder ||
        first.name.localeCompare(second.name)
      );
    })
    .slice(0, maxResults);
}

export function saveCollection(
  collection: Collection,
): Promise<void> {
  return setDocument(
    "collections",
    collection.collectionId,
    collection,
  );
}

export function updateCollection(
  collectionId: string,
  value: Partial<Collection>,
): Promise<void> {
  return updateDocument<Collection>(
    "collections",
    collectionId,
    value,
  );
}
