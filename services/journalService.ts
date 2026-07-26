import { orderBy, where } from "firebase/firestore";
import { getDocumentById, listDocuments, setDocument, updateDocument } from "@/services/firestoreRepository";
import type { JournalArticle } from "@/types/marketing";

export function getJournalArticle(articleId: string): Promise<JournalArticle | null> {
  return getDocumentById<JournalArticle>("journal", articleId);
}

export async function getPublishedJournalBySlug(
  slug: string,
): Promise<JournalArticle | null> {
  const articles = await listDocuments<JournalArticle>(
    "journal",
    [
      where("slug", "==", slug),
      where("status", "==", "published"),
    ],
    1,
  );

  return articles[0] ?? null;
}

export function listPublishedJournal(maxResults = 20): Promise<readonly JournalArticle[]> {
  return listDocuments<JournalArticle>("journal", [where("status", "==", "published"), orderBy("publishedAt", "desc")], maxResults);
}

export function saveJournalArticle(article: JournalArticle): Promise<void> {
  return setDocument("journal", article.articleId, article);
}

export function updateJournalArticle(articleId: string, value: Partial<JournalArticle>): Promise<void> {
  return updateDocument<JournalArticle>("journal", articleId, value);
}
