"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { calculateCheckoutDraft, formatInr } from "@/utils/cartTotals";
import { removeCartItem, subscribeCart, updateCartQuantity } from "@/services/cartSyncService";
import type { CustomerCart } from "@/types/phase6-commerce";
import { defaultLogisticsSettings, getLogisticsSettings } from "@/services/businessConfigurationService";
import type { ShippingCostAllocation } from "@/types/logistics";

export function CartPageClient({ userId }: { readonly userId: string }): React.JSX.Element {
  const [cart, setCart] = useState<CustomerCart>({ userId, items: [], currency: "INR", updatedAt: "" });
  const [shippingAllocation, setShippingAllocation] = useState<ShippingCostAllocation>(defaultLogisticsSettings.shippingCostAllocation);
  useEffect(() => { const unsubscribe=subscribeCart(userId,setCart); void getLogisticsSettings().then((settings)=>setShippingAllocation(settings.shippingCostAllocation)); return unsubscribe; }, [userId]);
  const totals = useMemo(() => calculateCheckoutDraft(cart.items, null, shippingAllocation), [cart.items, shippingAllocation]);

  return <section className="grid gap-8">
    <header><p className="text-xs uppercase tracking-[0.18em] text-[var(--color-gold-600)]">Cross-device cart</p><h1 className="mt-3 font-heading text-[clamp(3rem,8vw,6rem)]">Your cart</h1></header>
    {cart.items.length === 0 ? <div className="rounded-[var(--radius-lg)] border border-border bg-card p-10 text-center text-muted">Your cart is empty.</div> : null}
    {totals.studioCount > 1 ? <div className="rounded-[var(--radius-lg)] border border-[var(--color-warning)] bg-card p-5 text-sm">Your order will be split into {totals.shipmentCount} shipments from {totals.studioCount} Studios.</div> : null}
    <div className="grid gap-5">
      {cart.items.map((item) => <article key={`${item.productId}-${item.variantId ?? "default"}`} className="grid gap-4 rounded-[var(--radius-lg)] border border-border bg-card p-5 md:grid-cols-[1fr_auto]">
        <div><h2 className="font-heading text-2xl">{item.productName}</h2><p className="mt-1 text-sm text-muted">{item.studioName}</p><p className="mt-3 text-sm">{formatInr(item.unitPricePaise)}</p><p className="mt-1 text-xs text-muted">Estimated {item.estimatedDeliveryStart}–{item.estimatedDeliveryEnd}</p></div>
        <div className="flex items-center gap-3"><input aria-label="Quantity" type="number" min="1" value={item.quantity} onChange={(event) => void updateCartQuantity(userId, item.productId, item.variantId, Number(event.target.value))} className="w-20 rounded-[var(--radius-md)] border border-border bg-background px-3 py-2" /><button className="rounded-[var(--radius-md)] border border-border px-3 py-2 text-sm" onClick={() => void removeCartItem(userId, item.productId, item.variantId)}>Remove</button></div>
      </article>)}
    </div>
    {cart.items.length > 0 ? <aside className="rounded-[var(--radius-lg)] border border-border bg-card p-6"><div className="flex justify-between"><span>Products</span><span>{formatInr(totals.subtotalPaise)}</span></div><div className="mt-3 flex justify-between text-sm text-muted"><span>Sidra delivery</span><span>{shippingAllocation === "includedInPrice" ? "Included" : formatInr(totals.shippingPaise)}</span></div><div className="mt-5 flex justify-between border-t border-border pt-5 font-heading text-2xl"><span>Total</span><span>{formatInr(totals.totalPaise)}</span></div><Link href="/checkout" className="mt-6 block rounded-[var(--radius-md)] bg-[var(--color-gold-600)] px-5 py-3 text-center text-white">Continue to checkout</Link></aside> : null}
  </section>;
}
