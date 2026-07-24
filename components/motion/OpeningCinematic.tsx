"use client";
import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { foundationContent } from "@/cms/foundationContent";
const SESSION_KEY="sidra-opening-seen";
export function OpeningCinematic({ displayName=null }:{displayName?:string|null}) {
 const root=useRef<HTMLDivElement>(null); const [visible,setVisible]=useState(true);
 useEffect(()=>{
  const node=root.current; if(!node) return;
  const reduced=window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const returning=sessionStorage.getItem(SESSION_KEY)==="1";
  const hardCap=returning?400:reduced?300:3500; const skippableAfter=returning?0:800; let canSkip=false;
  const done=()=>{sessionStorage.setItem(SESSION_KEY,"1"); gsap.to(node,{autoAlpha:0,duration:reduced?0.3:0.65,ease:"power2.out",onComplete:()=>setVisible(false)});};
  const timer=window.setTimeout(done,hardCap); const unlock=window.setTimeout(()=>canSkip=true,skippableAfter);
  if(!reduced && !returning){gsap.fromTo(node.querySelectorAll("[data-stroke]"),{y:22,opacity:0,filter:"blur(10px)"},{y:0,opacity:1,filter:"blur(0px)",duration:1.1,stagger:0.16,ease:"power4.out"}); gsap.to(node.querySelector("[data-line]"),{scaleX:1,duration:1.2,ease:"power3.inOut",delay:0.35});}
  const skip=()=>{if(canSkip){window.clearTimeout(timer);done();}}; window.addEventListener("pointerdown",skip); window.addEventListener("keydown",skip);
  return()=>{window.clearTimeout(timer);window.clearTimeout(unlock);window.removeEventListener("pointerdown",skip);window.removeEventListener("keydown",skip);};
 },[]);
 if(!visible) return null; const firstName=displayName?.trim().split(/\s+/)[0];
 return <div ref={root} className="fixed inset-0 z-[100] flex items-center justify-center overflow-hidden bg-black-950 text-ivory-100" aria-live="polite"><div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_45%,rgba(200,169,106,0.13),transparent_42%)]"/><div className="relative px-4 text-center"><p data-stroke className="font-display text-h1">{firstName?"Hello,":foundationContent.opening.guestLineOne}</p><p data-stroke className="mt-2 font-display text-hero">{firstName??foundationContent.opening.guestLineTwo}</p><div data-line className="mx-auto mt-5 h-px w-24 origin-center scale-x-0 bg-gold-500"/><p className="mt-4 text-micro uppercase tracking-[0.2em] text-gray-500">Tap to continue</p></div></div>;
}
