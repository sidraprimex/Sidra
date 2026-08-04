import Link from "next/link";
import type { CustomerDashboardSummary } from "@/types/phase9-customer";

export function CustomerDashboardOverview({summary,cartCount}:{readonly summary:CustomerDashboardSummary;readonly cartCount:number}):React.JSX.Element {
  const cards = [
    ["Cart",cartCount,"/cart","Pieces waiting for checkout","✦"],
    ["Wishlist",summary.wishlistCount,"/account/wishlist","Saved inspirations","♡"],
    ["Active orders",summary.activeOrderCount,"/account/orders","Track every order","↗"],
    ["Delivered",summary.deliveredOrderCount,"/account/orders","Your completed pieces","✓"],
    ["Custom orders",summary.customOrderCount,"/account/custom-orders","Made only for you","◇"],
    ["Notifications",summary.unreadNotificationCount,"/account/notifications","Updates waiting","•"],
  ] as const;
  return <section className="grid gap-7">
    <div className="relative overflow-hidden rounded-[2rem] border border-[rgba(213,189,159,.55)] bg-[radial-gradient(circle_at_12%_10%,rgba(217,167,176,.45),transparent_30%),linear-gradient(120deg,#3B1E35,#1C1C1C)] p-7 text-white shadow-[0_35px_90px_rgba(59,30,53,.25)] sm:p-10">
      <div className="absolute -right-20 -top-28 h-72 w-72 rounded-full border border-white/10"/><div className="absolute -right-6 -top-10 h-44 w-44 rounded-full border border-[rgba(213,189,159,.35)]"/>
      <p className="text-xs uppercase tracking-[.25em] text-[var(--color-champagne)]">Your private collection room</p><h2 className="mt-4 max-w-2xl font-display text-4xl leading-none sm:text-6xl">Everything you save, buy and track—connected.</h2>
      <div className="mt-7 flex flex-wrap gap-3"><Link href="/cart" className="rounded-full bg-[var(--color-porcelain)] px-6 py-3 text-sm font-semibold text-[var(--color-deep-plum)]">Open cart · {cartCount}</Link><Link href="/account/wishlist" className="rounded-full border border-white/25 px-6 py-3 text-sm font-semibold">View wishlist</Link></div>
    </div>
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{cards.map(([label,count,href,caption,mark],index)=><Link key={label} href={href} className="group relative min-h-48 overflow-hidden rounded-[1.9rem] border border-[rgba(59,30,53,.12)] bg-[linear-gradient(145deg,rgba(248,244,240,.98),rgba(213,189,159,.22))] p-6 shadow-[0_22px_60px_rgba(59,30,53,.09)] transition duration-300 hover:-translate-y-1.5 hover:shadow-[0_30px_70px_rgba(59,30,53,.16)]"><span className="absolute right-5 top-4 font-display text-4xl text-[rgba(59,30,53,.18)]">{mark}</span><span className="absolute -bottom-14 -right-12 h-36 w-36 rounded-full bg-[rgba(217,167,176,.20)] blur-2xl"/><p className="relative text-[.68rem] font-semibold uppercase tracking-[.18em] text-black/55">0{index+1} · {label}</p><p className="relative mt-5 font-display text-6xl text-[var(--color-deep-plum)]">{count}</p><div className="relative mt-5 flex items-center justify-between text-sm text-black/55"><span>{caption}</span><span className="grid h-10 w-10 place-items-center rounded-full bg-[var(--color-deep-plum)] text-white transition group-hover:rotate-[-8deg] group-hover:scale-110">→</span></div></Link>)}</div>
  </section>;
}
