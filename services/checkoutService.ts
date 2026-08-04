import { callVercelBackend } from "@/services/vercelBackendService";
import type { CheckoutDraft, PaymentSession } from "@/types/phase6-commerce";

export async function initiatePayment(checkout: CheckoutDraft, userId: string): Promise<PaymentSession> {
  return callVercelBackend("initiatePayment", { checkout, userId });
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
