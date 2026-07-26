import {
  orderBy,
  where,
} from "firebase/firestore";
import { listDocuments } from "@/services/firestoreRepository";
import type { ProductReview } from "@/types/phase9-customer";

export function listPublishedVerifiedReviews(
  maxResults = 12,
): Promise<readonly ProductReview[]> {
  return listDocuments<ProductReview>(
    "reviews",
    [
      where("status", "==", "published"),
      where("verifiedPurchase", "==", true),
      orderBy("createdAt", "desc"),
    ],
    maxResults,
  );
}
