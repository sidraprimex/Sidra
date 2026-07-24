import { getFirestore, Timestamp } from "firebase-admin/firestore";
import { logger } from "firebase-functions";
import { onDocumentCreated } from "firebase-functions/v2/firestore";
import { HttpsError, onCall } from "firebase-functions/v2/https";
import { writeAuditLog } from "./audit.js";

const DELIVERED_STATUSES = new Set(["delivered", "completed"]);

interface VerifiedOrderResult {
  readonly studioId: string;
}

async function verifyOrder(uid: string, orderId: string, productId: string): Promise<VerifiedOrderResult> {
  const orderSnapshot = await getFirestore().collection("orders").doc(orderId).get();
  if (!orderSnapshot.exists) throw new HttpsError("failed-precondition", "A delivered order is required.");
  const order = orderSnapshot.data() ?? {};
  const hasProduct = Array.isArray(order.lineItems) && order.lineItems.some((item: unknown) => {
    return typeof item === "object" && item !== null && (item as { productId?: unknown }).productId === productId;
  });
  if (order.customerId !== uid || !DELIVERED_STATUSES.has(order.orderStatus) || !hasProduct) {
    throw new HttpsError("failed-precondition", "This purchase is not eligible for a verified review.");
  }
  if (typeof order.studioId !== "string") throw new HttpsError("internal", "Order studio is invalid.");
  return { studioId: order.studioId };
}

function requiredText(value: unknown, name: string, min: number, max: number): string {
  if (typeof value !== "string") throw new HttpsError("invalid-argument", `${name} is required.`);
  const normalized = value.trim();
  if (normalized.length < min || normalized.length > max) throw new HttpsError("invalid-argument", `${name} is invalid.`);
  return normalized;
}

export const createVerifiedReview = onCall(async (request) => {
  if (!request.auth) throw new HttpsError("unauthenticated", "Sign in is required.");
  if (request.auth.token.email_verified !== true) throw new HttpsError("failed-precondition", "Verify your email first.");

  const orderId = requiredText(request.data?.orderId, "orderId", 1, 120);
  const productId = requiredText(request.data?.productId, "productId", 1, 120);
  const title = requiredText(request.data?.title, "title", 2, 160);
  const body = requiredText(request.data?.body, "body", 10, 3000);
  const rating = request.data?.rating;
  if (![1, 2, 3, 4, 5].includes(rating)) throw new HttpsError("invalid-argument", "rating must be 1 to 5.");
  const imageUrls = Array.isArray(request.data?.imageUrls)
    ? request.data.imageUrls.filter((value: unknown): value is string => typeof value === "string").slice(0, 5)
    : [];

  const { studioId } = await verifyOrder(request.auth.uid, orderId, productId);
  const reviewId = `${orderId}_${productId}_${request.auth.uid}`;
  const db = getFirestore();
  const reference = db.collection("reviews").doc(reviewId);
  if ((await reference.get()).exists) throw new HttpsError("already-exists", "A review already exists for this purchase.");

  const settings = await db.collection("settings").doc("platform").get();
  const days = settings.exists && typeof settings.data()?.reviewEditWindowDays === "number"
    ? Math.max(1, Math.min(60, settings.data()?.reviewEditWindowDays))
    : 14;
  const now = Timestamp.now();
  const editableUntil = Timestamp.fromMillis(now.toMillis() + days * 24 * 60 * 60 * 1000);
  await reference.set({
    reviewId,
    customerId: request.auth.uid,
    studioId,
    productId,
    orderId,
    rating,
    title,
    body,
    imageUrls,
    verifiedPurchase: true,
    moderationStatus: "visible",
    createdAt: now,
    editableUntil,
  });

  await writeAuditLog({
    actorUid: request.auth.uid,
    action: "review.created",
    targetType: "review",
    targetId: reviewId,
    previousValue: null,
    newValue: { orderId, productId, studioId, rating, verifiedPurchase: true },
    ipAddress: request.rawRequest.ip ?? null,
    userAgent: request.rawRequest.get("user-agent") ?? null,
  });
  return { reviewId };
});

export const guardReviewVerification = onDocumentCreated("reviews/{reviewId}", async (event) => {
  const snapshot = event.data;
  if (!snapshot) return;
  const review = snapshot.data();
  try {
    const result = await verifyOrder(review.customerId, review.orderId, review.productId);
    if (review.verifiedPurchase !== true || review.studioId !== result.studioId) {
      await snapshot.ref.update({ verifiedPurchase: true, studioId: result.studioId });
    }
  } catch (error) {
    logger.warn("Removed review that failed verified-purchase enforcement", { reviewId: snapshot.id, error });
    await snapshot.ref.delete();
  }
});
