import { doc, onSnapshot, type Unsubscribe } from "firebase/firestore";
import { getFirebaseServices } from "@/services/firebaseClient";
import type { SidraThemeSettings } from "@/types/admin-os";

export const defaultThemeSettings: Omit<SidraThemeSettings, "updatedAt" | "updatedBy"> = {
  deepPlum: "#3b1e35",
  dustyRose: "#d9a7b0",
  porcelain: "#f8f4f0",
  champagne: "#d5bd9f",
  deepOnyx: "#1c1c1c",
  cardRadiusRem: 1.6,
};

export function watchRuntimeTheme(
  onValue: (value: Omit<SidraThemeSettings, "updatedAt" | "updatedBy">) => void,
): Unsubscribe {
  const services = getFirebaseServices();
  if (!services) {
    onValue(defaultThemeSettings);
    return () => undefined;
  }
  return onSnapshot(
    doc(services.db, "settings", "theme"),
    (snapshot) => {
      const data = snapshot.data() as Partial<SidraThemeSettings> | undefined;
      onValue({
        deepPlum: data?.deepPlum ?? defaultThemeSettings.deepPlum,
        dustyRose: data?.dustyRose ?? defaultThemeSettings.dustyRose,
        porcelain: data?.porcelain ?? defaultThemeSettings.porcelain,
        champagne: data?.champagne ?? defaultThemeSettings.champagne,
        deepOnyx: data?.deepOnyx ?? defaultThemeSettings.deepOnyx,
        cardRadiusRem: data?.cardRadiusRem ?? defaultThemeSettings.cardRadiusRem,
      });
    },
    () => onValue(defaultThemeSettings),
  );
}
