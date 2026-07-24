import { getDocumentById, setDocument } from "@/services/firestoreRepository";
import type { PlatformSettings } from "@/types/platform";

export function getPlatformSettings(settingsId = "platform"): Promise<PlatformSettings | null> {
  return getDocumentById<PlatformSettings>("settings", settingsId);
}

export function savePlatformSettings(settings: PlatformSettings): Promise<void> {
  return setDocument("settings", settings.settingsId, settings);
}
