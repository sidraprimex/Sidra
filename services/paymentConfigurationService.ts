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
  mode: "manual",
  razorpayEnabled: false,
  manualEnabled: true,
  razorpayPaymentLink: "",
  sellerAccessFeePaise: 0,
  upiId: "tradewithsyed@ybl",
  accountHolderName: "Sidra",
  bankName: "",
  accountNumber: "",
  ifsc: "",
  instructions: "",
  supportContact: "9019254743",
};

export async function getCheckoutPaymentSettings(): Promise<CheckoutPaymentSettings> {
  const { db } = requireFirebaseServices();
  const snapshot = await getDoc(doc(db, "settings", "payments"));
  if (!snapshot.exists()) return defaultPaymentSettings;
  const stored = snapshot.data() as Partial<CheckoutPaymentSettings>;
  const razorpayEnabled = stored.razorpayEnabled === true;
  return {
    ...defaultPaymentSettings,
    ...stored,
    mode:
      stored.mode === "disabled"
        ? "disabled"
        : razorpayEnabled
          ? "hybrid"
          : "manual",
    manualEnabled: true,
    upiId: stored.upiId?.trim() || defaultPaymentSettings.upiId,
    accountHolderName:
      stored.accountHolderName?.trim() ||
      defaultPaymentSettings.accountHolderName,
    supportContact:
      stored.supportContact?.trim() ||
      defaultPaymentSettings.supportContact,
  };
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
