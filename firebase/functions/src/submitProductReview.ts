import { onCall, HttpsError } from "firebase-functions/v2/https";
import { FieldValue, getFirestore } from "firebase-admin/firestore";

export const submitProductReview = onCall(async (request) => {
  if (!request.auth?.uid) throw new HttpsError("unauthenticated", "Authentication required.");
  const orderId = String(request.data?.orderId ?? "");
  const productId = String(request.data?.productId ?? "");
  const rating = Number(request.data?.rating ?? 0);
  const title = String(request.data?.title ?? "").trim();
  const body = String(request.data?.body ?? "").trim();
  const imageUrls = Array.isArray(request.data?.imageUrls) ? request.data.imageUrls : [];
  if (!orderId || !productId || !Number.isInteger(rating) || rating < 1 || rating > 5 || title.length < 3 || body.length < 20) {
    throw new HttpsError("invalid-argument", "Complete review details are required.");
  }

  const db = getFirestore();
  const orderSnapshot = await db.collection("orders").doc(orderId).get();
  if (!orderSnapshot.exists) throw new HttpsError("not-found", "Order not found.");
  const order = orderSnapshot.data() ?? {};
  if (order.customerId !== request.auth.uid) throw new HttpsError("permission-denied", "Order does not belong to this customer.");
  if (!["delivered", "completed"].includes(String(order.orderStatus))) throw new HttpsError("failed-precondition", "Review is available after delivery.");
  const lineItem = Array.isArray(order.items) ? order.items.find((item: Record<string, unknown>) => item.productId === productId) : null;
  if (!lineItem) throw new HttpsError("failed-precondition", "Product was not purchased in this order.");

  const existing = await db.collection("reviews").where("orderId", "==", orderId).where("productId", "==", productId).where("customerId", "==", request.auth.uid).limit(1).get();
  if (!existing.empty) throw new HttpsError("already-exists", "Review already submitted.");

  const reviewRef = db.collection("reviews").doc();
  await reviewRef.set({
    orderId,
    productId,
    productSlug: String(lineItem.productSlug ?? ""),
    productName: String(lineItem.productName ?? "Product"),
    customerId: request.auth.uid,
    customerName: String(request.auth.token.name ?? "Customer"),
    studioId: String(lineItem.studioId ?? order.studioId ?? ""),
    rating,
    title,
    body,
    imageUrls,
    status: "pending",
    verifiedPurchase: true,
    sellerResponse: null,
    sellerRespondedAt: null,
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  });
  return { reviewId: reviewRef.id };
});
