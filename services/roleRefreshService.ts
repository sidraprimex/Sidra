import { collection, limit, onSnapshot, orderBy, query, where, type Unsubscribe } from "firebase/firestore";
import { getFirebaseServices } from "@/lib/firebaseClient";

export function watchSellerRoleGrant(uid: string, onGranted: () => void): Unsubscribe {
  const services = getFirebaseServices();
  if (!services) return () => undefined;
  return onSnapshot(
    query(
      collection(services.db, "notifications"),
      where("recipientUid", "==", uid),
      where("type", "==", "sellerApproved"),
      orderBy("createdAt", "desc"),
      limit(1),
    ),
    (snapshot) => { if (!snapshot.empty) onGranted(); },
  );
}
