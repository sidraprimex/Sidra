import {
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  onSnapshot,
  orderBy,
  query,
  runTransaction,
  serverTimestamp,
  where,
} from "firebase/firestore";
import { callVercelBackend } from "@/services/vercelBackendService";
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
  return callVercelBackend("getCustomerDashboardSummary", { customerId });
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
  const { auth, db } = requireFirebaseServices();
  const customer = auth.currentUser;
  if (!customer) throw new Error("Sign in again to continue.");
  if (!customer.emailVerified) throw new Error("Verify your email before saving products.");

  const itemRef = doc(db, "wishlists", customer.uid, "items", input.productId);
  return runTransaction(db, async (transaction) => {
    const snapshot = await transaction.get(itemRef);
    if (snapshot.exists()) {
      transaction.delete(itemRef);
      return { active: false };
    }

    transaction.set(itemRef, {
      customerId: customer.uid,
      productId: input.productId,
      productSlug: input.productSlug,
      productName: input.productName,
      imageUrl: input.imageUrl,
      studioId: input.studioId,
      studioName: input.studioName,
      pricePaise: input.pricePaise,
      createdAt: serverTimestamp(),
    });
    return { active: true };
  });
}

export async function toggleStudioFollow(studioId: string): Promise<{ active: boolean }> {
  return callVercelBackend("toggleStudioFollow", { studioId });
}

export async function submitProductReview(input: ReviewSubmissionInput): Promise<{ reviewId: string }> {
  return callVercelBackend("submitProductReview", input);
}

export async function respondToReview(reviewId: string, response: string): Promise<void> {
  await callVercelBackend("respondToReview", { reviewId, response });
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
