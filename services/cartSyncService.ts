import {
  doc,
  getDoc,
  onSnapshot,
  runTransaction,
  serverTimestamp,
  setDoc,
  updateDoc,
} from "firebase/firestore";
import { phase4Firestore } from "@/services/phase4Firebase";
import type { CartLineItem, CustomerCart } from "@/types/phase6-commerce";

export function safeCartQuantity(value: unknown): number {
  const parsed = Math.floor(Number(value));
  return Number.isFinite(parsed) ? Math.min(20, Math.max(1, parsed)) : 1;
}

function validCartItem(value: unknown): value is CartLineItem {
  if (!value || typeof value !== "object") return false;
  const item = value as Partial<CartLineItem>;
  return Boolean(
    item.productId &&
      item.productSlug &&
      item.productName &&
      item.studioId &&
      Number.isInteger(item.unitPricePaise) &&
      Number(item.unitPricePaise) > 0 &&
      Number.isInteger(item.quantity) &&
      Number(item.quantity) >= 1 &&
      Number(item.quantity) <= 20,
  );
}

function normalizeCart(userId: string, data: unknown): CustomerCart {
  const value = data && typeof data === "object" ? data as Record<string, unknown> : {};
  return {
    userId,
    items: Array.isArray(value.items) ? value.items.filter(validCartItem) : [],
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

export async function addCartItem(userId: string, rawItem: CartLineItem): Promise<void> {
  const item = { ...rawItem, quantity: safeCartQuantity(rawItem.quantity) };
  const cartRef = doc(phase4Firestore(), "carts", userId);
  await runTransaction(phase4Firestore(), async (transaction) => {
    const snapshot = await transaction.get(cartRef);
    const cart = normalizeCart(userId, snapshot.exists() ? snapshot.data() : {});
    const exists = cart.items.some((entry) => entry.productId === item.productId && entry.variantId === item.variantId);
    const items = exists
      ? cart.items.map((entry) => entry.productId === item.productId && entry.variantId === item.variantId ? item : entry)
      : [...cart.items, item];
    transaction.set(cartRef, { userId, items, currency: "INR", updatedAt: serverTimestamp() }, { merge: true });
  });
}

export async function replaceCartForBuyNow(userId: string, rawItem: CartLineItem): Promise<void> {
  const item = { ...rawItem, quantity: safeCartQuantity(rawItem.quantity) };
  await setDoc(doc(phase4Firestore(), "carts", userId), {
    userId,
    items: [item],
    currency: "INR",
    checkoutIntent: "buyNow",
    updatedAt: serverTimestamp(),
  }, { merge: true });
}

export async function updateCartQuantity(userId: string, productId: string, variantId: string | null, quantity: number): Promise<void> {
  const cart = await getCart(userId);
  const safeQuantity = safeCartQuantity(quantity);
  const items = cart.items.map((entry) =>
    entry.productId === productId && entry.variantId === variantId
      ? { ...entry, quantity: safeQuantity }
      : entry,
  );
  await updateDoc(doc(phase4Firestore(), "carts", userId), { items, updatedAt: serverTimestamp() });
}

export async function removeCartItem(userId: string, productId: string, variantId: string | null): Promise<void> {
  const cart = await getCart(userId);
  const items = cart.items.filter((entry) => !(entry.productId === productId && entry.variantId === variantId));
  await updateDoc(doc(phase4Firestore(), "carts", userId), { items, updatedAt: serverTimestamp() });
}
