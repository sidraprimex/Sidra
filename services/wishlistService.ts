import { serverTimestamp } from "firebase/firestore";
import { deleteDocument, getDocumentById, setDocument } from "@/services/firestoreRepository";
import type { Wishlist, WishlistItem } from "@/types/engagement";

export function getWishlist(uid: string): Promise<Wishlist | null> {
  return getDocumentById<Wishlist>("wishlists", uid);
}

export function saveWishlist(uid: string, items: readonly WishlistItem[]): Promise<void> {
  return setDocument("wishlists", uid, { uid, items, updatedAt: serverTimestamp() }, { merge: true });
}

export function clearWishlist(uid: string): Promise<void> {
  return deleteDocument("wishlists", uid);
}
