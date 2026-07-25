"use client";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { SupportTicketList } from "@/components/support/SupportTicketList";
export default function AccountSupportPage():React.JSX.Element{const {user}=useAuth();return <main className="mx-auto w-full max-w-5xl px-5 py-12 sm:px-8"><header className="mb-8 flex items-end justify-between gap-5"><div><p className="text-xs uppercase tracking-[0.18em] text-[var(--color-gold-600)]">Sidra care</p><h1 className="mt-3 font-heading text-5xl">Support</h1></div><Link href="/account/support/new" className="rounded-[var(--radius-md)] border border-border px-4 py-3">New request</Link></header>{user?<SupportTicketList uid={user.uid}/>:<p className="text-muted">Sign in to view support.</p>}</main>}
