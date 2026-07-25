import {
  collection,
  getDoc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  where,
  doc,
} from "firebase/firestore";
import { httpsCallable } from "firebase/functions";
import { requireFirebaseServices } from "@/services/firebaseClient";
import type {
  CustomOrder,
  CustomOrderMessageInput,
  ReviewCustomOrderProofInput,
  SendCustomQuoteInput,
  SubmitCustomOrderInput,
  SubmitCustomOrderProofInput,
} from "@/types/phase8-custom-orders";

function mapCustomOrder(id: string, data: Record<string, unknown>): CustomOrder {
  return { customOrderId: id, ...data } as CustomOrder;
}

export async function getCustomOrder(customOrderId: string): Promise<CustomOrder | null> {
  const { db } = requireFirebaseServices();
  const snapshot = await getDoc(doc(db, "customOrders", customOrderId));
  return snapshot.exists() ? mapCustomOrder(snapshot.id, snapshot.data()) : null;
}

export function subscribeCustomOrder(
  customOrderId: string,
  listener: (order: CustomOrder | null) => void,
): () => void {
  const { db } = requireFirebaseServices();
  return onSnapshot(doc(db, "customOrders", customOrderId), (snapshot) => {
    listener(snapshot.exists() ? mapCustomOrder(snapshot.id, snapshot.data()) : null);
  });
}

export async function listCustomerCustomOrders(customerId: string): Promise<readonly CustomOrder[]> {
  const { db } = requireFirebaseServices();
  const snapshot = await getDocs(query(
    collection(db, "customOrders"),
    where("customerId", "==", customerId),
    orderBy("createdAt", "desc"),
  ));
  return snapshot.docs.map((item) => mapCustomOrder(item.id, item.data()));
}

export async function listStudioCustomOrders(studioId: string): Promise<readonly CustomOrder[]> {
  const { db } = requireFirebaseServices();
  const snapshot = await getDocs(query(
    collection(db, "customOrders"),
    where("studioId", "==", studioId),
    orderBy("createdAt", "desc"),
  ));
  return snapshot.docs.map((item) => mapCustomOrder(item.id, item.data()));
}

export async function submitCustomOrder(input: SubmitCustomOrderInput): Promise<{ customOrderId: string }> {
  const callable = httpsCallable<SubmitCustomOrderInput, { customOrderId: string }>(
    requireFirebaseServices().functions,
    "submitCustomOrder",
  );
  return (await callable(input)).data;
}

export async function sendCustomOrderQuote(input: SendCustomQuoteInput): Promise<void> {
  const callable = httpsCallable<SendCustomQuoteInput, { accepted: true }>(
    requireFirebaseServices().functions,
    "sendCustomOrderQuote",
  );
  await callable(input);
}

export async function acceptCustomOrderQuote(customOrderId: string): Promise<{ checkoutReference: string }> {
  const callable = httpsCallable<{ customOrderId: string }, { checkoutReference: string }>(
    requireFirebaseServices().functions,
    "acceptCustomOrderQuote",
  );
  return (await callable({ customOrderId })).data;
}

export async function sendCustomOrderMessage(input: CustomOrderMessageInput): Promise<void> {
  const callable = httpsCallable<CustomOrderMessageInput, { accepted: true }>(
    requireFirebaseServices().functions,
    "sendCustomOrderMessage",
  );
  await callable(input);
}

export async function submitCustomOrderProof(input: SubmitCustomOrderProofInput): Promise<void> {
  const callable = httpsCallable<SubmitCustomOrderProofInput, { accepted: true }>(
    requireFirebaseServices().functions,
    "submitCustomOrderProof",
  );
  await callable(input);
}

export async function reviewCustomOrderProof(input: ReviewCustomOrderProofInput): Promise<void> {
  const callable = httpsCallable<ReviewCustomOrderProofInput, { accepted: true }>(
    requireFirebaseServices().functions,
    "reviewCustomOrderProof",
  );
  await callable(input);
}
