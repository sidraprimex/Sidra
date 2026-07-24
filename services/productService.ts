import { orderBy, where } from "firebase/firestore";
import { getDocumentById, listDocuments, setDocument, updateDocument } from "@/services/firestoreRepository";
import type { Product } from "@/types/product";

export function getProduct(productId: string): Promise<Product | null> {
  return getDocumentById<Product>("products", productId);
}

export async function getPublishedProductBySlug(slug: string): Promise<Product | null> {
  const products = await listDocuments<Product>("products", [where("slug", "==", slug), where("status", "==", "published")], 1);
  return products[0] ?? null;
}

export function listPublishedProducts(maxResults = 50): Promise<readonly Product[]> {
  return listDocuments<Product>("products", [where("status", "==", "published"), orderBy("createdAt", "desc")], maxResults);
}

export function listStudioProducts(studioId: string, maxResults = 50): Promise<readonly Product[]> {
  return listDocuments<Product>("products", [where("studioId", "==", studioId), orderBy("createdAt", "desc")], maxResults);
}

export function saveProduct(product: Product): Promise<void> {
  return setDocument("products", product.productId, product);
}

export function updateProduct(productId: string, value: Partial<Product>): Promise<void> {
  return updateDocument<Product>("products", productId, value);
}
