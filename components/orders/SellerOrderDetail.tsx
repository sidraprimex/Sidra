"use client";

import { useMemo, useState } from "react";
import { ShipmentTrackingPanel } from "@/components/orders/ShipmentTrackingPanel";
import { Button } from "@/components/ui/Button";
import { PremiumLoader } from "@/components/ui/PremiumLoader";
import { openDelhiveryLabel, prepareDelhiveryShipment } from "@/services/delhiveryShippingService";
import { updateOrderStatus } from "@/services/orderLifecycleService";
import { legalSellerTransitions } from "@/utils/orderLifecycle";
import type { FulfilmentOrder, ShippingPackage } from "@/types/phase7-orders";

const emptyPackage: ShippingPackage = {
  weightGrams: 0,
  lengthCm: 0,
  widthCm: 0,
  heightCm: 0,
  courierName: "",
  trackingNumber: "",
  estimatedDeliveryDate: "",
  dispatchedAt: null,
};

export function SellerOrderDetail({ order }: { readonly order: FulfilmentOrder }): React.JSX.Element {
  const [shippingPackage, setShippingPackage] = useState(emptyPackage);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [prepared, setPrepared] = useState(order.shippingPackage);
  const nextStatuses = legalSellerTransitions[order.orderStatus];
  const packageValid = useMemo(() => shippingPackage.weightGrams > 0 && shippingPackage.lengthCm > 0 && shippingPackage.widthCm > 0 && shippingPackage.heightCm > 0, [shippingPackage]);

  const move = async (nextStatus: typeof nextStatuses[number]) => {
    setBusy(true);
    try {
      if (nextStatus === "readyToShip") {
        const created = await prepareDelhiveryShipment({ order, package: shippingPackage });
        setPrepared(created);
        setMessage("Shipment created. Download and print the label before handing the parcel to Delhivery.");
      } else await updateOrderStatus({ orderId: order.orderId, nextStatus });
    } catch (caught) {
      setMessage(caught instanceof Error ? caught.message : "Order could not be updated.");
    } finally {
      setBusy(false);
    }
  };

  const downloadLabel = async () => {
    setBusy(true);
    setMessage("");
    try {
      await openDelhiveryLabel(order.orderId);
    } catch (caught) {
      setMessage(caught instanceof Error ? caught.message : "Shipping label could not be downloaded.");
    } finally {
      setBusy(false);
    }
  };

  return <section className="grid gap-8"><header><p className="text-xs uppercase tracking-[0.18em] text-[var(--color-gold-600)]">{order.orderNumber}</p><h1 className="mt-3 font-heading text-5xl">Order fulfilment</h1></header><div className="grid gap-5 rounded-[var(--radius-lg)] border border-border bg-card p-6"><h2 className="font-heading text-2xl">Customer and delivery</h2><p>{order.customerName}</p><p className="text-sm text-muted">{order.customerEmail} · {order.customerPhone}</p><p className="text-sm leading-6">{order.shippingAddress.line1}{order.shippingAddress.line2 ? ", " + order.shippingAddress.line2 : ""}, {order.shippingAddress.city}, {order.shippingAddress.state} · {order.shippingAddress.postalCode}</p></div><div className="rounded-[var(--radius-lg)] border border-border bg-card p-6"><h2 className="font-heading text-2xl">Products to prepare</h2><div className="mt-4 grid gap-3">{(order.lineItems ?? []).map((item) => <div key={item.productId + ":" + (item.variantId ?? "default")} className="flex justify-between border-b border-border pb-3"><span>{item.name}</span><strong>Qty {item.qty}</strong></div>)}</div></div>
    {nextStatuses.includes("readyToShip") && !prepared ? <div className="grid gap-4 rounded-[var(--radius-lg)] border border-border bg-card p-6"><h2 className="font-heading text-2xl">Package details</h2><p className="text-sm text-muted">Sidra creates the Delhivery shipment, assigns the AWB and schedules pickup. You never pay courier charges from your pocket.</p><div className="grid gap-3 sm:grid-cols-2"><input type="number" placeholder="Weight grams" onChange={(event) => setShippingPackage({ ...shippingPackage, weightGrams: Number(event.target.value) })} className="rounded-[var(--radius-md)] border border-border bg-background px-4 py-3" /><input type="number" placeholder="Length cm" onChange={(event) => setShippingPackage({ ...shippingPackage, lengthCm: Number(event.target.value) })} className="rounded-[var(--radius-md)] border border-border bg-background px-4 py-3" /><input type="number" placeholder="Width cm" onChange={(event) => setShippingPackage({ ...shippingPackage, widthCm: Number(event.target.value) })} className="rounded-[var(--radius-md)] border border-border bg-background px-4 py-3" /><input type="number" placeholder="Height cm" onChange={(event) => setShippingPackage({ ...shippingPackage, heightCm: Number(event.target.value) })} className="rounded-[var(--radius-md)] border border-border bg-background px-4 py-3" /></div></div> : null}
    {busy ? <PremiumLoader label="Creating AWB, pickup and shipping label" /> : null}
    {prepared?.trackingNumber ? <div className="rounded-[var(--radius-lg)] border border-[var(--color-dusty-rose)] bg-white p-6"><p className="text-xs font-semibold uppercase tracking-[.18em] text-[var(--color-dusty-rose)]">Label ready</p><h2 className="mt-2 font-heading text-3xl">AWB {prepared.trackingNumber}</h2><p className="mt-3 text-sm text-muted">Download, print and paste this label securely on the parcel before pickup.</p><Button className="mt-5" loading={busy} onClick={() => void downloadLabel()}>Download / print label</Button></div> : null}
    {message ? <p className="rounded-2xl border border-black/10 bg-white p-4 text-sm">{message}</p> : null}
    <div className="flex flex-wrap gap-3">{nextStatuses.map((status) => status === "readyToShip" && prepared ? null : <button key={status} disabled={busy || (status === "readyToShip" && !packageValid)} onClick={() => void move(status)} className="rounded-[var(--radius-md)] bg-[var(--color-gold-600)] px-5 py-3 text-white disabled:opacity-50">{status === "readyToShip" ? "Ready to ship · create label" : `Move to ${status}`}</button>)}</div>
    <ShipmentTrackingPanel order={{ ...order, shippingPackage: prepared ?? order.shippingPackage }} />
  </section>;
}
