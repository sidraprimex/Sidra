import { onObjectFinalized } from "firebase-functions/v2/storage";
import { getStorage } from "firebase-admin/storage";
import { logger } from "firebase-functions";

const MAX_OPTIMIZED_BYTES = 8 * 1024 * 1024;
const MAX_ORIGINAL_BYTES = 25 * 1024 * 1024;
const ALLOWED = new Set(["image/jpeg", "image/png", "image/webp", "video/webm", "video/mp4"]);

export const validateProductMediaUpload = onObjectFinalized(async (event) => {
  const object = event.data;
  const path = object.name ?? "";
  if (!/^studios\/[^/]+\/products\/[^/]+\//.test(path)) return;
  const contentType = object.contentType ?? "";
  const size = Number(object.size ?? 0);
  const original = path.includes("/original/");
  const valid = ALLOWED.has(contentType) && size > 0 && size <= (original ? MAX_ORIGINAL_BYTES : MAX_OPTIMIZED_BYTES);
  if (valid) return;
  logger.warn("Deleting invalid product media upload", { path, contentType, size });
  await getStorage().bucket(object.bucket).file(path).delete({ ignoreNotFound: true });
});
