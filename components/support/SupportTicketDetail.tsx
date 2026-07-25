"use client";
import { useEffect,useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { getDocumentById } from "@/services/firestoreRepository";
import { SupportConversation } from "@/components/support/SupportConversation";
import { ErrorState } from "@/components/ui/ErrorState";
import { LoadingSkeleton } from "@/components/ui/LoadingSkeleton";
import type { Phase12SupportTicket } from "@/types/phase12-communication";
export function SupportTicketDetail({ticketId}:{readonly ticketId:string}):React.JSX.Element{const {user}=useAuth();const [ticket,setTicket]=useState<Phase12SupportTicket|null|undefined>(undefined);useEffect(()=>{void getDocumentById<Phase12SupportTicket>("supportTickets",ticketId).then(setTicket).catch(()=>setTicket(null));},[ticketId]);if(ticket===undefined)return <LoadingSkeleton count={6}/>;if(!ticket)return <ErrorState message="This support request could not be opened."/>;return <div className="grid gap-7"><header className="rounded-[var(--radius-lg)] border border-border bg-card p-6"><div className="flex flex-wrap items-center justify-between gap-3"><div><p className="text-xs uppercase tracking-[0.16em] text-muted">{ticket.category}</p><h1 className="mt-2 font-heading text-4xl">{ticket.subject}</h1></div><span className="rounded-full border border-border px-3 py-1 text-xs">{ticket.status}</span></div><p className="mt-4 leading-7 text-muted">{ticket.description}</p></header>{user?<SupportConversation ticketId={ticket.ticketId} conversationId={ticket.conversationId} currentUid={user.uid} closed={ticket.status==="closed"}/>:null}</div>}
