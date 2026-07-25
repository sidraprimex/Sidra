import { onDocumentWritten } from "firebase-functions/v2/firestore";
import { FieldValue, getFirestore } from "firebase-admin/firestore";

export const aggregatePublishedReview = onDocumentWritten("reviews/{reviewId}", async (event) => {
  const before = event.data?.before.data();
  const after = event.data?.after.data();
  const productId = String(after?.productId ?? before?.productId ?? "");
  if (!productId) return;
  const becamePublished = before?.status !== "published" && after?.status === "published";
  const leftPublished = before?.status === "published" && after?.status !== "published";
  if (!becamePublished && !leftPublished && before?.rating === after?.rating) return;

  const db = getFirestore();
  const reviews = await db.collection("reviews").where("productId", "==", productId).where("status", "==", "published").get();
  const ratings = reviews.docs.map((item) => Number(item.data().rating ?? 0)).filter((value) => value >= 1 && value <= 5);
  const average = ratings.length ? ratings.reduce((sum, value) => sum + value, 0) / ratings.length : 0;
  await db.collection("products").doc(productId).set({
    reviewCount: ratings.length,
    averageRating: Math.round(average * 10) / 10,
    updatedAt: FieldValue.serverTimestamp(),
  }, { merge: true });
});
