"use client";
import { useEffect, useState } from "react";
import type { NavigationItem } from "@/types/content";
export function MobileNavigation({ items }:{items:NavigationItem[]}) {
 const [open,setOpen]=useState(false);
 useEffect(()=>{document.body.style.overflow=open?"hidden":""; return()=>{document.body.style.overflow=""};},[open]);
 return <div className="md:hidden"><button type="button" onClick={()=>setOpen(true)} className="rounded-sm border border-current/30 px-3 py-2 text-micro uppercase tracking-widest" aria-expanded={open} aria-controls="mobile-nav">Menu</button>
 {open && <div id="mobile-nav" className="fixed inset-0 z-50 bg-black-950 text-ivory-100"><div className="flex h-16 items-center justify-between px-4"><span className="font-display text-h3 tracking-[0.18em]">SIDRA</span><button onClick={()=>setOpen(false)} className="rounded-sm border border-gold-500/40 px-3 py-2 text-micro uppercase tracking-widest">Close</button></div><nav className="flex min-h-[calc(100vh-4rem)] flex-col justify-center gap-5 px-6">{items.filter(x=>x.enabled).map(x=><a key={x.id} href={x.href} onClick={()=>setOpen(false)} className="border-b border-ivory-100/10 pb-3 font-display text-h2">{x.label}</a>)}</nav></div>}</div>;
}
