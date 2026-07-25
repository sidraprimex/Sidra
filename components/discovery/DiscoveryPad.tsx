"use client";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { DiscoveryTextureCanvas } from "./DiscoveryTextureCanvas";
import { HandwritingCanvas } from "./HandwritingCanvas";
import { SellerSelectionGallery } from "./SellerSelectionGallery";
import { recognizeSellerHandwriting } from "@/services/discoveryService";
import type { HandwritingStroke } from "@/types/discovery";
export function DiscoveryPad() {
  const [galleryOpen,setGalleryOpen]=useState(false); const [busy,setBusy]=useState(false); const [message,setMessage]=useState<string|null>(null); const pointers=useRef(new Map<number,{x:number;y:number}>()); const initialDistance=useRef<number|null>(null); const router=useRouter();
  const distance=()=>{const p=[...pointers.current.values()];return p.length<2?0:Math.hypot(p[0].x-p[1].x,p[0].y-p[1].y)};
  const recognize=async(strokes:HandwritingStroke[],width:number,height:number)=>{setBusy(true);setMessage(null);try{const result=await recognizeSellerHandwriting(strokes,width,height);if(result.matchedStudio){setMessage(result.recognizedText);setTimeout(()=>router.push(`/studio/${result.matchedStudio!.slug}`),520);}else setMessage("No verified artisan found.");}catch{setMessage("No verified artisan found.");}finally{setBusy(false)}};
  return <><section className="relative mx-auto flex min-h-[460px] w-full max-w-3xl animate-[pulse_7s_ease-in-out_infinite] overflow-hidden rounded-[42px] border border-gold-500/30 bg-white/[.07] shadow-[0_30px_100px_rgba(185,141,60,.18)] backdrop-blur-3xl" style={{touchAction:"none"}} onPointerDown={e=>{e.currentTarget.setPointerCapture(e.pointerId);pointers.current.set(e.pointerId,{x:e.clientX,y:e.clientY});if(pointers.current.size===2)initialDistance.current=distance();}} onPointerMove={e=>{if(!pointers.current.has(e.pointerId))return;pointers.current.set(e.pointerId,{x:e.clientX,y:e.clientY});if(pointers.current.size===2&&initialDistance.current&&distance()/initialDistance.current>1.28){setGalleryOpen(true);initialDistance.current=null;}}} onPointerUp={e=>{pointers.current.delete(e.pointerId);if(pointers.current.size<2)initialDistance.current=null;}}>
  <DiscoveryTextureCanvas/><div className="pointer-events-none absolute inset-0 bg-[linear-gradient(125deg,transparent_10%,rgba(244,211,135,.16)_36%,transparent_58%)]"/><div className="relative z-10 flex w-full flex-col"><div className="px-6 pb-3 pt-6"><p className="text-micro uppercase tracking-[.26em] text-gold-500">SIDRA Discovery Pad</p><p className="mt-2 text-sm text-white/55">Write an approved Studio name, or open the portal with a two-finger outward gesture.</p>{message&&<p className="mt-3 font-display text-xl text-ivory-100">{message}</p>}</div><div className="min-h-0 flex-1"><HandwritingCanvas onRecognize={recognize} busy={busy}/></div></div></section><SellerSelectionGallery open={galleryOpen} onClose={()=>setGalleryOpen(false)}/></>;
}
