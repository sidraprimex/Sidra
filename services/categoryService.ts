import { orderBy, where } from "firebase/firestore";
import { getDocumentById, listDocuments, setDocument, updateDocument } from "@/services/firestoreRepository";
import type { Category } from "@/types/catalog";

export function getCategory(categoryId: string): Promise<Category | null> {
  return getDocumentById<Category>("categories", categoryId);
}

export function listActiveCategories(maxResults = 100): Promise<readonly Category[]> {
  return listDocuments<Category>("categories", [where("active", "==", true), orderBy("sortOrder", "asc")], maxResults);
}

export function saveCategory(category: Category): Promise<void> {
  return setDocument("categories", category.categoryId, category);
}

export function updateCategory(categoryId: string, value: Partial<Category>): Promise<void> {
  return updateDocument<Category>("categories", categoryId, value);
}
