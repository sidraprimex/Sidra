import {
  collection,
  doc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
} from "firebase/firestore";
import { phase4Firestore } from "@/services/phase4Firebase";
import type { TaxonomyRecord } from "@/types/phase4-taxonomy";
import { normalizeSlug } from "@/utils/productValidation";

export type TaxonomyKind = "categories" | "collections";

export async function listTaxonomy(kind: TaxonomyKind): Promise<readonly TaxonomyRecord[]> {
  const snapshot = await getDocs(query(collection(phase4Firestore(), kind), orderBy("sortOrder", "asc")));
  return snapshot.docs.map((entry) => ({ id: entry.id, ...entry.data() }) as TaxonomyRecord);
}

export async function saveTaxonomy(
  kind: TaxonomyKind,
  input: Omit<TaxonomyRecord, "id" | "slug" | "createdAt" | "updatedAt"> & { readonly id?: string },
): Promise<string> {
  const slug = normalizeSlug(input.name);
  if (!slug) throw new Error("A valid taxonomy name is required.");
  const reference = input.id
    ? doc(phase4Firestore(), kind, input.id)
    : doc(collection(phase4Firestore(), kind));
  await setDoc(
    reference,
    {
      name: input.name.trim(),
      slug,
      description: input.description.trim(),
      imageUrl: input.imageUrl ?? null,
      active: input.active,
      sortOrder: input.sortOrder,
      updatedAt: serverTimestamp(),
      createdAt: serverTimestamp(),
    },
    { merge: true },
  );
  return reference.id;
}

export async function setTaxonomyActive(kind: TaxonomyKind, id: string, active: boolean): Promise<void> {
  await updateDoc(doc(phase4Firestore(), kind, id), { active, updatedAt: serverTimestamp() });
}
