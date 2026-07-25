import { collection, doc, getDocs, orderBy, query, serverTimestamp, updateDoc, where } from "firebase/firestore";
import { phase4Firestore } from "@/services/phase4Firebase";
import type { StudioProduct } from "@/types/phase4-product";

export async function listPendingProducts(): Promise<readonly StudioProduct[]> {
  const snapshot = await getDocs(
    query(
      collection(phase4Firestore(), "products"),
      where("status", "==", "pendingReview"),
      orderBy("submittedAt", "asc"),
    ),
  );
  return snapshot.docs.map((entry) => ({ id: entry.id, ...entry.data() }) as StudioProduct);
}

export async function approveProduct(productId: string, reviewerId: string): Promise<void> {
  await updateDoc(doc(phase4Firestore(), "products", productId), {
    status: "published",
    approvedAt: serverTimestamp(),
    publishedAt: serverTimestamp(),
    reviewedBy: reviewerId,
    updatedAt: serverTimestamp(),
  });
}

export async function suspendProduct(productId: string, reviewerId: string, reason: string): Promise<void> {
  if (reason.trim().length < 8) throw new Error("A clear moderation reason is required.");
  await updateDoc(doc(phase4Firestore(), "products", productId), {
    status: "suspended",
    moderationReason: reason.trim(),
    reviewedBy: reviewerId,
    updatedAt: serverTimestamp(),
  });
}
