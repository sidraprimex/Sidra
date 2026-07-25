import { WishlistGrid } from "@/components/customer/WishlistGrid";
import { listCustomerWishlist } from "@/services/customerEngagementService";
import type { WishlistItem } from "@/types/phase9-customer";

export default async function WishlistPage(): Promise<React.JSX.Element> {
  let items: WishlistItem[] = [];
  try { items = [...await listCustomerWishlist("current-customer")]; } catch {}
  return <main className="mx-auto w-full max-w-6xl px-5 py-12 sm:px-8"><header className="mb-8"><p className="text-xs uppercase tracking-[0.18em] text-[var(--color-gold-600)]">Saved pieces</p><h1 className="mt-3 font-heading text-5xl">Wishlist</h1></header><WishlistGrid initialItems={items} /></main>;
}
