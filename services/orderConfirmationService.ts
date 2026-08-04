import { doc, getDoc, onSnapshot, type Unsubscribe } from "firebase/firestore";
import { phase4Firestore } from "@/services/phase4Firebase";
import type { OrderConfirmation } from "@/types/phase6-commerce";

export async function getOrderConfirmation(orderId: string): Promise<OrderConfirmation | null> {
  const snapshot = await getDoc(doc(phase4Firestore(), "orders", orderId));
  return snapshot.exists() ? ({ orderId: snapshot.id, ...snapshot.data() } as OrderConfirmation) : null;
}

export function subscribeOrderConfirmation(
  orderIdOrPaymentReference: string,
  listener: (order: OrderConfirmation | null) => void,
  onError?: (error: Error) => void,
): () => void {
  let orderSubscription: Unsubscribe | null = null;
  const subscribeOrder = (orderId: string): void => {
    orderSubscription?.();
    orderSubscription = onSnapshot(
      doc(phase4Firestore(), "orders", orderId),
      (snapshot) => listener(snapshot.exists() ? ({ orderId: snapshot.id, ...snapshot.data() } as OrderConfirmation) : null),
      (caught) => onError?.(caught),
    );
  };
  const sessionSubscription = onSnapshot(
    doc(phase4Firestore(), "paymentSessions", orderIdOrPaymentReference),
    (session) => {
      if (session.exists()) {
        const orderId = typeof session.data().orderId === "string" ? session.data().orderId : "";
        if (orderId) subscribeOrder(orderId);
        else listener(null);
      } else {
        subscribeOrder(orderIdOrPaymentReference);
      }
    },
    (caught) => onError?.(caught),
  );
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
