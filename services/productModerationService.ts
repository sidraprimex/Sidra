import { doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";
import { phase4Firestore } from "@/services/phase4Firebase";
import type { ProductModerationSettings } from "@/types/phase4-product";

const DEFAULT_SETTINGS: ProductModerationSettings = {
  approvalRequired: true,
  updatedAt: "",
  updatedBy: "",
};

export async function getProductModerationSettings(): Promise<ProductModerationSettings> {
  const snapshot = await getDoc(doc(phase4Firestore(), "settings", "productModeration"));
  return snapshot.exists() ? ({ ...DEFAULT_SETTINGS, ...snapshot.data() } as ProductModerationSettings) : DEFAULT_SETTINGS;
}

export async function updateProductModerationSettings(
  approvalRequired: boolean,
  actorId: string,
): Promise<void> {
  await setDoc(
    doc(phase4Firestore(), "settings", "productModeration"),
    { approvalRequired, updatedBy: actorId, updatedAt: serverTimestamp() },
    { merge: true },
  );
}
