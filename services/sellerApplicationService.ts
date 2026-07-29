import {
  addDoc,
  collection,
  doc,
  getDoc,
  limit,
  onSnapshot,
  query,
  runTransaction,
  serverTimestamp,
  updateDoc,
  where,
  type Unsubscribe,
} from "firebase/firestore";
import { getFirebaseServices } from "@/lib/firebaseClient";
import { defaultPaymentSettings } from "@/services/paymentConfigurationService";
import type {
  SellerAccessPaymentMethod,
  SellerApplication,
  SellerApplicationDecision,
  SellerApplicationDraftInput,
  SellerPortfolioImage,
} from "@/types/seller-application";
import type { CheckoutPaymentSettings } from "@/types/payment-settings";

const COLLECTION = "sellerApplications";
const MAX_IMAGES = 8;
const MAX_IMAGE_BYTES = 4 * 1024 * 1024;

function requireServices() {
  const services = getFirebaseServices();

  if (!services) {
    throw new Error(
      "Sidra is not connected to Firebase. Add the required environment variables.",
    );
  }

  return services;
}

function normalizeApplication(
  id: string,
  value: Record<string, unknown>,
): SellerApplication {
  const data = value as Partial<Omit<SellerApplication, "id">>;

  return {
    ...(data as Omit<SellerApplication, "id">),
    id,
    portfolioImages: Array.isArray(data.portfolioImages)
      ? data.portfolioImages
      : [],
    productCategories: Array.isArray(data.productCategories)
      ? data.productCategories
      : [],
    failureReason: data.failureReason ?? null,
    storageProvider: data.storageProvider ?? null,
    telegramChatId: data.telegramChatId ?? null,
    telegramHeaderMessageId: data.telegramHeaderMessageId ?? null,
    accessFeePaise:
      typeof data.accessFeePaise === "number" ? data.accessFeePaise : 0,
    paymentMethod: data.paymentMethod ?? null,
    paymentReference: data.paymentReference ?? null,
    paymentSubmittedAt: data.paymentSubmittedAt ?? null,
    paymentVerifiedAt: data.paymentVerifiedAt ?? null,
  };
}

function errorMessage(caught: unknown): string {
  return caught instanceof Error
    ? caught.message
    : "The portfolio upload could not be completed.";
}

function millis(value: unknown): number {
  if (
    value &&
    typeof value === "object" &&
    "toMillis" in value &&
    typeof (value as { toMillis?: unknown }).toMillis === "function"
  ) {
    return (value as { toMillis: () => number }).toMillis();
  }

  return 0;
}

function newestFirst(values: SellerApplication[]): SellerApplication[] {
  return values.sort(
    (left, right) => millis(right.createdAt) - millis(left.createdAt),
  );
}

