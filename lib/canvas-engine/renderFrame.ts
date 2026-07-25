import type { CanvasFramePreset } from "@/types/canvas-engine";
export function drawLuxuryFrame(ctx: CanvasRenderingContext2D, image: CanvasImageSource, width: number, height: number, preset: CanvasFramePreset): void {
  ctx.clearRect(0, 0, width, height);
  ctx.save();
  ctx.filter = `contrast(${preset.contrast}) saturate(1.04)`;
  const sourceWidth = "naturalWidth" in image ? Number(image.naturalWidth) : width;
  const sourceHeight = "naturalHeight" in image ? Number(image.naturalHeight) : height;
  const scale = Math.max(width / sourceWidth, height / sourceHeight);
  const drawWidth = sourceWidth * scale;
  const drawHeight = sourceHeight * scale;
  let x = (width - drawWidth) / 2;
  let y = (height - drawHeight) / 2;
  if (preset.cropAnchor === "top") y = 0;
  if (preset.cropAnchor === "bottom") y = height - drawHeight;
  if (preset.cropAnchor === "left") x = 0;
  if (preset.cropAnchor === "right") x = width - drawWidth;
  ctx.drawImage(image, x, y, drawWidth, drawHeight);
  ctx.filter = "none";
  const vignette = ctx.createRadialGradient(width / 2, height / 2, Math.min(width, height) * 0.18, width / 2, height / 2, Math.max(width, height) * 0.72);
  vignette.addColorStop(0, "rgba(209,170,92,0.03)");
  vignette.addColorStop(1, `rgba(16,12,8,${preset.vignetteStrength})`);
  ctx.fillStyle = vignette;
  ctx.fillRect(0, 0, width, height);
  const grain = ctx.createImageData(width, height);
  for (let i = 0; i < grain.data.length; i += 4) {
    const value = Math.random() * 255;
    grain.data[i] = value; grain.data[i + 1] = value; grain.data[i + 2] = value; grain.data[i + 3] = Math.round(255 * preset.grainOpacity);
  }
  ctx.putImageData(grain, 0, 0);
  ctx.restore();
}
