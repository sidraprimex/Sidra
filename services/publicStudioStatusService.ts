import { doc, getDoc } from "firebase/firestore";
import { getFirebaseServices } from "@/lib/firebaseClient";
import type { StudioUnavailableMode } from "@/types/studio-provisioning";

export interface PublicStudioRoute {
  studioId: string;
  slug: string;
  displayName: string;
  status: "provisioning" | "active" | "suspended";
  unavailableMode: StudioUnavailableMode;
}

export async function getPublicStudioRoute(slug: string): Promise<PublicStudioRoute | null> {
  const services = getFirebaseServices();
  if (!services) throw new Error("Sidra is not connected to Firebase. Add the required environment variables.");
  const snapshot = await getDoc(doc(services.db, "studioRoutes", slug));
  return snapshot.exists() ? (snapshot.data() as PublicStudioRoute) : null;
}
