export interface CompressedProductImage {
  readonly optimized: Blob;
  readonly original: File;
  readonly width: number;
  readonly height: number;
}

const MAX_EDGE = 1800;
const JPEG_QUALITY = 0.84;

export async function compressProductImage(file: File): Promise<CompressedProductImage> {
  if (!file.type.startsWith("image/")) throw new Error("Only image files are accepted.");
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, MAX_EDGE / Math.max(bitmap.width, bitmap.height));
  const width = Math.max(1, Math.round(bitmap.width * scale));
  const height = Math.max(1, Math.round(bitmap.height * scale));
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d", { alpha: false });
  if (!context) throw new Error("Image processing is not supported on this device.");
  context.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();
  const optimized = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("Image compression failed."))),
      "image/jpeg",
      JPEG_QUALITY,
    );
  });
  return { optimized, original: file, width, height };
}
