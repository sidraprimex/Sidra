"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { subscribeCustomerNotifications } from "@/services/customerEngagementService";
import type { CustomerNotification } from "@/types/phase9-customer";

export function NotificationCenter({ customerId }: { readonly customerId: string }): React.JSX.Element {
  const [notifications, setNotifications] = useState<readonly CustomerNotification[]>([]);
  useEffect(() => subscribeCustomerNotifications(customerId, setNotifications), [customerId]);

  return <div className="grid gap-4">
    {notifications.length === 0 ? <div className="rounded-[var(--radius-lg)] border border-border bg-card p-10 text-center text-muted">No notifications.</div> : notifications.map((item) => <article key={item.notificationId} className={`rounded-[var(--radius-lg)] border p-5 ${item.read ? "border-border bg-card" : "border-[var(--color-gold-600)] bg-card"}`}>
      <div className="flex justify-between gap-3"><h2 className="font-heading text-2xl">{item.title}</h2><span className="text-xs text-muted">{item.createdAt}</span></div>
      <p className="mt-3 leading-7 text-muted">{item.body}</p>
      {item.href ? <Link href={item.href} className="mt-4 inline-flex rounded-[var(--radius-md)] border border-border px-4 py-2">Open</Link> : null}
    </article>)}
  </div>;
}
