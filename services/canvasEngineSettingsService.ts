import { doc, getDoc } from "firebase/firestore";
import { getFirebaseServices } from "@/lib/firebaseClient";
import { DEFAULT_CANVAS_FRAME_SETTINGS } from "@/lib/canvas-engine/defaults";
import type { CanvasFrameSettings } from "@/types/canvas-engine";
export async function getCanvasFrameSettings(): Promise<CanvasFrameSettings> {
  const services = getFirebaseServices();
  if (!services) return DEFAULT_CANVAS_FRAME_SETTINGS;
  const snapshot = await getDoc(doc(services.db, "settings", "canvasEngineFrames"));
  return snapshot.exists() ? (snapshot.data() as CanvasFrameSettings) : DEFAULT_CANVAS_FRAME_SETTINGS;
}
