"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createPortal } from "react-dom";
import { useEffect, useState, type ReactNode } from "react";
import { useAuth } from "@/hooks/useAuth";
import { logout } from "@/services/authService";

interface AccountShellProps { readonly title: string; readonly eyebrow: string; readonly children: ReactNode; readonly mode?: "customer" | "seller" | "admin"; }
const customerLinks = [["Overview","/account/dashboard"],["Marketplace","/search"],["Profile","/account/profile"],["Cart","/cart"],["Orders","/account/orders"],["Payment status","/account/payments"],["Custom orders","/account/custom-orders"],["Wishlist","/account/wishlist"],["Notifications","/account/notifications"],["Support","/account/support"],["Studio application","/sell-on-sidra/status"]] as const;
const sellerLinks = [["Overview","/studio-admin/overview"],["Customize store","/studio-admin/storefront"],["Verification & pickup","/studio-admin/verification"],["Products","/studio-admin/products"],["Notifications","/studio-admin/notifications"],["Orders","/studio-admin/orders"],["Subscription","/studio-admin/subscription"],["Admin support","/studio-admin/support"],["Custom orders","/studio-admin/custom-orders"],["Customers","/studio-admin/customers"],["Analytics","/studio-admin/analytics"],["Coupons","/studio-admin/coupons"],["Campaigns","/studio-admin/campaigns"],["Payouts","/studio-admin/payouts"]] as const;
const adminLinks = [["Admin OS","/admin/control-center#overview"],["Global search","/admin/control-center#search"],["Users","/admin/control-center#users"],["Sellers","/admin/control-center#sellers"],["Seller verification","/admin/control-center#verification"],["Seller applications","/admin/sellers/applications"],["Business controls","/admin/control-center#business"],["Seller plans","/admin/control-center#subscriptions"],["Withdrawal requests","/admin/control-center#payouts"],["Settlement ledger","/admin/control-center#settlements"],["Products","/admin/control-center#products"],["Orders","/admin/control-center#orders"],["Support & payments","/admin/control-center#support"],["Page builder","/admin/control-center#content"],["Appearance","/admin/control-center#appearance"],["Payment settings","/admin/control-center#payments"],["Changes & restore","/admin/control-center#audit"]] as const;

