import { foundationContent } from "@/cms/foundationContent";
import { getDocumentById, setDocument } from "@/services/firestoreRepository";
import type { CmsDocument } from "@/types/cms";
import type { FooterContent, NavigationItem } from "@/types/content";

export async function getFooterContent(): Promise<FooterContent> {
  try {
    const document = await getDocumentById<FooterContent>("cms", "footer");
    return document ?? foundationContent.footer;
  } catch {
    return foundationContent.footer;
  }
}

export async function getNavigationContent(): Promise<readonly NavigationItem[]> {
  try {
    const document = await getDocumentById<{ items?: readonly NavigationItem[] }>("cms", "navigation");
    return Array.isArray(document?.items) ? document.items : foundationContent.navigation;
  } catch {
    return foundationContent.navigation;
  }
}

export function getCmsDocument(docId: string): Promise<CmsDocument | null> {
  return getDocumentById<CmsDocument>("cms", docId);
}

export function publishCmsDocument(document: CmsDocument): Promise<void> {
  return setDocument("cms", document.docId, document);
}
