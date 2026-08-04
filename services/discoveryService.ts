import { collection, getDocs, limit, orderBy, query, where } from "firebase/firestore";
import { callVercelBackend } from "@/services/vercelBackendService";
import { getFirebaseServices } from "@/lib/firebaseClient";
import type { DiscoveryStudio, HandwritingRecognitionResult, HandwritingStroke } from "@/types/discovery";

export async function listApprovedStudios(maximum = 30): Promise<DiscoveryStudio[]> {
  const services = getFirebaseServices();
  if (!services) throw new Error("SIDRA is not connected to Firebase.");
  const snapshot = await getDocs(query(collection(services.db, "studios"), where("active", "==", true), where("approved", "==", true), orderBy("name"), limit(maximum)));
  return snapshot.docs.map((item) => {
    const data = item.data();
    return { id: item.id, slug: String(data.slug ?? ""), name: String(data.name ?? ""), heroImageUrl: typeof data.bannerUrl === "string" ? data.bannerUrl : null, storyFragment: typeof data.storyFragment === "string" ? data.storyFragment : null };
  }).filter((studio) => studio.slug.length > 0 && studio.name.length > 0);
}

export async function recognizeSellerHandwriting(strokes: HandwritingStroke[], width: number, height: number): Promise<HandwritingRecognitionResult> {
  const services = getFirebaseServices();
  if (!services) throw new Error("SIDRA is not connected to Firebase.");
  return callVercelBackend("recognizeSellerHandwriting", { strokes, width, height });
}
