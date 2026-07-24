import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  limit as limitQuery,
  query,
  setDoc,
  updateDoc,
  type DocumentData,
  type QueryConstraint,
  type QueryDocumentSnapshot,
  type SetOptions,
  type UpdateData,
} from "firebase/firestore";
import { requireFirebaseServices } from "@/services/firebaseClient";

export type DocumentPatch<T extends object> = Partial<Record<keyof T, unknown>>;

export async function getDocumentById<T>(collectionName: string, id: string): Promise<T | null> {
  const snapshot = await getDoc(doc(requireFirebaseServices().db, collectionName, id));
  return snapshot.exists() ? ({ id: snapshot.id, ...snapshot.data() } as T) : null;
}

export async function listDocuments<T>(
  collectionName: string,
  constraints: readonly QueryConstraint[] = [],
  maxResults = 50
): Promise<readonly T[]> {
  const reference = collection(requireFirebaseServices().db, collectionName);
  const snapshot = await getDocs(query(reference, ...constraints, limitQuery(Math.min(Math.max(maxResults, 1), 100))));
  return snapshot.docs.map((item: QueryDocumentSnapshot<DocumentData>) => ({ id: item.id, ...item.data() }) as T);
}

export async function setDocument<T extends object>(
  collectionName: string,
  id: string,
  value: T,
  options?: SetOptions
): Promise<void> {
  const reference = doc(requireFirebaseServices().db, collectionName, id);
  const data = value as unknown as DocumentData;
  if (options) {
    await setDoc(reference, data, options);
    return;
  }
  await setDoc(reference, data);
}

export async function updateDocument<T extends object>(
  collectionName: string,
  id: string,
  value: DocumentPatch<T>
): Promise<void> {
  await updateDoc(
    doc(requireFirebaseServices().db, collectionName, id),
    value as unknown as UpdateData<DocumentData>
  );
}

export async function deleteDocument(collectionName: string, id: string): Promise<void> {
  await deleteDoc(doc(requireFirebaseServices().db, collectionName, id));
}
