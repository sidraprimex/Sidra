import {
  addDoc,
  collection,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  where,
  type Unsubscribe,
} from "firebase/firestore";
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import { httpsCallable } from "firebase/functions";
import { getFunctions } from "firebase/functions";
import { getFirebaseServices, getFirebaseApp } from "@/lib/firebaseClient";
import type {
  SellerApplication,
  SellerApplicationDecision,
  SellerApplicationInput,
  SellerPortfolioImage,
} from "@/types/seller-application";

const COLLECTION = "sellerApplications";
const MAX_IMAGES = 8;
const MAX_IMAGE_BYTES = 10 * 1024 * 1024;
const REVIEWABLE_STATUSES = ["pending", "moreInfoRequested", "onHold", "provisioningFailed"] as const;

function requireServices() {
  const services = getFirebaseServices();
  if (!services) throw new Error("Sidra is not connected to Firebase. Add the required environment variables.");
  return services;
}

function normalizeApplication(id: string, value: Record<string, unknown>): SellerApplication {
  return { id, ...(value as Omit<SellerApplication, "id">) };
}

export async function uploadSellerPortfolio(uid: string, files: File[]): Promise<SellerPortfolioImage[]> {
  if (files.length < 1 || files.length > MAX_IMAGES) throw new Error(`Choose between 1 and ${MAX_IMAGES} portfolio images.`);
  const { storage } = requireServices();
  return Promise.all(files.map(async (file) => {
    if (!file.type.startsWith("image/")) throw new Error(`${file.name} is not an image.`);
    if (file.size > MAX_IMAGE_BYTES) throw new Error(`${file.name} is larger than 10 MB.`);
    const safeName = file.name.toLowerCase().replace(/[^a-z0-9._-]+/g, "-").slice(-120);
    const path = `temp/${uid}/seller-applications/${crypto.randomUUID()}-${safeName}`;
    const objectRef = ref(storage, path);
    await uploadBytes(objectRef, file, { contentType: file.type, customMetadata: { ownerUid: uid, purpose: "sellerApplication" } });
    return {
      path,
      downloadUrl: await getDownloadURL(objectRef),
      fileName: file.name,
      contentType: file.type,
      size: file.size,
    };
  }));
}

export async function submitSellerApplication(uid: string, input: SellerApplicationInput): Promise<string> {
  const { db } = requireServices();
  const created = await addDoc(collection(db, COLLECTION), {
    ...input,
    uid,
    status: "pending",
    reviewNote: null,
    reviewedBy: null,
    studioId: null,
    slug: null,
    failureReason: null,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    reviewedAt: null,
    provisionedAt: null,
  });
  return created.id;
}

export function watchOwnSellerApplication(uid: string, onValue: (value: SellerApplication | null) => void, onError: (error: Error) => void): Unsubscribe {
  const { db } = requireServices();
  return onSnapshot(
    query(collection(db, COLLECTION), where("uid", "==", uid), orderBy("createdAt", "desc"), limit(1)),
    (snapshot) => onValue(snapshot.empty ? null : normalizeApplication(snapshot.docs[0].id, snapshot.docs[0].data())),
    (error) => onError(error),
  );
}

export function watchSellerApplications(onValue: (values: SellerApplication[]) => void, onError: (error: Error) => void): Unsubscribe {
  const { db } = requireServices();
  return onSnapshot(
    query(
      collection(db, COLLECTION),
      where("status", "in", REVIEWABLE_STATUSES),
      orderBy("createdAt", "desc"),
      limit(100),
    ),
    (snapshot) => onValue(snapshot.docs.map((item) => normalizeApplication(item.id, item.data()))),
    (error) => onError(error),
  );
}

export async function reviewSellerApplication(params: { applicationId: string; decision: SellerApplicationDecision; note: string }): Promise<void> {
  const app = getFirebaseApp();
  if (!app) throw new Error("Sidra is not connected to Firebase. Add the required environment variables.");
  const callable = httpsCallable<typeof params, { accepted: true }>(getFunctions(app), "reviewSellerApplication");
  await callable(params);
}
