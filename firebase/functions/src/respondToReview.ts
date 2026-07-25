import { onCall, HttpsError } from "firebase-functions/v2/https";
import { FieldValue, getFirestore } from "firebase-admin/firestore";

export const respondToReview = onCall(async (request) => {
  if (!request.auth?.uid || request.auth.token.role !== "seller") throw new HttpsError("permission-denied", "Seller access required.");
  const studioId = typeof request.auth.token.studioId === "string" ? request.auth.token.studioId : null;
  const reviewId = String(request.data?.reviewId ?? "");
  const response = String(request.data?.response ?? "").trim();
  if (!reviewId || response.length < 5 || response.length > 1000) throw new HttpsError("invalid-argument", "Valid response required.");
  const db = getFirestore();
  const ref = db.collection("reviews").doc(reviewId);
  const snapshot = await ref.get();
  if (!snapshot.exists) throw new HttpsError("not-found", "Review not found.");
  const review = snapshot.data() ?? {};
  if (review.status !== "published" || review.studioId !== studioId) throw new HttpsError("permission-denied", "Review response access denied.");
  await ref.update({
    sellerResponse: response,
    sellerRespondedAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  });
  return { accepted: true };
});
