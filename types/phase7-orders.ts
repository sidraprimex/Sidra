export type OrderStatus =
  | "placed"
  | "accepted"
  | "inProduction"
  | "qualityCheck"
  | "packaged"
  | "readyToShip"
  | "shipped"
  | "inTransit"
  | "outForDelivery"
  | "delivered"
  | "completed"
  | "cancelled"
  | "refundRequested"
  | "refunded";

export type CustomerTrackingStage =
  | "placed"
  | "shipped"
  | "inTransit"
  | "outForDelivery"
  | "delivered";

export interface OrderTimelineEntry {
  readonly id: string;
  readonly status: OrderStatus;
  readonly label: string;
  readonly actorId: string;
  readonly actorRole: string;
  readonly reason: string | null;
  readonly createdAt: string;
  readonly customerVisible: boolean;
}

export interface ShippingPackage {
  readonly weightGrams: number;
  readonly lengthCm: number;
  readonly widthCm: number;
  readonly heightCm: number;
  readonly courierName: string;
  readonly trackingNumber: string;
  readonly estimatedDeliveryDate: string;
  readonly dispatchedAt: string | null;
}

export interface FulfilmentOrder {
  readonly orderId: string;
  readonly orderNumber: string;
  readonly customerId: string;
  readonly customerName: string;
  readonly customerEmail: string;
  readonly customerPhone: string;
  readonly studioId: string;
  readonly studioName: string;
  readonly orderStatus: OrderStatus;
  readonly paymentStatus: "paid" | "refundPending" | "partiallyRefunded" | "refunded";
  readonly totalPaise: number;
  readonly invoiceUrl: string;
  readonly customOrderId: string | null;
  readonly shippingAddress: Record<string, string>;
  readonly shippingPackage: ShippingPackage | null;
  readonly timeline: readonly OrderTimelineEntry[];
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface OrderStatusUpdateInput {
  readonly orderId: string;
  readonly nextStatus: OrderStatus;
  readonly reason?: string;
  readonly shippingPackage?: ShippingPackage;
}

export interface RefundRequestInput {
  readonly orderId: string;
  readonly amountPaise: number;
  readonly reason: string;
  readonly evidenceUrls: readonly string[];
}

export interface SellerPayout {
  readonly payoutId: string;
  readonly orderId: string;
  readonly studioId: string;
  readonly grossPaise: number;
  readonly commissionPaise: number;
  readonly sellerAmountPaise: number;
  readonly status: "pending" | "available" | "paid";
  readonly createdAt: string;
}
