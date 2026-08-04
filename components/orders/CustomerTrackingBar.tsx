"use client";

import { motion } from "framer-motion";
import { customerStageLabel, customerTrackingStages, toCustomerTrackingStage } from "@/utils/orderLifecycle";
import type { OrderStatus } from "@/types/phase7-orders";

export function CustomerTrackingBar({ status }: { readonly status: OrderStatus }): React.JSX.Element {
  const current=toCustomerTrackingStage(status); const activeIndex=customerTrackingStages.indexOf(current);
  return <div className="relative overflow-hidden rounded-[2rem] border border-[rgba(59,30,53,.12)] bg-[linear-gradient(145deg,rgba(248,244,240,.96),rgba(217,167,176,.15))] p-5 shadow-[0_24px_70px_rgba(59,30,53,.10)] sm:p-7">
    <div className="absolute left-[10%] right-[10%] top-[3.05rem] hidden h-px bg-[rgba(59,30,53,.14)] sm:block"><motion.div className="h-full origin-left bg-[linear-gradient(90deg,var(--color-champagne),var(--color-dusty-rose),var(--color-deep-plum))]" initial={{scaleX:0}} animate={{scaleX:activeIndex/Math.max(1,customerTrackingStages.length-1)}} transition={{duration:1.15,ease:"easeOut"}} /></div>
    <ol className="relative grid gap-3 sm:grid-cols-5" aria-label="Order tracking">{customerTrackingStages.map((stage,index)=>{const active=index<=activeIndex;const currentStage=index===activeIndex;return <li key={stage} className={`relative rounded-[1.35rem] border p-4 text-sm backdrop-blur ${active?"border-[rgba(59,30,53,.18)] bg-white/85":"border-white/40 bg-white/35 text-black/40"}`}><motion.span animate={currentStage?{scale:[1,1.15,1],boxShadow:["0 0 0 rgba(217,167,176,0)","0 0 28px rgba(217,167,176,.75)","0 0 0 rgba(217,167,176,0)"]}:{}} transition={{duration:2,repeat:Infinity}} className={`grid h-9 w-9 place-items-center rounded-full text-xs font-bold ${active?"bg-[var(--color-deep-plum)] text-white":"bg-white text-black/40"}`}>{active&&index<activeIndex?"✓":index+1}</motion.span><span className="mt-3 block font-semibold text-[var(--color-deep-plum)]">{customerStageLabel(stage)}</span>{currentStage?<span className="mt-1 block text-[.65rem] uppercase tracking-[.16em] text-[var(--color-dusty-rose)]">Current stage</span>:null}</li>})}</ol>
  </div>;
}
