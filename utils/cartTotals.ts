import type { CartLineItem, CheckoutDraft } from "@/types/phase6-commerce";

export function calculateCheckoutDraft(items: readonly CartLineItem[]): CheckoutDraft {
  const subtotalPaise = items.reduce((sum, item) => sum + item.unitPricePaise * item.quantity, 0);
  const studioIds = new Set(items.map((item) => item.studioId));
  const shippingPaise = studioIds.size * 9900;
  return {
    addressId: null,
    items,
    subtotalPaise,
    shippingPaise,
    discountPaise: 0,
    totalPaise: subtotalPaise + shippingPaise,
    studioCount: studioIds.size,
    shipmentCount: studioIds.size,
  };
}

export function formatInr(paise: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(paise / 100);
}
