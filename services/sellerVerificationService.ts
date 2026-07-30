import { doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";
import { requireFirebaseServices } from "@/services/firebaseClient";
import type { SellerVerification } from "@/types/logistics";

export async function getSellerVerification(studioId: string): Promise<SellerVerification | null> {
  const { db } = requireFirebaseServices();
  const snapshot = await getDoc(doc(db, "sellerVerifications", studioId));
  return snapshot.exists() ? snapshot.data() as SellerVerification : null;
}

export async function uploadSellerKycDocument(params: {
  studioId: string;
  sellerUid: string;
  file: File;
}): Promise<string> {
  const { auth } = requireFirebaseServices();
  const token = await auth.currentUser?.getIdToken();
  if (!token) throw new Error("Sign in again before uploading.");
  const form = new FormData();
  form.set("file", params.file);
  form.set("ownerUid", params.sellerUid);
  form.set("studioId", params.studioId);
  form.set("context", "seller-kyc");
  const response = await fetch("/api/media/b2/upload", {
    method: "POST",
    headers: { authorization: `Bearer ${token}` },
    body: form,
  });
  const payload = await response.json() as { path?: string; error?: string };
  if (!response.ok || !payload.path) throw new Error(payload.error ?? "Document upload failed.");
  return payload.path;
}

export async function submitSellerVerification(
  value: Omit<SellerVerification, "submittedAt" | "reviewedAt" | "updatedAt" | "status" | "adminNote">,
): Promise<void> {
  const { db } = requireFirebaseServices();
  await setDoc(doc(db, "sellerVerifications", value.studioId), {
    ...value,
    status: "submitted",
    adminNote: null,
    submittedAt: serverTimestamp(),
    reviewedAt: null,
    updatedAt: serverTimestamp(),
  }, { merge: true });
}
