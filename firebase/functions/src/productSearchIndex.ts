import { onDocumentWritten } from "firebase-functions/v2/firestore";
import { getFirestore, FieldValue } from "firebase-admin/firestore";

function tokenize(value: string): string[] {
  const normalized = value.toLowerCase().replace(/[^a-z0-9\s-]/g, " ").replace(/\s+/g, " ").trim();
  const words = normalized.split(" ").filter((word) => word.length >= 2);
  const prefixes = words.flatMap((word) => Array.from({ length: Math.min(word.length, 20) - 1 }, (_, index) => word.slice(0, index + 2)));
  return [...new Set([normalized, ...words, ...prefixes])].slice(0, 200);
}

export const maintainProductSearchIndex = onDocumentWritten("products/{productId}", async (event) => {
  const after = event.data?.after;
  if (!after?.exists) return;
  const data = after.data() ?? {};
  const source = [
    data.name,
    data.studioName,
    data.categorySlug,
    ...(Array.isArray(data.collectionNames) ? data.collectionNames : []),
    ...(Array.isArray(data.tags) ? data.tags : []),
    ...(Array.isArray(data.materials) ? data.materials : []),
  ].filter((value): value is string => typeof value === "string").join(" ");
  const searchTokens = tokenize(source);
  const searchSortKey = String(data.name ?? "").trim().toLowerCase();
  if (JSON.stringify(data.searchTokens ?? []) === JSON.stringify(searchTokens) && data.searchSortKey === searchSortKey) return;
  await getFirestore().collection("products").doc(event.params.productId).update({
    searchTokens,
    searchSortKey,
    searchIndexedAt: FieldValue.serverTimestamp(),
  });
});