export function AccountShell({ title, eyebrow, children, mode="customer" }: AccountShellProps): React.JSX.Element {
  const pathname = usePathname(); const router = useRouter(); const [open,setOpen]=useState(false);
  const [mounted, setMounted] = useState(false);
  const { profile, user } = useAuth();
  const links = mode === "seller" ? sellerLinks : mode === "admin" ? adminLinks : customerLinks;
  const displayName = profile?.fullName || user?.displayName || user?.email?.split("@")[0] || "Sidra member";
  const profilePhoto = profile?.profilePhoto || user?.photoURL || null;
  useEffect(() => setMounted(true), []);
  useEffect(() => { setOpen(false); }, [pathname]);
  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = previous; };
  }, [open]);
  const goBack = () => { if (window.history.length > 1) router.back(); else router.push(mode === "seller" ? "/studio-admin/overview" : mode === "admin" ? "/admin/control-center" : "/account/dashboard"); };
  return <main className="min-h-screen w-full overflow-x-clip bg-[radial-gradient(circle_at_top_right,rgba(217,167,176,.18),transparent_28%),linear-gradient(180deg,#fbf8f5,#f4ebe8)] px-4 pb-16 pt-4 text-[var(--color-deep-onyx)] sm:px-6 lg:px-8">
    <div className="mx-auto w-full max-w-7xl">
      <header className="sticky top-3 z-40 rounded-[1.5rem] border border-[rgba(59,30,53,.12)] bg-[rgba(252,249,246,.92)] p-3 shadow-[0_20px_55px_rgba(59,30,53,.10)] backdrop-blur-xl sm:p-4">
        <div className="flex items-center justify-between gap-3">
          <Link href="/" className="shrink-0 font-display text-xl tracking-[.28em] text-[var(--color-deep-plum)]">SIDRA</Link>
          <div className="flex items-center gap-2">
            <Link href="/account/profile" className="hidden min-w-0 items-center gap-3 rounded-full border border-[rgba(59,30,53,.12)] bg-white py-1.5 pl-1.5 pr-4 sm:flex" aria-label="Open profile">
              <span className="grid h-9 w-9 shrink-0 place-items-center overflow-hidden rounded-full bg-[var(--color-deep-plum)] text-sm font-semibold text-white">
                {profilePhoto ? <>
                  {/* User-provided profile URLs are intentionally rendered without Next image proxying. */}
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={profilePhoto} alt="" className="h-full w-full object-cover" />
                </> : displayName.slice(0,1).toUpperCase()}
              </span>
              <span className="max-w-36 truncate text-xs font-semibold">{displayName}</span>
            </Link>
            <button onClick={goBack} className="grid h-11 w-11 place-items-center rounded-full border border-[rgba(59,30,53,.14)] bg-white" aria-label="Go back"><svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="m15 18-6-6 6-6"/><path d="M9 12h10"/></svg></button>
            <Link href="/" className="hidden rounded-full border border-[rgba(59,30,53,.14)] bg-white px-4 py-3 text-xs font-semibold sm:block">Home</Link>
            <button type="button" onClick={()=>setOpen(true)} className="flex h-11 touch-manipulation items-center gap-2 rounded-full bg-[var(--color-deep-plum)] px-4 text-xs font-semibold text-white"><svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M4 7h16M4 12h16M4 17h16"/></svg>Menu</button>
          </div>
        </div>
      </header>

      {mounted && open ? createPortal(<div className="fixed inset-0 z-[300] bg-black/35 backdrop-blur-sm" onClick={()=>setOpen(false)} role="presentation"><aside className="absolute right-0 top-0 flex h-[100dvh] w-[min(88vw,390px)] flex-col overflow-y-auto bg-[#fbf7f3] p-5 shadow-2xl" onClick={e=>e.stopPropagation()} role="dialog" aria-modal="true" aria-label="Dashboard menu">
        <div className="flex items-center justify-between"><span className="font-display text-2xl tracking-[.22em] text-[var(--color-deep-plum)]">SIDRA</span><button onClick={()=>setOpen(false)} className="grid h-11 w-11 place-items-center rounded-full border border-black/10" aria-label="Close menu">✕</button></div>
        <Link href="/account/profile" onClick={()=>setOpen(false)} className="mt-7 flex items-center gap-3 rounded-2xl border border-black/8 bg-white/70 p-3">
          <span className="grid h-12 w-12 shrink-0 place-items-center overflow-hidden rounded-full bg-[var(--color-deep-plum)] font-semibold text-white">
            {profilePhoto ? <>
              {/* User-provided profile URLs are intentionally rendered without Next image proxying. */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={profilePhoto} alt="" className="h-full w-full object-cover" />
            </> : displayName.slice(0,1).toUpperCase()}
          </span>
          <span className="min-w-0"><strong className="block truncate text-sm">{displayName}</strong><span className="block truncate text-xs text-black/50">{user?.email}</span></span>
        </Link>
        <p className="mt-6 text-[.65rem] font-semibold uppercase tracking-[.24em] text-[var(--color-dusty-rose)]">{mode === "admin" ? "Platform operating system" : mode === "seller" ? "Studio workspace" : "Your private space"}</p>
        <nav className="mt-4 grid gap-2">{links.map(([label,href])=>{const route=href.split("#")[0];const active=pathname===route||pathname.startsWith(`${route}/`);return <Link key={href} href={href} onClick={()=>setOpen(false)} className={`flex touch-manipulation items-center justify-between rounded-2xl px-4 py-4 text-sm font-semibold ${active?"bg-[var(--color-deep-plum)] text-white":"border border-black/8 bg-white/70"}`}><span>{label}</span><span>→</span></Link>})}</nav>
        <div className="mt-auto grid gap-2 pt-6"><Link href="/" className="rounded-full border border-[var(--color-deep-plum)] px-5 py-3 text-center text-sm font-semibold text-[var(--color-deep-plum)]">Back to home</Link><button onClick={async()=>{await logout();router.replace("/")}} className="rounded-full bg-[var(--color-deep-plum)] px-5 py-3 text-sm font-semibold text-white">Sign out</button></div>
      </aside></div>, document.body) : null}

      <section className="py-9 sm:py-14"><p className="text-[.68rem] font-semibold uppercase tracking-[.24em] text-[var(--color-dusty-rose)]">{eyebrow}</p><h1 className="mt-3 max-w-5xl break-words font-display text-[clamp(2.7rem,8vw,6.2rem)] leading-[.92] text-[var(--color-deep-plum)]">{title}</h1><div className="mt-8 min-w-0">{children}</div></section>
    </div>
  </main>;
}
