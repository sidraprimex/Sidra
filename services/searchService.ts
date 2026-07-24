import { where } from "firebase/firestore";
import { listDocuments } from "@/services/firestoreRepository";
import type { SeoDocument } from "@/types/platform";

function tokenize(queryText: string): readonly string[] {
  return [...new Set(queryText.toLowerCase().trim().split(/[^a-z0-9]+/).filter((token) => token.length >= 2))].slice(0, 10);
}

export async function searchProductIndex(queryText: string, maxResults = 24): Promise<readonly SeoDocument[]> {
  const tokens = tokenize(queryText);
  if (tokens.length === 0) return [];
  return listDocuments<SeoDocument>("seo", [where("entityType", "==", "product"), where("searchTokens", "array-contains-any", tokens)], maxResults);
}
