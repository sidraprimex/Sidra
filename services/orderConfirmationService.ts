import { doc, getDoc, onSnapshot } from "firebase/firestore";
import { phase4Firestore } from "@/services/phase4Firebase";
import type { OrderConfirmation } from "@/types/phase6-commerce";

export async function getOrderConfirmation(orderId: string): Promise<OrderConfirmation | null> {
  const snapshot = await getDoc(doc(phase4Firestore(), "orders", orderId));
  return snapshot.exists() ? ({ orderId: snapshot.id, ...snapshot.data() } as OrderConfirmation) : null;
}

export function subscribeOrderConfirmation(
  orderId: string,
  listener: (order: OrderConfirmation | null) => void,
): () => void {
  return onSnapshot(doc(phase4Firestore(), "orders", orderId), (snapshot) => {
    listener(snapshot.exists() ? ({ orderId: snapshot.id, ...snapshot.data() } as OrderConfirmation) : null);
  });
}
