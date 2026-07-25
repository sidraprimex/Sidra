"use client";
import { useEffect, useRef } from "react";
export function DiscoveryTextureCanvas() {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = ref.current; if (!canvas) return; const ctx = canvas.getContext("2d"); if (!ctx) return;
    let frame = 0; let raf = 0;
    const draw = () => { frame += 0.004; const dpr = window.devicePixelRatio || 1; const w = canvas.clientWidth; const h = canvas.clientHeight; if (canvas.width !== w * dpr || canvas.height !== h * dpr) { canvas.width = w * dpr; canvas.height = h * dpr; ctx.setTransform(dpr,0,0,dpr,0,0); }
      ctx.clearRect(0,0,w,h); const g = ctx.createRadialGradient(w*(0.45+Math.sin(frame)*0.06),h*0.42,10,w/2,h/2,Math.max(w,h)*0.75); g.addColorStop(0,"rgba(229,194,120,.20)"); g.addColorStop(.48,"rgba(255,255,255,.05)"); g.addColorStop(1,"rgba(6,6,7,.34)"); ctx.fillStyle=g; ctx.fillRect(0,0,w,h); raf=requestAnimationFrame(draw); };
    draw(); return () => cancelAnimationFrame(raf);
  }, []);
  return <canvas ref={ref} className="pointer-events-none absolute inset-0 h-full w-full" aria-hidden="true" />;
}
