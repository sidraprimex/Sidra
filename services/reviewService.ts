import { orderBy, where } from "firebase/firestore";
import { callSidraFunction } from "@/services/functionService";
import { getDocumentById, listDocuments } from "@/services/firestoreRepository";
import type { CreateReviewInput, Review } from "@/types/review";

export function getReview(reviewId: string): Promise<Review | null> {
  return getDocumentById<Review>("reviews", reviewId);
}

export function listStudioReviews(studioId: string, maxResults = 50): Promise<readonly Review[]> {
  return listDocuments<Review>("reviews", [where("studioId", "==", studioId), where("moderationStatus", "==", "visible"), orderBy("createdAt", "desc")], maxResults);
}

export function createVerifiedReview(input: CreateReviewInput): Promise<{ readonly reviewId: string }> {
  return callSidraFunction("createVerifiedReview", input);
}
