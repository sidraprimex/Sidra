import type { CartLineItem } from "@/types/phase6-commerce";

export interface StoredCheckoutState {
  readonly step?: number;
  readonly addressId?: string | null;
  readonly checkoutReference?: string | null;
  readonly confirmationMode?: "gateway" | "manual" | null;
  readonly manualReference?: string;
  readonly policiesAccepted?: boolean;
  readonly cartFingerprint?: string;
}

export function checkoutCartFingerprint(
  items: readonly CartLineItem[],
): string {
  return items
    .map((item) =>
      [
        item.productId,
        item.variantId ?? "default",
        item.quantity,
        item.unitPricePaise,
      ].join(":"),
    )
    .sort()
    .join("|");
}

export function canRestoreCheckoutState(
  stored: StoredCheckoutState | null,
  cartFingerprint: string,
): stored is StoredCheckoutState {
  return Boolean(
    stored &&
      cartFingerprint &&
      stored.cartFingerprint === cartFingerprint,
  );
}
