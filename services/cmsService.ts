import { doc, getDoc } from "firebase/firestore";
import { foundationContent } from "@/cms/foundationContent";
import { getFirebaseServices } from "@/lib/firebaseClient";
import type { FooterContent } from "@/types/content";
export async function getFooterContent(): Promise<FooterContent> {
  const services = getFirebaseServices();
  if (!services) return foundationContent.footer;
  try {
    const snapshot = await getDoc(doc(services.db, "cms", "footer"));
    if (!snapshot.exists()) return foundationContent.footer;
    return snapshot.data() as FooterContent;
  } catch { return foundationContent.footer; }
}
