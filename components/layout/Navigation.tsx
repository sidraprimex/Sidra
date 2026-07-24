"use client";
import { useEffect, useState } from "react";
import { foundationContent } from "@/cms/foundationContent";
import { MobileNavigation } from "@/components/layout/MobileNavigation";
export function Navigation() {
 const [solid,setSolid]=useState(false);
 useEffect(()=>{const fn=()=>setSolid(window.scrollY>32); fn(); window.addEventListener("scroll",fn,{passive:true}); return()=>window.removeEventListener("scroll",fn);},[]);
 return <header className={`fixed inset-x-0 top-0 z-40 transition duration-base ease-luxury ${solid ? "border-b border-gray-100/60 bg-ivory-100/90 text-black-900 backdrop-blur-xl" : "bg-transparent text-ivory-100"}`}>
  <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 md:px-6"><a href="#top" className="font-display text-h3 tracking-[0.18em]" aria-label="Sidra home">SIDRA</a>
  <nav className="hidden items-center gap-5 md:flex" aria-label="Primary navigation">{foundationContent.navigation.filter(x=>x.enabled).map(x=><a key={x.id} href={x.href} className="text-micro uppercase tracking-[0.12em] opacity-80 transition duration-fast hover:opacity-100">{x.label}</a>)}</nav><MobileNavigation items={foundationContent.navigation}/></div>
 </header>;
}
