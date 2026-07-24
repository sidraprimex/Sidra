import { orderBy, where } from "firebase/firestore";
import { getDocumentById, listDocuments, setDocument, updateDocument } from "@/services/firestoreRepository";
import type { Collection } from "@/types/catalog";

export function getCollection(collectionId: string): Promise<Collection | null> {
  return getDocumentById<Collection>("collections", collectionId);
}

export function listActiveCollections(maxResults = 100): Promise<readonly Collection[]> {
  return listDocuments<Collection>("collections", [where("active", "==", true), orderBy("sortOrder", "asc")], maxResults);
}

export function saveCollection(collection: Collection): Promise<void> {
  return setDocument("collections", collection.collectionId, collection);
}

export function updateCollection(collectionId: string, value: Partial<Collection>): Promise<void> {
  return updateDocument<Collection>("collections", collectionId, value);
}
