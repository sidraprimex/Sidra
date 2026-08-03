import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  where,
} from "firebase/firestore";
import { httpsCallable } from "firebase/functions";
import { requireFirebaseServices } from "@/services/firebaseClient";
import type {
  CustomerDashboardSummary,
  CustomerNotification,
  ProductReview,
  ReviewSubmissionInput,
  WishlistItem,
} from "@/types/phase9-customer";

function notificationDate(value: unknown): string {
  if (typeof value === "string") return value;
  if (value && typeof value === "object" && "toDate" in value && typeof (value as { toDate?: unknown }).toDate === "function") return (value as { toDate: () => Date }).toDate().toISOString();
  return "";
}

export async function getCustomerDashboardSummary(customerId: string): Promise<CustomerDashboardSummary> {
  const callable = httpsCallable<{ customerId: string }, CustomerDashboardSummary>(
    requireFirebaseServices().functions,
    "getCustomerDashboardSummary",
  );
  return (await callable({ customerId })).data;
}

export async function listCustomerWishlist(customerId: string): Promise<readonly WishlistItem[]> {
  const { db } = requireFirebaseServices();
  const snapshot = await getDocs(query(
    collection(db, "wishlists", customerId, "items"),
    orderBy("createdAt", "desc"),
  ));
  return snapshot.docs.map((item) => ({ wishlistItemId: item.id, ...item.data() } as WishlistItem));
}

export async function isProductWishlisted(customerId: string, productId: string): Promise<boolean> {
  const { db } = requireFirebaseServices();
  return (await getDoc(doc(db, "wishlists", customerId, "items", productId))).exists();
}

export async function toggleWishlistProduct(input: {
  productId: string;
  productSlug: string;
  productName: string;
  imageUrl: string | null;
  studioId: string;
  studioName: string;
  pricePaise: number;
}): Promise<{ active: boolean }> {
  const { db, auth } = requireFirebaseServices();
  const customerId = auth.currentUser?.uid;
  if (!customerId) throw new Error("Sign in to save this product.");
  const ref = doc(db, "wishlists", customerId, "items", input.productId);
  const snapshot = await getDoc(ref);
  if (snapshot.exists()) {
    await deleteDoc(ref);
    return { active: false };
  }
  await setDoc(ref, {
    customerId,
    ...input,
    createdAt: serverTimestamp(),
  });
  return { active: true };
}

export async function toggleStudioFollow(studioId: string): Promise<{ active: boolean }> {
  const callable = httpsCallable<{ studioId: string }, { active: boolean }>(
    requireFirebaseServices().functions,
    "toggleStudioFollow",
  );
  return (await callable({ studioId })).data;
}

export async function submitProductReview(input: ReviewSubmissionInput): Promise<{ reviewId: string }> {
  const callable = httpsCallable<ReviewSubmissionInput, { reviewId: string }>(
    requireFirebaseServices().functions,
    "submitProductReview",
  );
  return (await callable(input)).data;
}

export async function respondToReview(reviewId: string, response: string): Promise<void> {
  const callable = httpsCallable<{ reviewId: string; response: string }, { accepted: true }>(
    requireFirebaseServices().functions,
    "respondToReview",
  );
  await callable({ reviewId, response });
}

export async function listPublishedProductReviews(productId: string): Promise<readonly ProductReview[]> {
  const { db } = requireFirebaseServices();
  const snapshot = await getDocs(query(
    collection(db, "reviews"),
    where("productId", "==", productId),
    where("status", "==", "published"),
    orderBy("createdAt", "desc"),
    limit(100),
  ));
  return snapshot.docs.map((item) => ({ reviewId: item.id, ...item.data() } as ProductReview));
}

export async function listCustomerNotifications(customerId: string): Promise<readonly CustomerNotification[]> {
  const { db } = requireFirebaseServices();
  const snapshot = await getDocs(query(
    collection(db, "notifications"),
    where("recipientUid", "==", customerId),
    limit(100),
  ));
  return snapshot.docs.map((item) => { const data = item.data(); return { notificationId: item.id, ...data, href: data.actionUrl ?? data.href ?? null, createdAt: notificationDate(data.createdAt) } as CustomerNotification; });
}

export function subscribeCustomerNotifications(
  customerId: string,
  listener: (notifications: readonly CustomerNotification[]) => void,
): () => void {
  const { db } = requireFirebaseServices();
  return onSnapshot(query(
    collection(db, "notifications"),
    where("recipientUid", "==", customerId),
    limit(100),
  ), (snapshot) => {
    listener(snapshot.docs.map((item) => { const data = item.data(); return { notificationId: item.id, ...data, href: data.actionUrl ?? data.href ?? null, createdAt: notificationDate(data.createdAt) } as CustomerNotification; }));
  });
}

export async function isStudioFollowed(customerId: string, studioId: string): Promise<boolean> {
  const { db } = requireFirebaseServices();
  const snapshot = await getDoc(doc(db, "studioFollows", `${customerId}_${studioId}`));
  return snapshot.exists();
}
