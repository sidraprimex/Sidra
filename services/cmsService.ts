import { foundationContent } from "@/cms/foundationContent";
import { getDocumentById, setDocument } from "@/services/firestoreRepository";
import type { CmsDocument } from "@/types/cms";
import type { FooterContent } from "@/types/content";

export async function getFooterContent(): Promise<FooterContent> {
  try {
    const document = await getDocumentById<FooterContent>("cms", "footer");
    return document ?? foundationContent.footer;
  } catch {
    return foundationContent.footer;
  }
}

export function getCmsDocument(docId: string): Promise<CmsDocument | null> {
  return getDocumentById<CmsDocument>("cms", docId);
}

export function publishCmsDocument(document: CmsDocument): Promise<void> {
  return setDocument("cms", document.docId, document);
}
