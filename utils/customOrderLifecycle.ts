import type { CustomOrderStatus } from "@/types/phase8-custom-orders";

export const customOrderSellerTransitions: Readonly<Partial<Record<CustomOrderStatus, readonly CustomOrderStatus[]>>> = {
  submitted: ["sellerReview"],
  sellerReview: ["clarificationRequested", "quoteSent", "cancelled"],
  clarificationRequested: ["sellerReview", "quoteSent", "cancelled"],
  paid: ["inProduction"],
  inProduction: ["proofReady"],
  revisionRequested: ["proofReady"],
  approved: ["readyToShip"],
  readyToShip: ["shipped"],
  shipped: ["delivered"],
};

export const customOrderCustomerTransitions: Readonly<Partial<Record<CustomOrderStatus, readonly CustomOrderStatus[]>>> = {
  quoteSent: ["quoteAccepted", "cancelled"],
  proofReady: ["approved", "revisionRequested"],
  delivered: ["completed", "disputed"],
};

export function isCustomOrderTransitionAllowed(
  current: CustomOrderStatus,
  next: CustomOrderStatus,
  role: "customer" | "seller" | "founder" | "support",
  force = false,
): boolean {
  if (role === "founder" && force) return current !== next;
  if (role === "seller") return customOrderSellerTransitions[current]?.includes(next) ?? false;
  if (role === "customer") return customOrderCustomerTransitions[current]?.includes(next) ?? false;
  if (role === "support") return current === "disputed" && ["completed", "refunded"].includes(next);
  return false;
}

export function canCustomerPayCustomOrder(status: CustomOrderStatus): boolean {
  return status === "quoteAccepted" || status === "paymentPending";
}

export function canSellerSendQuote(status: CustomOrderStatus): boolean {
  return status === "sellerReview" || status === "clarificationRequested";
}

export function canSubmitProof(status: CustomOrderStatus): boolean {
  return status === "inProduction" || status === "revisionRequested";
}
