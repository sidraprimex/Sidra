import { orderBy, where } from "firebase/firestore";
import { getDocumentById, listDocuments, updateDocument } from "@/services/firestoreRepository";
import type { Studio } from "@/types/studio";

export function getStudio(studioId: string): Promise<Studio | null> {
  return getDocumentById<Studio>("studios", studioId);
}

export async function getStudioBySlug(slug: string): Promise<Studio | null> {
  const studios = await listDocuments<Studio>("studios", [where("slug", "==", slug), where("active", "==", true)], 1);
  return studios[0] ?? null;
}

export function listActiveStudios(maxResults = 50): Promise<readonly Studio[]> {
  return listDocuments<Studio>("studios", [where("active", "==", true), orderBy("rating", "desc")], maxResults);
}

export function updateStudioProfile(
  studioId: string,
  value: Partial<Pick<Studio, "name" | "description" | "logoUrl" | "bannerUrl" | "galleryUrls" | "policies" | "seo">>
): Promise<void> {
  return updateDocument<Studio>("studios", studioId, value);
}
