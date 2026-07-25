import { httpsCallable } from "firebase/functions";
import { requireFirebaseServices } from "@/services/firebaseClient";
import type { CheckoutDraft, PaymentSession } from "@/types/phase6-commerce";

export async function initiatePayment(checkout: CheckoutDraft, userId: string): Promise<PaymentSession> {
  const callable = httpsCallable<{ checkout: CheckoutDraft; userId: string }, PaymentSession>(
    requireFirebaseServices().functions,
    "initiatePayment",
  );
  const response = await callable({ checkout, userId });
  return response.data;
}

export async function loadRazorpay(): Promise<void> {
  if (typeof window === "undefined") return;
  if ("Razorpay" in window) return;
  await new Promise<void>((resolve, reject) => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Payment gateway could not be loaded."));
    document.head.appendChild(script);
  });
}
