import {
  addDoc,
  collection,
  doc,
  limit,
  onSnapshot,
  query,
  runTransaction,
  serverTimestamp,
  where,
  type Unsubscribe,
} from "firebase/firestore";
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import { getFirebaseServices } from "@/lib/firebaseClient";
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

function createdAtMillis(value: unknown): number {
  if (value instanceof Date) return value.getTime();
  if (typeof value === "string") return Date.parse(value) || 0;
  if (value && typeof value === "object") {
    if ("toMillis" in value && typeof (value as { toMillis?: unknown }).toMillis === "function") {
      return (value as { toMillis: () => number }).toMillis();
    }
    if ("seconds" in value && typeof (value as { seconds?: unknown }).seconds === "number") {
      return Number((value as { seconds: number }).seconds) * 1000;
    }
  }
  return 0;
}

function newestFirst(values: SellerApplication[]): SellerApplication[] {
  return [...values].sort((first, second) => createdAtMillis(second.createdAt) - createdAtMillis(first.createdAt));
}

function slugBase(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 48) || "studio";
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
    query(collection(db, COLLECTION), where("uid", "==", uid), limit(100)),
    (snapshot) => {
      const values = newestFirst(snapshot.docs.map((item) => normalizeApplication(item.id, item.data())));
      onValue(values[0] ?? null);
    },
    (error) => onError(error),
  );
}

export function watchSellerApplications(onValue: (values: SellerApplication[]) => void, onError: (error: Error) => void): Unsubscribe {
  const { db } = requireServices();
  return onSnapshot(
    query(collection(db, COLLECTION), where("status", "in", REVIEWABLE_STATUSES), limit(100)),
    (snapshot) => onValue(newestFirst(snapshot.docs.map((item) => normalizeApplication(item.id, item.data())))),
    (error) => onError(error),
  );
}

export async function reviewSellerApplication(params: {
  applicationId: string;
  decision: SellerApplicationDecision;
  note: string;
}): Promise<void> {
  const { auth, db } = requireServices();
  const admin = auth.currentUser;
  if (!admin) throw new Error("Please sign in again before reviewing this request.");

  const applicationRef = doc(db, COLLECTION, params.applicationId);
  const statusByDecision = {
    reject: "rejected",
    requestMoreInfo: "moreInfoRequested",
    hold: "onHold",
  } as const;

  await runTransaction(db, async (transaction) => {
    const applicationSnapshot = await transaction.get(applicationRef);
    if (!applicationSnapshot.exists()) throw new Error("Seller application not found.");

    const application = normalizeApplication(applicationSnapshot.id, applicationSnapshot.data());
    if (!REVIEWABLE_STATUSES.includes(application.status as (typeof REVIEWABLE_STATUSES)[number])) {
      throw new Error("This request has already received a final decision.");
    }

    if (params.decision !== "approve") {
      const note = params.note.trim();
      if (note.length < 3) throw new Error("Add a clear admin note before saving this decision.");
      transaction.update(applicationRef, {
        status: statusByDecision[params.decision],
        reviewNote: note.slice(0, 2000),
        reviewedBy: admin.uid,
        reviewedAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        failureReason: null,
      });
      return;
    }

    const studioId = `studio-${params.applicationId}`;
    const slug = `${slugBase(application.studioName)}-${params.applicationId.slice(0, 7).toLowerCase()}`;
    const userRef = doc(db, "users", application.uid);
    const studioRef = doc(db, "studios", studioId);
    const routeRef = doc(db, "studioRoutes", slug);

    const userSnapshot = await transaction.get(userRef);
    const studioSnapshot = await transaction.get(studioRef);
    const routeSnapshot = await transaction.get(routeRef);

    if (!userSnapshot.exists()) throw new Error("The seller account profile is missing.");
    if (studioSnapshot.exists() || routeSnapshot.exists()) throw new Error("A Studio has already been created for this request.");

    transaction.set(studioRef, {
      studioId,
      ownerUid: application.uid,
      name: application.studioName,
      slug,
      description: application.whyJoin,
      logoUrl: null,
      bannerUrl: null,
      galleryUrls: application.portfolioImages.map((image) => image.downloadUrl),
      category: application.productCategories[0] ?? null,
      followerCount: 0,
      rating: 0,
      reviewCount: 0,
      totalOrders: 0,
      revenueTotal: 0,
      subscriptionTier: "starter",
      verificationBadge: "verifiedSeller",
      featured: false,
      active: true,
      provisioningState: "complete",
      seo: {
        title: application.studioName,
        description: application.whyJoin.slice(0, 160),
        ogImage: application.portfolioImages[0]?.downloadUrl ?? null,
      },
      policies: { shipping: "", returns: "", customOrderTerms: "" },
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    transaction.set(routeRef, {
      studioId,
      slug,
      displayName: application.studioName,
      status: "active",
      unavailableMode: "temporarilyUnavailable",
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    transaction.update(userRef, {
      role: "seller",
      studioId,
      updatedAt: serverTimestamp(),
    });

    transaction.update(applicationRef, {
      status: "provisioned",
      reviewNote: params.note.trim().slice(0, 2000) || "Approved by Sidra admin.",
      reviewedBy: admin.uid,
      studioId,
      slug,
      failureReason: null,
      reviewedAt: serverTimestamp(),
      provisionedAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  });
}
