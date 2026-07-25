import { doc, getDoc, onSnapshot, serverTimestamp, setDoc, updateDoc } from "firebase/firestore";
import { phase4Firestore } from "@/services/phase4Firebase";
import type { CartLineItem, CustomerCart } from "@/types/phase6-commerce";

function normalizeCart(userId: string, data: unknown): CustomerCart {
  const value = data && typeof data === "object" ? data as Record<string, unknown> : {};
  return {
    userId,
    items: Array.isArray(value.items) ? value.items as CartLineItem[] : [],
    currency: "INR",
    updatedAt: typeof value.updatedAt === "string" ? value.updatedAt : "",
  };
}

export async function getCart(userId: string): Promise<CustomerCart> {
  const snapshot = await getDoc(doc(phase4Firestore(), "carts", userId));
  return normalizeCart(userId, snapshot.exists() ? snapshot.data() : {});
}

export function subscribeCart(userId: string, listener: (cart: CustomerCart) => void): () => void {
  return onSnapshot(doc(phase4Firestore(), "carts", userId), (snapshot) => {
    listener(normalizeCart(userId, snapshot.exists() ? snapshot.data() : {}));
  });
}

export async function addCartItem(userId: string, item: CartLineItem): Promise<void> {
  const cart = await getCart(userId);
  const existing = cart.items.find((entry) => entry.productId === item.productId && entry.variantId === item.variantId);
  const items = existing
    ? cart.items.map((entry) => entry === existing ? { ...entry, quantity: entry.quantity + item.quantity } : entry)
    : [...cart.items, item];
  await setDoc(doc(phase4Firestore(), "carts", userId), {
    userId,
    items,
    currency: "INR",
    updatedAt: serverTimestamp(),
  }, { merge: true });
}

export async function updateCartQuantity(userId: string, productId: string, variantId: string | null, quantity: number): Promise<void> {
  const cart = await getCart(userId);
  const items = cart.items
    .map((entry) => entry.productId === productId && entry.variantId === variantId ? { ...entry, quantity } : entry)
    .filter((entry) => entry.quantity > 0);
  await updateDoc(doc(phase4Firestore(), "carts", userId), { items, updatedAt: serverTimestamp() });
}

export async function removeCartItem(userId: string, productId: string, variantId: string | null): Promise<void> {
  const cart = await getCart(userId);
  const items = cart.items.filter((entry) => !(entry.productId === productId && entry.variantId === variantId));
  await updateDoc(doc(phase4Firestore(), "carts", userId), { items, updatedAt: serverTimestamp() });
}
