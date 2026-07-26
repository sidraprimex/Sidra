import type { Firestore } from "firebase/firestore";
import type { FirebaseStorage } from "firebase/storage";

import { requireFirebaseServices } from "@/services/firebaseClient";

export function phase4Firestore(): Firestore {
  return requireFirebaseServices().db;
}

export function phase4Storage(): FirebaseStorage {
  return requireFirebaseServices().storage;
}
