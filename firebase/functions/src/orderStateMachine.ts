export type OrderStatus =
  | "placed" | "accepted" | "inProduction" | "qualityCheck" | "packaged"
  | "readyToShip" | "shipped" | "inTransit" | "outForDelivery" | "delivered"
  | "completed" | "cancelled" | "refundRequested" | "refunded";

export type ActorRole = "seller" | "customer" | "founder" | "superAdmin" | "support";

const sellerTransitions: Partial<Record<OrderStatus, readonly OrderStatus[]>> = {
  placed: ["accepted"],
  accepted: ["inProduction"],
  inProduction: ["qualityCheck"],
  qualityCheck: ["packaged"],
  packaged: ["readyToShip"],
  readyToShip: ["shipped"],
  shipped: ["inTransit"],
  inTransit: ["outForDelivery"],
  outForDelivery: ["delivered"],
};

export function isLegalTransition(current: OrderStatus, next: OrderStatus, role: ActorRole, force = false): boolean {
  if ((role === "founder" || role === "superAdmin") && force) return current !== next;
  if (role === "seller") return sellerTransitions[current]?.includes(next) ?? false;
  if (role === "customer") return current === "delivered" && next === "completed";
  if (role === "support") return current === "delivered" && next === "completed";
  return false;
}