function slugBase(value: string): string {
  return (
    value
      .toLowerCase()
      .normalize("NFKD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 48) || "studio"
  );
}

interface TelegramHeaderResponse {
  chatId: string;
  messageId: number;
}

interface TelegramUploadResponse {
  telegramFileId: string;
  telegramFileUniqueId: string;
  telegramMessageId: number;
  fileName: string;
  contentType: string;
  size: number;
}

async function firebaseIdToken(): Promise<string> {
  const { auth } = requireServices();
  const user = auth.currentUser;

  if (!user) {
    throw new Error("Please sign in again before uploading files.");
  }

  return user.getIdToken(true);
}

async function apiPayload<T>(response: Response): Promise<T> {
  const payload = (await response
    .json()
    .catch(() => null)) as (T & { error?: string }) | null;

  if (!response.ok || !payload) {
    throw new Error(
      payload?.error || "Sidra Telegram storage request failed.",
    );
  }

  return payload;
}

async function createTelegramApplicationHeader(
  uid: string,
  applicationId: string,
  input: SellerApplicationDraftInput,
): Promise<TelegramHeaderResponse> {
  const token = await firebaseIdToken();

  const response = await fetch(
    "/api/telegram/seller-applications/header",
    {
      method: "POST",
      headers: {
        authorization: `Bearer ${token}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        uid,
        applicationId,
        ...input,
      }),
    },
  );

  return apiPayload<TelegramHeaderResponse>(response);
}

export async function uploadSellerPortfolio(
  uid: string,
  applicationId: string,
  files: File[],
  replyToMessageId: number,
  onUploaded?: (
    uploaded: SellerPortfolioImage[],
    completed: number,
    total: number,
  ) => Promise<void> | void,
): Promise<SellerPortfolioImage[]> {
  if (files.length < 1 || files.length > MAX_IMAGES) {
    throw new Error(`Choose between 1 and ${MAX_IMAGES} portfolio images.`);
  }

  const token = await firebaseIdToken();
  const uploaded: SellerPortfolioImage[] = [];

  for (const [position, file] of files.entries()) {
    if (!file.type.startsWith("image/")) {
      throw new Error(`${file.name} is not an image.`);
    }

    if (file.size > MAX_IMAGE_BYTES) {
      throw new Error(
        `${file.name} is larger than 4 MB. Compress it and try again.`,
      );
    }

    const body = new FormData();
    body.set("file", file, file.name);
    body.set("ownerUid", uid);
    body.set("applicationId", applicationId);
    body.set("replyToMessageId", String(replyToMessageId));
    body.set("index", String(position + 1));
    body.set("total", String(files.length));

    const response = await fetch(
      "/api/telegram/seller-applications/upload",
      {
        method: "POST",
        headers: {
          authorization: `Bearer ${token}`,
        },
        body,
      },
    );

    const result = await apiPayload<TelegramUploadResponse>(response);

    uploaded.push({
      path: `telegram:${result.telegramFileId}`,
      downloadUrl: "",
      provider: "telegram",
      ownerUid: uid,
      telegramFileId: result.telegramFileId,
      telegramFileUniqueId: result.telegramFileUniqueId,
      telegramMessageId: result.telegramMessageId,
      fileName: result.fileName || file.name,
      contentType: result.contentType || file.type,
      size: result.size || file.size,
    });

    await onUploaded?.([...uploaded], position + 1, files.length);
  }

  return uploaded;
}

async function markSubmissionFailed(
  applicationId: string,
  caught: unknown,
  portfolioImages: SellerPortfolioImage[] = [],
): Promise<void> {
  const { db } = requireServices();
  const message = errorMessage(caught).slice(0, 2000);

  try {
    await updateDoc(doc(db, COLLECTION, applicationId), {
      status: "submissionFailed",
      portfolioImages,
      failureReason: message,
      updatedAt: serverTimestamp(),
    });
  } catch {
    // Preserve the original upload error.
  }
}

export async function submitSellerApplication(
  uid: string,
  input: SellerApplicationDraftInput,
  files: File[],
  onProgress?: (message: string) => void,
): Promise<string> {
  const { db } = requireServices();

  const created = await addDoc(collection(db, COLLECTION), {
    ...input,
    uid,
    portfolioImages: [],
    status: "uploading",
    reviewNote: null,
    reviewedBy: null,
    studioId: null,
    slug: null,
    failureReason: null,
    storageProvider: "telegram",
    telegramChatId: null,
    telegramHeaderMessageId: null,
    accessFeePaise: 0,
    paymentMethod: null,
    paymentReference: null,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    reviewedAt: null,
    paymentSubmittedAt: null,
    paymentVerifiedAt: null,
    provisionedAt: null,
  });

  try {
    onProgress?.("Application saved. Connecting secure portfolio storage…");
    const telegram = await createTelegramApplicationHeader(
      uid,
      created.id,
      input,
    );

    await updateDoc(created, {
      telegramChatId: telegram.chatId,
      telegramHeaderMessageId: telegram.messageId,
      updatedAt: serverTimestamp(),
    });

    let persistedImages: SellerPortfolioImage[] = [];
    const portfolioImages = await uploadSellerPortfolio(
      uid,
      created.id,
      files,
      telegram.messageId,
      async (uploaded, completed, total) => {
        persistedImages = uploaded;
        onProgress?.(`Securing portfolio image ${completed} of ${total}…`);
        await updateDoc(created, {
          portfolioImages: uploaded,
          updatedAt: serverTimestamp(),
        });
      },
    );

    await updateDoc(created, {
      portfolioImages,
      status: "pending",
      failureReason: null,
      updatedAt: serverTimestamp(),
    });

    return created.id;
  } catch (caught) {
    const snapshot = await getDoc(created).catch(() => null);
    const persistedImages =
      snapshot?.exists() &&
      Array.isArray(snapshot.data().portfolioImages)
        ? (snapshot.data().portfolioImages as SellerPortfolioImage[])
        : [];
    await markSubmissionFailed(created.id, caught, persistedImages);

    throw new Error(
      `Your application details were saved, but the Telegram portfolio upload failed. ` +
        `Open the application status page to retry. ${errorMessage(caught)}`,
    );
  }
}

export async function retrySellerPortfolioUpload(
  uid: string,
  applicationId: string,
  files: File[],
  onProgress?: (message: string) => void,
): Promise<void> {
  const { db } = requireServices();
  const applicationRef = doc(db, COLLECTION, applicationId);
  const snapshot = await getDoc(applicationRef);

  if (!snapshot.exists()) {
    throw new Error("Studio application not found.");
  }

  const application = normalizeApplication(snapshot.id, snapshot.data());

  if (application.uid !== uid) {
    throw new Error(
      "This Studio application does not belong to your account.",
    );
  }

  if (!["uploading", "submissionFailed"].includes(application.status)) {
    throw new Error(
      "This application no longer needs a portfolio retry.",
    );
  }

  await updateDoc(applicationRef, {
    status: "uploading",
    portfolioImages: [],
    failureReason: null,
    updatedAt: serverTimestamp(),
  });

  let persistedImages: SellerPortfolioImage[] = [];

  try {
    onProgress?.("Connecting to secure Telegram portfolio storage…");
    let headerMessageId = application.telegramHeaderMessageId;

    if (!headerMessageId) {
      const telegram = await createTelegramApplicationHeader(
        uid,
        applicationId,
        application,
      );

      headerMessageId = telegram.messageId;

      await updateDoc(applicationRef, {
        storageProvider: "telegram",
        telegramChatId: telegram.chatId,
        telegramHeaderMessageId: telegram.messageId,
        updatedAt: serverTimestamp(),
      });
    }

    const portfolioImages = await uploadSellerPortfolio(
      uid,
      applicationId,
      files,
      headerMessageId,
      async (uploaded, completed, total) => {
        persistedImages = uploaded;
        onProgress?.(`Portfolio image ${completed} of ${total} saved…`);
        await updateDoc(applicationRef, {
          portfolioImages: uploaded,
          updatedAt: serverTimestamp(),
        });
      },
    );

    await updateDoc(applicationRef, {
      portfolioImages,
      status: "pending",
      failureReason: null,
      updatedAt: serverTimestamp(),
    });
    onProgress?.(`All ${portfolioImages.length} portfolio images saved.`);
  } catch (caught) {
    await markSubmissionFailed(applicationId, caught, persistedImages);
    throw new Error(errorMessage(caught));
  }
}

export function watchOwnSellerApplication(
  uid: string,
  onValue: (value: SellerApplication | null) => void,
  onError: (error: Error) => void,
): Unsubscribe {
  const { db } = requireServices();

  return onSnapshot(
    query(collection(db, COLLECTION), where("uid", "==", uid), limit(100)),
    (snapshot) => {
      const values = newestFirst(
        snapshot.docs.map((item) =>
          normalizeApplication(item.id, item.data()),
        ),
      );

      onValue(values[0] ?? null);
    },
    (error) => onError(error),
  );
}

export function watchSellerApplications(
  onValue: (values: SellerApplication[]) => void,
  onError: (error: Error) => void,
): Unsubscribe {
  const { db } = requireServices();

  return onSnapshot(
    query(collection(db, COLLECTION), limit(100)),
    (snapshot) =>
      onValue(
        newestFirst(
          snapshot.docs.map((item) =>
            normalizeApplication(item.id, item.data()),
          ),
        ),
      ),
    (error) => onError(error),
  );
}

export async function submitSellerAccessPayment(params: {
  uid: string;
  applicationId: string;
  method: SellerAccessPaymentMethod;
  reference: string;
}): Promise<void> {
  const { db } = requireServices();
  const applicationRef = doc(db, COLLECTION, params.applicationId);
  const reference = params.reference.trim();

  if (reference.length < 4) {
    throw new Error("Enter a valid UTR or Razorpay payment reference.");
  }

  await runTransaction(db, async (transaction) => {
    const snapshot = await transaction.get(applicationRef);

    if (!snapshot.exists()) {
      throw new Error("Studio application not found.");
    }

    const application = normalizeApplication(snapshot.id, snapshot.data());

    if (application.uid !== params.uid) {
      throw new Error(
        "This Studio application does not belong to your account.",
      );
    }

    if (application.status !== "approved") {
      throw new Error(
        "Payment can be submitted only after admin approval.",
      );
    }

    if (application.accessFeePaise <= 0) {
      throw new Error(
        "The Studio access fee has not been published by admin yet.",
      );
    }

    transaction.update(applicationRef, {
      status: "paymentSubmitted",
      paymentMethod: params.method,
      paymentReference: reference.slice(0, 180),
      paymentSubmittedAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  });
}

export async function reviewSellerApplication(params: {
  applicationId: string;
  decision: SellerApplicationDecision;
  note: string;
}): Promise<void> {
  const { auth, db } = requireServices();
  const admin = auth.currentUser;

  if (!admin) {
    throw new Error("Please sign in again before reviewing this request.");
  }

  const applicationRef = doc(db, COLLECTION, params.applicationId);

  const statusByDecision = {
    reject: "rejected",
    requestMoreInfo: "moreInfoRequested",
    hold: "onHold",
  } as const;

  await runTransaction(db, async (transaction) => {
    const applicationSnapshot = await transaction.get(applicationRef);

    if (!applicationSnapshot.exists()) {
      throw new Error("Seller application not found.");
    }

    const application = normalizeApplication(
      applicationSnapshot.id,
      applicationSnapshot.data(),
    );

    if (
      ![
        "pending",
        "moreInfoRequested",
        "onHold",
        "provisioningFailed",
      ].includes(application.status)
    ) {
      throw new Error("This request has already moved to the next stage.");
    }

    if (params.decision !== "approve") {
      const note = params.note.trim();

      if (note.length < 3) {
        throw new Error(
          "Add a clear admin note before saving this decision.",
        );
      }

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

    const paymentSnapshot = await transaction.get(
      doc(db, "settings", "payments"),
    );

    const paymentSettings = {
      ...defaultPaymentSettings,
      ...(paymentSnapshot.exists()
        ? (paymentSnapshot.data() as Partial<CheckoutPaymentSettings>)
        : {}),
    };

    const accessFeePaise = Math.max(
      0,
      Math.round(Number(paymentSettings.sellerAccessFeePaise) || 0),
    );

    transaction.update(applicationRef, {
      status: "approved",
      accessFeePaise,
      reviewNote:
        params.note.trim().slice(0, 2000) ||
        "Approved by Sidra admin. Complete the Studio access payment to continue.",
      reviewedBy: admin.uid,
      reviewedAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      failureReason: null,
      paymentMethod: null,
      paymentReference: null,
      paymentSubmittedAt: null,
      paymentVerifiedAt: null,
    });
  });
}

export async function rejectSellerAccessPayment(
  applicationId: string,
  note: string,
): Promise<void> {
  const { auth, db } = requireServices();

  if (!auth.currentUser) {
    throw new Error("Please sign in again.");
  }

  if (note.trim().length < 3) {
    throw new Error("Add a clear rejection note.");
  }

  await runTransaction(db, async (transaction) => {
    const applicationRef = doc(db, COLLECTION, applicationId);
    const snapshot = await transaction.get(applicationRef);

    if (!snapshot.exists()) {
      throw new Error("Seller application not found.");
    }

    const application = normalizeApplication(snapshot.id, snapshot.data());

    if (application.status !== "paymentSubmitted") {
      throw new Error("No submitted payment is waiting for review.");
    }

    transaction.update(applicationRef, {
      status: "approved",
      reviewNote: note.trim().slice(0, 2000),
      paymentMethod: null,
      paymentReference: null,
      paymentSubmittedAt: null,
      updatedAt: serverTimestamp(),
    });
  });
}

export async function verifySellerAccessPayment(
  applicationId: string,
  note: string,
): Promise<void> {
  const { auth, db } = requireServices();
  const admin = auth.currentUser;

  if (!admin) {
    throw new Error("Please sign in again before verifying payment.");
  }

  await runTransaction(db, async (transaction) => {
    const applicationRef = doc(db, COLLECTION, applicationId);
    const applicationSnapshot = await transaction.get(applicationRef);

    if (!applicationSnapshot.exists()) {
      throw new Error("Seller application not found.");
    }

    const application = normalizeApplication(
      applicationSnapshot.id,
      applicationSnapshot.data(),
    );

    if (
      application.status !== "paymentSubmitted" ||
      !application.paymentReference
    ) {
      throw new Error(
        "A seller payment reference has not been submitted yet.",
      );
    }

    const studioId = `studio-${applicationId}`;
    const slug =
      `${slugBase(application.studioName)}-` +
      applicationId.slice(0, 7).toLowerCase();

    const userRef = doc(db, "users", application.uid);
    const studioRef = doc(db, "studios", studioId);
    const routeRef = doc(db, "studioRoutes", slug);

    const userSnapshot = await transaction.get(userRef);
    const studioSnapshot = await transaction.get(studioRef);
    const routeSnapshot = await transaction.get(routeRef);

    if (!userSnapshot.exists()) {
      throw new Error("The seller account profile is missing.");
    }

    if (studioSnapshot.exists() || routeSnapshot.exists()) {
      throw new Error(
        "A Studio has already been created for this request.",
      );
    }

    transaction.set(studioRef, {
      studioId,
      ownerUid: application.uid,
      name: application.studioName,
      slug,
      description: application.whyJoin,
      logoUrl: null,
      bannerUrl: null,
      galleryUrls: application.portfolioImages
        .map((image) => image.downloadUrl)
        .filter((value) => value.length > 0),
      category: application.productCategories[0] ?? null,
      followerCount: 0,
      rating: 0,
      reviewCount: 0,
      totalOrders: 0,
      revenueTotal: 0,
      subscriptionTier: "starter",
      subscriptionPlan: "commission",
      subscriptionMonthlyFeePaise: 0,
      commissionRateBasisPoints: 1200,
      subscriptionStatus: "commission",
      verificationBadge: "verifiedSeller",
      featured: false,
      active: true,
      provisioningState: "complete",
      seo: {
        title: application.studioName,
        description: application.whyJoin.slice(0, 160),
        ogImage:
          application.portfolioImages.find(
            (image) => image.downloadUrl.length > 0,
          )?.downloadUrl ?? null,
      },
      policies: {
        shipping: "",
        returns: "",
        customOrderTerms: "",
      },
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
      reviewNote:
        note.trim().slice(0, 2000) ||
        "Payment verified and Studio access activated by Sidra admin.",
      reviewedBy: admin.uid,
      studioId,
      slug,
      failureReason: null,
      paymentVerifiedAt: serverTimestamp(),
      provisionedAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  });
}
