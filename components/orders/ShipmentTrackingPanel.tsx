"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { PremiumLoader } from "@/components/ui/PremiumLoader";
import { refreshDelhiveryTracking } from "@/services/delhiveryShippingService";
import type { ShipmentEvent } from "@/types/logistics";
import type { FulfilmentOrder } from "@/types/phase7-orders";

const milestoneLabels = ["Shipment created", "Picked up", "In transit", "Out for delivery", "Delivered"] as const;

function activeMilestone(status: string): number {
  const value = status.toLowerCase();
  if (value.includes("deliver") && !value.includes("out")) return 4;
  if (value.includes("out for")) return 3;
  if (value.includes("transit") || value.includes("dispatch")) return 2;
  if (value.includes("pick")) return 1;
  return 0;
}

export function ShipmentTrackingPanel({ order }: { readonly order: FulfilmentOrder }): React.JSX.Element | null {
  const shipping = order.shippingPackage;
  const [status, setStatus] = useState(shipping?.status ?? "Shipment created");
  const [location, setLocation] = useState(shipping?.lastLocation ?? null);
  const [expected, setExpected] = useState(shipping?.estimatedDeliveryDate || null);
  const [events, setEvents] = useState<readonly ShipmentEvent[]>(shipping?.events ?? []);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const awb = shipping?.trackingNumber || shipping?.awb;

  const refresh = async () => {
    setBusy(true);
    setMessage("");
    try {
      const result = await refreshDelhiveryTracking(order.orderId);
      setStatus(result.status);
      setLocation(result.lastLocation);
      setExpected(result.expectedDeliveryDate);
      setEvents(result.events);
    } catch (caught) {
      setMessage(caught instanceof Error ? caught.message : "Live tracking is temporarily unavailable.");
    } finally {
      setBusy(false);
    }
  };

  useEffect(() => {
    if (awb) void refresh();
    // Refresh only when a new shipment/AWB is attached.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [awb]);

  if (!awb) return null;
  const active = activeMilestone(status);
  return <Card elevated>
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div><p className="text-xs font-semibold uppercase tracking-[.2em] text-[var(--color-dusty-rose)]">Live Delhivery tracking</p><h2 className="mt-2 font-display text-4xl text-[var(--color-deep-plum)]">{status}</h2><p className="mt-2 text-sm text-gray-700">AWB {awb}{location ? ` · ${location}` : ""}{expected ? ` · Expected ${expected}` : ""}</p></div>
      <Button variant="outline" loading={busy} onClick={() => void refresh()}>Refresh tracking</Button>
    </div>
    {busy && events.length === 0 ? <PremiumLoader label="Checking the courier network" /> : <ol className="mt-7 grid gap-3 md:grid-cols-5">
      {milestoneLabels.map((label, index) => <li key={label} className={`relative overflow-hidden rounded-2xl border p-4 ${index <= active ? "border-[var(--color-dusty-rose)] bg-white shadow-card" : "border-black/10 bg-white/45 text-black/45"}`}><span className={`mb-3 grid h-9 w-9 place-items-center rounded-full text-xs font-semibold ${index <= active ? "bg-[var(--color-deep-plum)] text-white" : "bg-black/5"}`}>{index < active ? "✓" : index + 1}</span><span className="text-sm font-semibold">{label}</span>{index === active && active < 4 ? <span className="absolute bottom-0 left-0 h-1 w-full animate-pulse bg-[var(--color-dusty-rose)]" /> : null}</li>)}
    </ol>}
    {events.length > 0 ? <div className="mt-7 grid gap-3">{events.slice(0, 12).map((event, index) => <div key={`${event.occurredAt}-${index}`} className="border-l-2 border-[var(--color-dusty-rose)] pl-4"><p className="text-sm font-semibold">{event.status || event.instructions}</p><p className="mt-1 text-xs text-black/55">{event.location || "Courier network"} · {event.occurredAt}</p></div>)}</div> : null}
    {message ? <p className="mt-5 rounded-2xl border border-amber-300 bg-amber-50 p-4 text-sm">{message}</p> : null}
    <p className="mt-5 text-xs leading-6 text-black/55">Tracking shows verified courier scans and milestones. Sidra does not display a fake GPS position when the courier does not provide coordinates.</p>
  </Card>;
}
