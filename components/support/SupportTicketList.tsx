"use client";
import Link from "next/link";
import { useEffect,useState } from "react";
import { EmptyState } from "@/components/ui/EmptyState";
import { listMySupportTickets } from "@/services/phase12CommunicationService";
import type { Phase12SupportTicket } from "@/types/phase12-communication";
export function SupportTicketList({uid}:{readonly uid:string}):React.JSX.Element{const [items,setItems]=useState<readonly Phase12SupportTicket[]>([]);useEffect(()=>{void listMySupportTickets(uid).then(setItems);},[uid]);if(items.length===0)return <EmptyState title="No support requests" message="Your conversations with the Sidra care team will appear here."/>;return <div className="grid gap-4">{items.map((item)=><Link key={item.ticketId} href={`/account/support/${item.ticketId}`} className="rounded-[var(--radius-lg)] border border-border bg-card p-5 transition hover:border-[var(--color-gold-500)]"><div className="flex items-center justify-between gap-4"><h2 className="font-heading text-2xl">{item.subject}</h2><span className="rounded-full border border-border px-3 py-1 text-xs">{item.status}</span></div><p className="mt-2 line-clamp-2 text-sm leading-6 text-muted">{item.description}</p></Link>)}</div>}
