import {
  collection,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  query,
  where,
} from "firebase/firestore";
import { requireFirebaseServices } from "@/services/firebaseClient";
import type { CheckoutDraft, CustomerCart } from "@/types/phase6-commerce";
import type { CheckoutPaymentSettings } from "@/types/payment-settings";
import { callVercelBackend } from "@/services/vercelBackendService";

export type ManualPaymentStatus = "pendingVerification" | "verified" | "rejected";
export interface ManualPaymentRecord {
  readonly requestId: string;
  readonly customerId: string;
  readonly totalPaise: number;
  readonly paymentReference: string;
  readonly status: ManualPaymentStatus;
  readonly orderIds: readonly string[];
  readonly createdAt: string;
}

function dateValue(value: unknown): string {
  if (typeof value === "string") return value;
  if (value && typeof value === "object" && "toDate" in value && typeof (value as { toDate?: unknown }).toDate === "function") return (value as { toDate: () => Date }).toDate().toISOString();
  return "";
}
function mapManualPayment(requestId: string, data: Record<string, unknown>): ManualPaymentRecord {
  return {
    requestId,
    customerId: String(data.customerId ?? ""),
    totalPaise: Math.max(0, Number(data.totalPaise ?? 0)),
    paymentReference: String(data.paymentReference ?? ""),
    status: ["verified", "rejected"].includes(String(data.status)) ? String(data.status) as ManualPaymentStatus : "pendingVerification",
    orderIds: Array.isArray(data.orderIds) ? data.orderIds.filter((item): item is string => typeof item === "string") : [],
    createdAt: dateValue(data.createdAt),
  };
}

export const defaultPaymentSettings: CheckoutPaymentSettings = {
  mode: "manual", razorpayEnabled: false, manualEnabled: true, razorpayPaymentLink: "", sellerAccessFeePaise: 0,
  upiId: "tradewithsyed@ybl", accountHolderName: "Sidra", bankName: "", accountNumber: "", ifsc: "", instructions: "", supportContact: "9019254743",
};

export async function getCheckoutPaymentSettings(): Promise<CheckoutPaymentSettings> {
  const { db } = requireFirebaseServices();
  const snapshot = await getDoc(doc(db, "settings", "payments"));
  if (!snapshot.exists()) return defaultPaymentSettings;
  const stored = snapshot.data() as Partial<CheckoutPaymentSettings>;
  const razorpayEnabled = stored.razorpayEnabled === true;
  return { ...defaultPaymentSettings, ...stored, mode: stored.mode === "disabled" ? "disabled" : razorpayEnabled ? "hybrid" : "manual", manualEnabled: true,
    upiId: stored.upiId?.trim() || defaultPaymentSettings.upiId,
    accountHolderName: stored.accountHolderName?.trim() || defaultPaymentSettings.accountHolderName,
    supportContact: stored.supportContact?.trim() || defaultPaymentSettings.supportContact };
}

export async function createManualPaymentRequest(input: { userId: string; addressId: string; cart: CustomerCart; checkout: CheckoutDraft; paymentReference: string; acceptedPolicies: Readonly<Record<string, string>>; }): Promise<string> {
  const result = await callVercelBackend<
    { checkout: CheckoutDraft; paymentReference: string; acceptedPolicies: Readonly<Record<string, string>> },
    { requestId: string }
  >("createManualPaymentRequest", {
    checkout: { ...input.checkout, addressId: input.addressId, items: input.cart.items },
    paymentReference: input.paymentReference,
    acceptedPolicies: input.acceptedPolicies,
  });
  return result.requestId;
}

export async function listManualPaymentRequests(customerId: string): Promise<readonly ManualPaymentRecord[]> {
  const { db } = requireFirebaseServices();
  const snapshot = await getDocs(query(collection(db, "manualPaymentRequests"), where("customerId", "==", customerId)));
  return snapshot.docs.map((item) => mapManualPayment(item.id, item.data())).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function subscribeManualPaymentRequest(requestId: string, listener: (value: ManualPaymentRecord | null) => void): () => void {
  const { db } = requireFirebaseServices();
  return onSnapshot(doc(db, "manualPaymentRequests", requestId), (snapshot) => listener(snapshot.exists() ? mapManualPayment(snapshot.id, snapshot.data()) : null));
}
