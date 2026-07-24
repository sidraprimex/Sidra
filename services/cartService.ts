import { serverTimestamp } from "firebase/firestore";
import { deleteDocument, getDocumentById, setDocument } from "@/services/firestoreRepository";
import type { Cart, CartItem } from "@/types/engagement";

export function getCart(uid: string): Promise<Cart | null> {
  return getDocumentById<Cart>("carts", uid);
}

export function saveCart(uid: string, items: readonly CartItem[], couponCode: string | null): Promise<void> {
  return setDocument("carts", uid, { uid, items, couponCode, updatedAt: serverTimestamp() }, { merge: true });
}

export function clearCart(uid: string): Promise<void> {
  return deleteDocument("carts", uid);
}
