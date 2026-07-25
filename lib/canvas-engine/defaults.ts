import type { CanvasFrameSettings } from "@/types/canvas-engine";
const base = { aspectRatio: 1, cropAnchor: "center" as const, borderRadius: 28, vignetteStrength: 0.32, contrast: 1.06, grainOpacity: 0.045, shadowOpacity: 0.24 };
export const DEFAULT_CANVAS_FRAME_SETTINGS: CanvasFrameSettings = {
  default: base,
  categories: {
    jewelry: { ...base, aspectRatio: 0.8, cropAnchor: "center", vignetteStrength: 0.28 },
    wall_art: { ...base, aspectRatio: 1.2, cropAnchor: "center", borderRadius: 20 },
    trays: { ...base, aspectRatio: 1.35, cropAnchor: "top" },
    keychains: { ...base, aspectRatio: 1, cropAnchor: "center", contrast: 1.1 },
    furniture: { ...base, aspectRatio: 1.5, cropAnchor: "center", vignetteStrength: 0.22 },
  },
};
