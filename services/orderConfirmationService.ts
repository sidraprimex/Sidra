import { doc, getDoc, onSnapshot, type Unsubscribe } from "firebase/firestore";
import { phase4Firestore } from "@/services/phase4Firebase";
import type { OrderConfirmation } from "@/types/phase6-commerce";

export async function getOrderConfirmation(orderId: string): Promise<OrderConfirmation | null> {
  const snapshot = await getDoc(doc(phase4Firestore(), "orders", orderId));
  return snapshot.exists() ? ({ orderId: snapshot.id, ...snapshot.data() } as OrderConfirmation) : null;
}

export function subscribeOrderConfirmation(
  orderId: string,
  listener: (order: OrderConfirmation | null) => void,
  onError?: (error: Error) => void,
): () => void {
  return onSnapshot(
    doc(phase4Firestore(), "orders", orderId),
    (snapshot) => listener(snapshot.exists() ? ({ orderId: snapshot.id, ...snapshot.data() } as OrderConfirmation) : null),
    (caught) => onError?.(caught),
  );
}

export function subscribePaymentConfirmation(
  checkoutReference: string,
  listener: (order: OrderConfirmation | null) => void,
  onError?: (error: Error) => void,
): () => void {
  let orderSubscription: Unsubscribe | null = null;
  const sessionSubscription = onSnapshot(
    doc(phase4Firestore(), "paymentSessions", checkoutReference),
    (session) => {
      if (session.exists()) {
        const orderIds = Array.isArray(session.data().orderIds) ? session.data().orderIds : [];
        const orderId = typeof orderIds[0] === "string" ? orderIds[0] : typeof session.data().orderId === "string" ? session.data().orderId : "";
        if (orderId) subscribeOrder(orderId);
        else listener(null);
      } else listener(null);
    },
    (caught) => onError?.(caught),
  );
  function subscribeOrder(orderId: string): void {
    orderSubscription?.();
    orderSubscription = subscribeOrderConfirmation(orderId, listener, onError);
  }
  return () => { sessionSubscription(); orderSubscription?.(); };
}

export interface GatewayPaymentStatus {
  readonly status: string;
  readonly orderIds: readonly string[];
}

export function subscribeGatewayPaymentStatus(
  checkoutReference: string,
  listener: (status: GatewayPaymentStatus | null) => void,
): Unsubscribe {
  return onSnapshot(doc(phase4Firestore(), "paymentSessions", checkoutReference), (snapshot) => {
    const data = snapshot.data();
    listener(snapshot.exists() ? {
      status: String(data?.status ?? "initiated"),
      orderIds: Array.isArray(data?.orderIds) ? data.orderIds.filter((item): item is string => typeof item === "string") : [],
    } : null);
  });
}
