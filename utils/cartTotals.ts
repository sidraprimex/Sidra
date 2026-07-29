import type { CartLineItem, CheckoutDraft } from "@/types/phase6-commerce";

export function calculateCheckoutDraft(
  items: readonly CartLineItem[],
  coupon?: {
    readonly couponId: string;
    readonly code: string;
    readonly studioId: string;
    readonly discountPaise: number;
  } | null,
): CheckoutDraft {
  const subtotalPaise = items.reduce((sum, item) => sum + item.unitPricePaise * item.quantity, 0);
  const studioIds = new Set(items.map((item) => item.studioId));
  const shippingPaise = studioIds.size * 9900;
  const discountPaise = Math.min(
    subtotalPaise,
    Math.max(0, Math.trunc(coupon?.discountPaise ?? 0)),
  );
  return {
    addressId: null,
    items,
    subtotalPaise,
    shippingPaise,
    discountPaise,
    couponId: coupon?.couponId ?? null,
    couponCode: coupon?.code ?? null,
    couponStudioId: coupon?.studioId ?? null,
    totalPaise: subtotalPaise + shippingPaise - discountPaise,
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
