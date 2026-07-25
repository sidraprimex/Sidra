export type CropAnchor = "center" | "top" | "bottom" | "left" | "right";
export interface CanvasFramePreset {
  aspectRatio: number;
  cropAnchor: CropAnchor;
  borderRadius: number;
  vignetteStrength: number;
  contrast: number;
  grainOpacity: number;
  shadowOpacity: number;
}
export interface CanvasFrameSettings {
  default: CanvasFramePreset;
  categories: Record<string, CanvasFramePreset>;
  updatedAt?: unknown;
}
