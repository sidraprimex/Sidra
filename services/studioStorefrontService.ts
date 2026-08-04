import {
  doc,
  getDoc,
  serverTimestamp,
  setDoc,
  updateDoc,
} from "firebase/firestore";
import { phase4Firestore } from "@/services/phase4Firebase";
import { uploadB2Media } from "@/services/b2MediaService";
import {
  defaultStudioStorefront,
  SIDRA_STOREFRONT_ACCENTS,
  type StudioStorefrontConfig,
} from "@/types/studio-storefront";
import type { Studio } from "@/types/studio";
export async function getStudioStorefront(
  studioId: string,
  sellerUid = "",
): Promise<StudioStorefrontConfig> {
  const snapshot = await getDoc(
    doc(phase4Firestore(), "studioStorefronts", studioId),
  );
  if (!snapshot.exists()) return defaultStudioStorefront(studioId, sellerUid);
  return {
    ...defaultStudioStorefront(studioId, sellerUid),
    ...snapshot.data(),
    studioId,
  } as StudioStorefrontConfig;
}
export async function getSellerStudio(
  studioId: string,
): Promise<Studio | null> {
  const snapshot = await getDoc(doc(phase4Firestore(), "studios", studioId));
  return snapshot.exists()
    ? ({ id: snapshot.id, ...snapshot.data() } as unknown as Studio)
    : null;
}
export async function saveStudioStorefront(
  value: StudioStorefrontConfig,
): Promise<void> {
  if (
    !SIDRA_STOREFRONT_ACCENTS.includes(
      value.accentColor as (typeof SIDRA_STOREFRONT_ACCENTS)[number],
    )
  )
    throw new Error("Choose one of Sidra's five brand colours.");
  if (
    value.headline.trim().length > 140 ||
    value.announcement.trim().length > 180
  )
    throw new Error("Storefront text is too long.");
  if (value.collections.length > 20)
    throw new Error("A Studio can have up to 20 collections.");
  if (
    value.collections.some(
      (item) =>
        !item.id ||
        !item.name.trim() ||
        item.name.length > 70 ||
        item.description.length > 240,
    )
  )
    throw new Error(
      "Every collection needs a short valid name and description.",
    );
  await setDoc(
    doc(phase4Firestore(), "studioStorefronts", value.studioId),
    {
      ...value,
      announcement: value.announcement.trim(),
      headline: value.headline.trim(),
      createdAt: value.createdAt ?? serverTimestamp(),
      updatedAt: serverTimestamp(),
    },
    { merge: true },
  );
}
export async function updateSellerStoreIdentity(
  studioId: string,
  value: {
    readonly name: string;
    readonly description: string;
    readonly logoUrl: string | null;
    readonly bannerUrl: string | null;
  },
): Promise<void> {
  if (value.name.trim().length < 2 || value.name.length > 100)
    throw new Error("Enter a valid Studio name.");
  if (value.description.length > 2000)
    throw new Error("Studio story is too long.");
  await updateDoc(doc(phase4Firestore(), "studios", studioId), {
    ...value,
    name: value.name.trim(),
    description: value.description.trim(),
    updatedAt: serverTimestamp(),
  });
}
export async function uploadStorefrontImage(
  studioId: string,
  file: File,
  kind: "logo" | "banner",
): Promise<string> {
  const result = await uploadB2Media({
    file,
    fileName: `${kind}-${Date.now()}-${file.name}`,
    context: "studio-branding",
    studioId,
  });
  return result.publicUrl;
}
