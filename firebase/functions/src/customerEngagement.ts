import { onCall, HttpsError } from "firebase-functions/v2/https";
import { FieldValue, getFirestore } from "firebase-admin/firestore";

export const toggleWishlistProduct = onCall(async (request) => {
  if (!request.auth?.uid) throw new HttpsError("unauthenticated", "Authentication required.");
  const productId = String(request.data?.productId ?? "");
  if (!productId) throw new HttpsError("invalid-argument", "Product is required.");
  const db = getFirestore();
  const ref = db.collection("wishlists").doc(request.auth.uid).collection("items").doc(productId);
  const snapshot = await ref.get();
  if (snapshot.exists) {
    await ref.delete();
    return { active: false };
  }
  await ref.set({
    customerId: request.auth.uid,
    productId,
    productSlug: String(request.data?.productSlug ?? ""),
    productName: String(request.data?.productName ?? "Product"),
    imageUrl: request.data?.imageUrl ?? null,
    studioId: String(request.data?.studioId ?? ""),
    studioName: String(request.data?.studioName ?? "Studio"),
    pricePaise: Number(request.data?.pricePaise ?? 0),
    createdAt: FieldValue.serverTimestamp(),
  });
  return { active: true };
});

export const toggleStudioFollow = onCall(async (request) => {
  if (!request.auth?.uid) throw new HttpsError("unauthenticated", "Authentication required.");
  const studioId = String(request.data?.studioId ?? "");
  if (!studioId) throw new HttpsError("invalid-argument", "Studio is required.");
  const db = getFirestore();
  const ref = db.collection("studioFollows").doc(`${request.auth.uid}_${studioId}`);
  const snapshot = await ref.get();
  if (snapshot.exists) {
    await ref.delete();
    return { active: false };
  }
  await ref.set({
    customerId: request.auth.uid,
    studioId,
    targetType: "studio",
    createdAt: FieldValue.serverTimestamp(),
  });
  return { active: true };
});

export const getCustomerDashboardSummary = onCall(async (request) => {
  if (!request.auth?.uid) throw new HttpsError("unauthenticated", "Authentication required.");
  if (request.data?.customerId && request.data.customerId !== request.auth.uid) throw new HttpsError("permission-denied", "Dashboard access denied.");
  const uid = request.auth.uid;
  const db = getFirestore();
  const [activeOrders, deliveredOrders, customOrders, wishlist, follows, pendingReviews, unreadNotifications] = await Promise.all([
    db.collection("orders").where("customerId", "==", uid).where("orderStatus", "in", ["placed", "accepted", "inProduction", "qualityCheck", "packaged", "readyToShip", "shipped", "inTransit", "outForDelivery"]).count().get(),
    db.collection("orders").where("customerId", "==", uid).where("orderStatus", "in", ["delivered", "completed"]).count().get(),
    db.collection("customOrders").where("customerId", "==", uid).count().get(),
    db.collection("wishlists").doc(uid).collection("items").count().get(),
    db.collection("studioFollows").where("customerId", "==", uid).count().get(),
    db.collection("reviews").where("customerId", "==", uid).where("status", "==", "pending").count().get(),
    db.collection("notifications").where("customerId", "==", uid).where("read", "==", false).count().get(),
  ]);
  return {
    activeOrderCount: activeOrders.data().count,
    deliveredOrderCount: deliveredOrders.data().count,
    customOrderCount: customOrders.data().count,
    wishlistCount: wishlist.data().count,
    followedStudioCount: follows.data().count,
    pendingReviewCount: pendingReviews.data().count,
    unreadNotificationCount: unreadNotifications.data().count,
  };
});
