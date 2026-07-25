import { doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";
import { phase4Firestore } from "@/services/phase4Firebase";
import type { ShippingAddress } from "@/types/phase6-commerce";

export async function listAddresses(userId: string): Promise<readonly ShippingAddress[]> {
  const snapshot = await getDoc(doc(phase4Firestore(), "addressBooks", userId));
  const addresses = snapshot.data()?.addresses;
  return Array.isArray(addresses) ? addresses as ShippingAddress[] : [];
}

export async function saveAddress(userId: string, address: ShippingAddress): Promise<void> {
  const current = await listAddresses(userId);
  const next = [
    ...current.filter((item) => item.id !== address.id).map((item) => address.isDefault ? { ...item, isDefault: false } : item),
    address,
  ];
  await setDoc(doc(phase4Firestore(), "addressBooks", userId), {
    userId,
    addresses: next,
    updatedAt: serverTimestamp(),
  }, { merge: true });
}
