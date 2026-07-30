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
  readonly provider?: "delhivery";
  readonly awb?: string;
  readonly pickupRequestId?: string | null;
  readonly pickupLocation?: string;
  readonly labelAvailable?: boolean;
  readonly status?: string;
  readonly statusType?: string;
  readonly lastLocation?: string | null;
  readonly events?: readonly import("@/types/logistics").ShipmentEvent[];
  readonly shippingChargePaise?: number | null;
  readonly costAllocation?: import("@/types/logistics").ShippingCostAllocation;
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

export type WithdrawalMethod = "upi" | "bank" | "imps";
export type WithdrawalStatus = "pending" | "processing" | "paid" | "rejected";

export interface SellerWithdrawal {
  readonly withdrawalId: string;
  readonly studioId: string;
  readonly sellerUid: string;
  readonly amountPaise: number;
  readonly method: WithdrawalMethod;
  readonly destination: {
    readonly upiId?: string;
    readonly accountHolderName?: string;
    readonly accountNumber?: string;
    readonly ifsc?: string;
    readonly bankName?: string;
  };
  readonly status: WithdrawalStatus;
  readonly paymentReference: string | null;
  readonly adminNote: string | null;
  readonly createdAt: string;
  readonly updatedAt: string;
}
