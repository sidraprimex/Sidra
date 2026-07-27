import { doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";
import { phase4Firestore } from "@/services/phase4Firebase";

const LOCAL_KEY = "sidra-recently-viewed";
const MAX_ITEMS = 20;

export interface RecentlyViewedEntry {
  readonly productId: string;
  readonly viewedAt: string;
}

function readLocal(): readonly RecentlyViewedEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const rawValue = window.localStorage.getItem(LOCAL_KEY);

    if (!rawValue?.trim()) {
      return [];
    }

    let value: unknown;

    try {
      value = JSON.parse(rawValue);
    } catch {
      window.localStorage.removeItem(LOCAL_KEY);
      return [];
    }

    if (!Array.isArray(value)) {
      window.localStorage.removeItem(LOCAL_KEY);
      return [];
    }

    const entries = value.filter(
      (item): item is RecentlyViewedEntry =>
        Boolean(item) &&
        typeof item === "object" &&
        typeof (item as RecentlyViewedEntry).productId === "string",
    );
    return Array.isArray(value) ? value.slice(0, MAX_ITEMS) : [];
  } catch {
    return [];
  }
}

export async function recordRecentlyViewed(productId: string, userId?: string | null): Promise<void> {
  const entry = { productId, viewedAt: new Date().toISOString() };
  const local = [entry, ...readLocal().filter((item) => item.productId !== productId)].slice(0, MAX_ITEMS);
  if (typeof window !== "undefined") window.localStorage.setItem(LOCAL_KEY, JSON.stringify(local));
  if (!userId) return;
  await setDoc(
    doc(phase4Firestore(), "recentlyViewed", userId),
    { userId, entries: local, updatedAt: serverTimestamp() },
    { merge: true },
  );
}

export async function listRecentlyViewed(userId?: string | null): Promise<readonly RecentlyViewedEntry[]> {
  if (!userId) return readLocal();
  const snapshot = await getDoc(doc(phase4Firestore(), "recentlyViewed", userId));
  const entries = snapshot.data()?.entries;
  return Array.isArray(entries) ? (entries as RecentlyViewedEntry[]).slice(0, MAX_ITEMS) : readLocal();
}
