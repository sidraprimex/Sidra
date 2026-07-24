import { getStorage } from "firebase-admin/storage";
import { logger } from "firebase-functions";
import { onSchedule } from "firebase-functions/v2/scheduler";

const MAX_TEMP_AGE_MS = 24 * 60 * 60 * 1000;

export const purgeExpiredTempUploads = onSchedule(
  { schedule: "every 60 minutes", timeZone: "Asia/Kolkata", region: "asia-south1" },
  async () => {
    const bucket = getStorage().bucket();
    const [files] = await bucket.getFiles({ prefix: "temp/" });
    const cutoff = Date.now() - MAX_TEMP_AGE_MS;
    const expired = files.filter((file) => {
      const createdAt = file.metadata.timeCreated ? Date.parse(file.metadata.timeCreated) : Number.NaN;
      return Number.isFinite(createdAt) && createdAt < cutoff;
    });

    const results = await Promise.allSettled(expired.map((file) => file.delete()));
    const deleted = results.filter((result) => result.status === "fulfilled").length;
    const failed = results.length - deleted;
    logger.info("Sidra temp upload purge completed", { scanned: files.length, expired: expired.length, deleted, failed });
  }
);
