import type { CustomerTrackingStage, OrderStatus } from "@/types/phase7-orders";

export const legalSellerTransitions: Readonly<Record<OrderStatus, readonly OrderStatus[]>> = {
  placed: ["accepted"],
  accepted: ["inProduction"],
  inProduction: ["qualityCheck"],
  qualityCheck: ["packaged"],
  packaged: ["readyToShip"],
  readyToShip: ["shipped"],
  shipped: ["inTransit"],
  inTransit: ["outForDelivery"],
  outForDelivery: ["delivered"],
  delivered: ["completed"],
  completed: [],
  cancelled: [],
  refundRequested: [],
  refunded: [],
};

export const customerTrackingStages: readonly CustomerTrackingStage[] = [
  "placed",
  "shipped",
  "inTransit",
  "outForDelivery",
  "delivered",
];

export function toCustomerTrackingStage(status: OrderStatus): CustomerTrackingStage {
  if (status === "placed" || status === "accepted" || status === "inProduction" || status === "qualityCheck" || status === "packaged" || status === "readyToShip") return "placed";
  if (status === "shipped") return "shipped";
  if (status === "inTransit") return "inTransit";
  if (status === "outForDelivery") return "outForDelivery";
  return "delivered";
}

export function canShowReviewCta(status: OrderStatus): boolean {
  return status === "delivered" || status === "completed";
}

export function requiresShippingPackage(status: OrderStatus): boolean {
  return status === "readyToShip";
}

export function customerStageLabel(stage: CustomerTrackingStage): string {
  const labels: Record<CustomerTrackingStage, string> = {
    placed: "Placed",
    shipped: "Shipped",
    inTransit: "In Transit",
    outForDelivery: "Out for Delivery",
    delivered: "Delivered",
  };
  return labels[stage];
}
