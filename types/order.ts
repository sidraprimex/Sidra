import type { AuditedDocument, CurrencyCode, DateTimeValue, PostalAddress } from "@/types/firestore";

export type PaymentStatus = "pending" | "paid" | "failed" | "refunded" | "partiallyRefunded";
export type OrderStatus = "placed" | "accepted" | "inProduction" | "qualityCheck" | "packaged" | "readyToShip" | "shipped" | "inTransit" | "outForDelivery" | "delivered" | "completed" | "cancelled" | "returned";

export interface OrderLineItem {
  readonly productId: string;
  readonly variantId: string | null;
  readonly name: string;
  readonly qty: number;
  readonly unitPrice: number;
  readonly subtotal: number;
}

export interface OrderTimelineEntry {
  readonly event: string;
  readonly timestamp: DateTimeValue;
  readonly actor: string;
}

export interface Order extends AuditedDocument {
  readonly orderId: string;
  readonly customerId: string;
  readonly studioId: string;
  readonly lineItems: readonly OrderLineItem[];
  readonly shippingAddress: PostalAddress;
  readonly billingAddress: PostalAddress;
  readonly subtotal: number;
  readonly tax: number;
  readonly discount: number;
  readonly shippingFee: number;
  readonly total: number;
  readonly currency: CurrencyCode;
  readonly paymentStatus: PaymentStatus;
  readonly orderStatus: OrderStatus;
  readonly trackingNumber: string | null;
  readonly courierName: string | null;
  readonly estimatedDelivery: DateTimeValue;
  readonly invoiceUrl: string | null;
  readonly timeline: readonly OrderTimelineEntry[];
  readonly customOrderId?: string | null;
}
