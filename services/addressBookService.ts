import {
  doc,
  getDoc,
  runTransaction,
  serverTimestamp,
} from "firebase/firestore";
import { phase4Firestore } from "@/services/phase4Firebase";
import type { ShippingAddress } from "@/types/phase6-commerce";

function normalizedAddress(
  address: ShippingAddress,
): ShippingAddress {
  return {
    id: address.id,
    name: address.name.trim(),
    phone: address.phone.trim(),
    line1: address.line1.trim(),
    line2: address.line2.trim(),
    city: address.city.trim(),
    state: address.state.trim(),
    postalCode: address.postalCode.trim(),
    country: "India",
    isDefault: address.isDefault,
  };
}

export async function listAddresses(
  userId: string,
): Promise<readonly ShippingAddress[]> {
  const snapshot = await getDoc(
    doc(phase4Firestore(), "addressBooks", userId),
  );

  const addresses = snapshot.data()?.addresses;

  return Array.isArray(addresses)
    ? (addresses as ShippingAddress[])
    : [];
}

export async function saveAddress(
  userId: string,
  address: ShippingAddress,
): Promise<readonly ShippingAddress[]> {
  const db = phase4Firestore();
  const addressBookRef = doc(
    db,
    "addressBooks",
    userId,
  );

  const normalized = normalizedAddress(address);
  let savedAddresses: ShippingAddress[] = [];

  await runTransaction(db, async (transaction) => {
    const snapshot = await transaction.get(addressBookRef);
    const stored = snapshot.data()?.addresses;

    const current: ShippingAddress[] = Array.isArray(stored)
      ? (stored as ShippingAddress[])
      : [];

    savedAddresses = [
      ...current
        .filter((item) => item.id !== normalized.id)
        .map((item) =>
          normalized.isDefault
            ? {
                ...item,
                isDefault: false,
              }
            : item,
        ),
      normalized,
    ];

    transaction.set(
      addressBookRef,
      {
        userId,
        addresses: savedAddresses,
        updatedAt: serverTimestamp(),
      },
      {
        merge: true,
      },
    );
  });

  return savedAddresses;
}
