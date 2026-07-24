import { orderBy, where } from "firebase/firestore";
import { getDocumentById, listDocuments } from "@/services/firestoreRepository";
import type { Payout } from "@/types/finance";

export function getPayout(payoutId: string): Promise<Payout | null> {
  return getDocumentById<Payout>("payouts", payoutId);
}

export function listStudioPayouts(studioId: string, maxResults = 50): Promise<readonly Payout[]> {
  return listDocuments<Payout>("payouts", [where("studioId", "==", studioId), orderBy("createdAt", "desc")], maxResults);
}
