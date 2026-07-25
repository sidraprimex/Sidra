import {
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  onSnapshot,
  orderBy,
  query,
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

export async function toggleWishlistProduct(input: {
  productId: string;
  productSlug: string;
  productName: string;
  imageUrl: string | null;
  studioId: string;
  studioName: string;
  pricePaise: number;
}): Promise<{ active: boolean }> {
  const callable = httpsCallable<typeof input, { active: boolean }>(
    requireFirebaseServices().functions,
    "toggleWishlistProduct",
  );
  return (await callable(input)).data;
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
    where("customerId", "==", customerId),
    orderBy("createdAt", "desc"),
    limit(100),
  ));
  return snapshot.docs.map((item) => ({ notificationId: item.id, ...item.data() } as CustomerNotification));
}

export function subscribeCustomerNotifications(
  customerId: string,
  listener: (notifications: readonly CustomerNotification[]) => void,
): () => void {
  const { db } = requireFirebaseServices();
  return onSnapshot(query(
    collection(db, "notifications"),
    where("customerId", "==", customerId),
    orderBy("createdAt", "desc"),
    limit(100),
  ), (snapshot) => {
    listener(snapshot.docs.map((item) => ({ notificationId: item.id, ...item.data() } as CustomerNotification)));
  });
}

export async function isStudioFollowed(customerId: string, studioId: string): Promise<boolean> {
  const { db } = requireFirebaseServices();
  const snapshot = await getDoc(doc(db, "studioFollows", `${customerId}_${studioId}`));
  return snapshot.exists();
}
