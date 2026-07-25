"use client";
import Image from "next/image";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { EmptyState } from "@/components/ui/EmptyState";
import { listApprovedStudios } from "@/services/discoveryService";
import type { DiscoveryStudio } from "@/types/discovery";
export function SellerSelectionGallery({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [studios,setStudios]=useState<DiscoveryStudio[]>([]); const [loading,setLoading]=useState(true); const router=useRouter();
  useEffect(()=>{if(!open)return;let live=true;setLoading(true);listApprovedStudios().then(v=>{if(live)setStudios(v)}).finally(()=>{if(live)setLoading(false)});return()=>{live=false}},[open]);
  if(!open)return null;
  return <div className="fixed inset-0 z-[80] overflow-y-auto bg-black-950/95 px-4 py-8 backdrop-blur-2xl" role="dialog" aria-modal="true" aria-label="Approved SIDRA artisan studios"><div className="mx-auto max-w-6xl"><div className="mb-8 flex items-center justify-between"><p className="font-display text-h2 text-ivory-100">The artisan portal</p><button onClick={onClose} className="rounded-full border border-white/15 px-4 py-2 text-sm text-white/70">Close</button></div>{loading?<div className="h-64 animate-pulse rounded-[32px] border border-white/10 bg-white/5"/>:studios.length===0?<EmptyState title="The first atelier is being prepared." message="Only founder-approved, active SIDRA Studios appear here."/>:<div className="grid gap-8 md:grid-cols-2">{studios.map((studio,index)=><button key={studio.id} onClick={()=>router.push(`/studio/${studio.slug}`)} className="group relative min-h-80 overflow-hidden rounded-[34px] border border-gold-500/20 bg-white/[.055] p-6 text-left shadow-2xl transition duration-500 hover:-translate-y-2" style={{animationDelay:`${index*90}ms`}}>{studio.heroImageUrl&&<Image src={studio.heroImageUrl} alt="" fill className="object-cover opacity-50 transition duration-700 group-hover:scale-105"/>}<div className="absolute inset-0 bg-gradient-to-t from-black via-black/35 to-transparent"/><div className="relative flex h-full min-h-64 flex-col justify-end"><h2 className="font-display text-h1 text-white">{studio.name}</h2>{studio.storyFragment&&<p className="mt-3 max-w-md text-sm leading-6 text-white/70">{studio.storyFragment}</p>}</div></button>)}</div>}</div></div>;
}
