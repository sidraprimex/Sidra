import { NotificationCenter } from "@/components/customer/NotificationCenter";

export default function NotificationsPage(): React.JSX.Element {
  return <main className="mx-auto w-full max-w-5xl px-5 py-12 sm:px-8"><header className="mb-8"><p className="text-xs uppercase tracking-[0.18em] text-[var(--color-gold-600)]">Updates that matter</p><h1 className="mt-3 font-heading text-5xl">Notifications</h1></header><NotificationCenter customerId="current-customer" /></main>;
}
