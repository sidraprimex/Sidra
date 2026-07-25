"use client";
import { useEffect, useRef } from "react";
import { drawLuxuryFrame } from "@/lib/canvas-engine/renderFrame";
import { DEFAULT_CANVAS_FRAME_SETTINGS } from "@/lib/canvas-engine/defaults";
export function CardFramePreview({ imageUrl, categorySlug, className = "" }: { imageUrl: string; categorySlug: string; className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = canvasRef.current; if (!canvas) return;
    const image = new Image(); image.crossOrigin = "anonymous";
    image.onload = () => { const ctx = canvas.getContext("2d"); if (!ctx) return; const preset = DEFAULT_CANVAS_FRAME_SETTINGS.categories[categorySlug] ?? DEFAULT_CANVAS_FRAME_SETTINGS.default; drawLuxuryFrame(ctx, image, canvas.width, canvas.height, preset); };
    image.src = imageUrl;
  }, [imageUrl, categorySlug]);
  return <canvas ref={canvasRef} width={720} height={720} className={`h-full w-full rounded-[28px] object-cover ${className}`} aria-label="SIDRA luxury frame preview" />;
}
