export type CustomOrderStatus =
  | "draft" | "submitted" | "sellerReview" | "clarificationRequested" | "quoteSent"
  | "quoteAccepted" | "paymentPending" | "paid" | "inProduction" | "proofReady"
  | "revisionRequested" | "approved" | "readyToShip" | "shipped" | "delivered"
  | "completed" | "cancelled" | "disputed" | "refunded";

export type CustomOrderActorRole = "customer" | "seller" | "founder" | "support";

const sellerTransitions: Partial<Record<CustomOrderStatus, readonly CustomOrderStatus[]>> = {
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

const customerTransitions: Partial<Record<CustomOrderStatus, readonly CustomOrderStatus[]>> = {
  quoteSent: ["quoteAccepted", "cancelled"],
  proofReady: ["approved", "revisionRequested"],
  delivered: ["completed", "disputed"],
};

export function isLegalCustomOrderTransition(
  current: CustomOrderStatus,
  next: CustomOrderStatus,
  role: CustomOrderActorRole,
  force = false,
): boolean {
  if (role === "founder" && force) return current !== next;
  if (role === "seller") return sellerTransitions[current]?.includes(next) ?? false;
  if (role === "customer") return customerTransitions[current]?.includes(next) ?? false;
  if (role === "support") return current === "disputed" && ["completed", "refunded"].includes(next);
  return false;
}
