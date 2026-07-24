import type { AuditedDocument, DateTimeValue } from "@/types/firestore";

export interface Follower extends AuditedDocument {
  readonly followerId: string;
  readonly customerId: string;
  readonly studioId: string;
}

export interface WishlistItem {
  readonly productId: string;
  readonly studioId: string;
  readonly addedAt: DateTimeValue;
  readonly priceAtAdd: number;
}

export interface Wishlist extends AuditedDocument {
  readonly uid: string;
  readonly items: readonly WishlistItem[];
}

export interface CartItem {
  readonly productId: string;
  readonly studioId: string;
  readonly variantId: string | null;
  readonly quantity: number;
  readonly unitPriceSnapshot: number;
  readonly addedAt: DateTimeValue;
}

export interface Cart extends AuditedDocument {
  readonly uid: string;
  readonly items: readonly CartItem[];
  readonly couponCode: string | null;
}
