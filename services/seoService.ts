import { where } from "firebase/firestore";
import { getDocumentById, listDocuments, setDocument } from "@/services/firestoreRepository";
import type { SeoDocument } from "@/types/platform";

export function getSeoDocument(seoId: string): Promise<SeoDocument | null> {
  return getDocumentById<SeoDocument>("seo", seoId);
}

export async function getSeoForEntity(entityType: SeoDocument["entityType"], entityId: string): Promise<SeoDocument | null> {
  const documents = await listDocuments<SeoDocument>("seo", [where("entityType", "==", entityType), where("entityId", "==", entityId)], 1);
  return documents[0] ?? null;
}

export function saveSeoDocument(document: SeoDocument): Promise<void> {
  return setDocument("seo", document.seoId, document);
}
