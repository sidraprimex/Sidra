import {
  addDoc,
  collection,
  doc,
  getDoc,
  serverTimestamp,
} from "firebase/firestore";
import { requireFirebaseServices } from "@/services/firebaseClient";
import type { CheckoutDraft, CustomerCart } from "@/types/phase6-commerce";
import type { CheckoutPaymentSettings } from "@/types/payment-settings";

export const defaultPaymentSettings: CheckoutPaymentSettings = {
  mode: "razorpay",
  razorpayEnabled: true,
  manualEnabled: false,
  upiId: "",
  accountHolderName: "",
  bankName: "",
  accountNumber: "",
  ifsc: "",
  instructions: "",
  supportContact: "",
};

export async function getCheckoutPaymentSettings(): Promise<CheckoutPaymentSettings> {
  const { db } = requireFirebaseServices();
  const snapshot = await getDoc(doc(db, "settings", "payments"));
  if (!snapshot.exists()) return defaultPaymentSettings;
  return { ...defaultPaymentSettings, ...(snapshot.data() as Partial<CheckoutPaymentSettings>) };
}

export async function createManualPaymentRequest(input: {
  userId: string;
  addressId: string;
  cart: CustomerCart;
  checkout: CheckoutDraft;
  paymentReference: string;
}): Promise<string> {
  const { db } = requireFirebaseServices();
  const created = await addDoc(collection(db, "manualPaymentRequests"), {
    customerId: input.userId,
    addressId: input.addressId,
    items: input.cart.items,
    subtotalPaise: input.checkout.subtotalPaise,
    shippingPaise: input.checkout.shippingPaise,
    totalPaise: input.checkout.totalPaise,
    paymentReference: input.paymentReference.trim(),
    status: "pendingVerification",
    adminNote: null,
    verifiedBy: null,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return created.id;
}
