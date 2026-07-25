export interface CartLineItem {
  readonly productId: string;
  readonly productSlug: string;
  readonly productName: string;
  readonly imageUrl: string | null;
  readonly studioId: string;
  readonly studioName: string;
  readonly variantId: string | null;
  readonly variantLabel: string | null;
  readonly unitPricePaise: number;
  readonly quantity: number;
  readonly estimatedDeliveryStart: string;
  readonly estimatedDeliveryEnd: string;
}

export interface CustomerCart {
  readonly userId: string;
  readonly items: readonly CartLineItem[];
  readonly currency: "INR";
  readonly updatedAt: string;
}

export interface ShippingAddress {
  readonly id: string;
  readonly name: string;
  readonly phone: string;
  readonly line1: string;
  readonly line2: string;
  readonly city: string;
  readonly state: string;
  readonly postalCode: string;
  readonly country: "India";
  readonly isDefault: boolean;
}

export interface CheckoutDraft {
  readonly addressId: string | null;
  readonly items: readonly CartLineItem[];
  readonly subtotalPaise: number;
  readonly shippingPaise: number;
  readonly discountPaise: number;
  readonly totalPaise: number;
  readonly studioCount: number;
  readonly shipmentCount: number;
}

export interface PaymentSession {
  readonly gatewayOrderId: string;
  readonly publicKey: string;
  readonly amountPaise: number;
  readonly currency: "INR";
  readonly checkoutReference: string;
}

export interface OrderConfirmation {
  readonly orderId: string;
  readonly orderNumber: string;
  readonly customerId: string;
  readonly items: readonly CartLineItem[];
  readonly studioIds: readonly string[];
  readonly paymentStatus: "paid";
  readonly status: "confirmed";
  readonly subtotalPaise: number;
  readonly shippingPaise: number;
  readonly totalPaise: number;
  readonly invoiceUrl: string;
  readonly createdAt: string;
}
