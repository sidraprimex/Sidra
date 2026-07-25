export interface KenBurnsFrame { image: CanvasImageSource; durationMs: number; startScale: number; endScale: number; }
export async function renderKenBurnsVideo(canvas: HTMLCanvasElement, frames: KenBurnsFrame[], fps = 30): Promise<Blob> {
  if (frames.length < 4 || frames.length > 5) throw new Error("Photo-to-video requires exactly 4 or 5 seller-uploaded stills.");
  const stream = canvas.captureStream(fps);
  const recorder = new MediaRecorder(stream, { mimeType: "video/webm;codecs=vp9" });
  const chunks: BlobPart[] = [];
  recorder.ondataavailable = (event) => { if (event.data.size > 0) chunks.push(event.data); };
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Canvas 2D is unavailable.");
  recorder.start();
  for (let index = 0; index < frames.length; index += 1) {
    const frame = frames[index];
    const started = performance.now();
    await new Promise<void>((resolve) => {
      const tick = (now: number) => {
        const progress = Math.min(1, (now - started) / frame.durationMs);
        const scale = frame.startScale + (frame.endScale - frame.startScale) * progress;
        context.clearRect(0, 0, canvas.width, canvas.height);
        context.save();
        context.globalAlpha = Math.min(1, progress * 5);
        context.translate(canvas.width / 2, canvas.height / 2);
        context.scale(scale, scale);
        context.drawImage(frame.image, -canvas.width / 2, -canvas.height / 2, canvas.width, canvas.height);
        context.restore();
        if (progress < 1) requestAnimationFrame(tick); else resolve();
      };
      requestAnimationFrame(tick);
    });
  }
  recorder.stop();
  await new Promise<void>((resolve) => { recorder.onstop = () => resolve(); });
  return new Blob(chunks, { type: "video/webm" });
}
