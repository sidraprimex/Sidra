import {
  collection,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  query,
  runTransaction,
  serverTimestamp,
  setDoc,
  where,
} from "firebase/firestore";
import { httpsCallable } from "firebase/functions";
import { requireFirebaseServices } from "@/services/firebaseClient";
import type {
  CustomOrder,
  CustomOrderMessage,
  CustomOrderMessageInput,
  ReviewCustomOrderProofInput,
  SendCustomQuoteInput,
  SubmitCustomOrderInput,
  SubmitCustomOrderProofInput,
} from "@/types/phase8-custom-orders";
import { isCustomOrderChatUnlocked } from "@/utils/customOrderLifecycle";

function mapCustomOrder(
  id: string,
  data: Record<string, unknown>,
): CustomOrder {
  return {
    ...data,
    customOrderId: id,
    messages: Array.isArray(data.messages) ? data.messages : [],
    proofs: Array.isArray(data.proofs) ? data.proofs : [],
    paymentStatus:
      data.paymentStatus === "pendingVerification" ||
      data.paymentStatus === "verified" ||
      data.paymentStatus === "rejected"
        ? data.paymentStatus
        : "notSubmitted",
    paymentReference:
      typeof data.paymentReference === "string"
        ? data.paymentReference
        : null,
    paymentSubmittedAt: data.paymentSubmittedAt ?? null,
    paymentVerifiedAt: data.paymentVerifiedAt ?? null,
    paymentVerifiedBy:
      typeof data.paymentVerifiedBy === "string"
        ? data.paymentVerifiedBy
        : null,
    paymentReviewNote:
      typeof data.paymentReviewNote === "string"
        ? data.paymentReviewNote
        : null,
    chatUnlocked:
      data.chatUnlocked === true ||
      isCustomOrderChatUnlocked(
        String(data.status ?? "submitted") as CustomOrder["status"],
      ),
  } as unknown as CustomOrder;
}

function timestampMillis(value: unknown): number {
  if (
    value &&
    typeof value === "object" &&
    "toMillis" in value &&
    typeof value.toMillis === "function"
  ) {
    return value.toMillis();
  }
  const parsed = Date.parse(
    typeof value === "string" ? value : "",
  );
  return Number.isFinite(parsed) ? parsed : 0;
}

export async function getCustomOrder(
  customOrderId: string,
): Promise<CustomOrder | null> {
  const { db } = requireFirebaseServices();
  const snapshot = await getDoc(
    doc(db, "customOrders", customOrderId),
  );
  return snapshot.exists()
    ? mapCustomOrder(snapshot.id, snapshot.data())
    : null;
}

export function subscribeCustomOrder(
  customOrderId: string,
  listener: (order: CustomOrder | null) => void,
): () => void {
  const { db } = requireFirebaseServices();
  return onSnapshot(
    doc(db, "customOrders", customOrderId),
    (snapshot) => {
      listener(
        snapshot.exists()
          ? mapCustomOrder(snapshot.id, snapshot.data())
          : null,
      );
    },
  );
}

export async function listCustomerCustomOrders(
  customerId: string,
): Promise<readonly CustomOrder[]> {
  const { db } = requireFirebaseServices();
  const snapshot = await getDocs(
    query(
      collection(db, "customOrders"),
      where("customerId", "==", customerId),
    ),
  );
  return snapshot.docs
    .map((item) => mapCustomOrder(item.id, item.data()))
    .sort(
      (left, right) =>
        timestampMillis(right.createdAt) -
        timestampMillis(left.createdAt),
    );
}

export async function listStudioCustomOrders(
  studioId: string,
): Promise<readonly CustomOrder[]> {
  const { db } = requireFirebaseServices();
  const snapshot = await getDocs(
    query(
      collection(db, "customOrders"),
      where("studioId", "==", studioId),
    ),
  );
  return snapshot.docs
    .map((item) => mapCustomOrder(item.id, item.data()))
    .sort(
      (left, right) =>
        timestampMillis(right.createdAt) -
        timestampMillis(left.createdAt),
    );
}

export async function submitCustomOrder(
  input: SubmitCustomOrderInput,
): Promise<{ customOrderId: string }> {
  const { auth, db } = requireFirebaseServices();
  const user = auth.currentUser;
  if (!user || !user.emailVerified) {
    throw new Error("A verified customer account is required.");
  }
  const title = input.brief.title.trim();
  const description = input.brief.description.trim();
  if (title.length < 3 || title.length > 140) {
    throw new Error("Project title must be 3–140 characters.");
  }
  if (description.length < 40 || description.length > 5000) {
    throw new Error(
      "Detailed requirement must be 40–5000 characters.",
    );
  }
  if (input.brief.targetDeliveryDate.length < 8) {
    throw new Error("Target delivery date is required.");
  }

  const [studioSnapshot, customerSnapshot] = await Promise.all([
    getDoc(doc(db, "studios", input.studioId)),
    getDoc(doc(db, "users", user.uid)),
  ]);
  if (
    !studioSnapshot.exists() ||
    studioSnapshot.data().active !== true ||
    studioSnapshot.data().status === "suspended" ||
    studioSnapshot.data().contactEnabled === false
  ) {
    throw new Error(
      "This Studio is not accepting custom orders.",
    );
  }

  const customOrderRef = doc(collection(db, "customOrders"));
  await setDoc(customOrderRef, {
    customOrderId: customOrderRef.id,
    customerId: user.uid,
    customerName:
      String(customerSnapshot.data()?.fullName ?? "").trim() ||
      user.displayName ||
      "Customer",
    studioId: input.studioId,
    studioName: String(
      studioSnapshot.data().name ?? "Sidra Studio",
    ),
    status: "submitted",
    brief: {
      ...input.brief,
      title,
      description,
    },
    quote: null,
    messages: [],
    proofs: [],
    paymentStatus: "notSubmitted",
    paymentReference: null,
    paymentSubmittedAt: null,
    paymentVerifiedAt: null,
    paymentVerifiedBy: null,
    paymentReviewNote: null,
    chatUnlocked: false,
    linkedOrderId: null,
    timeline: [
      {
        id: crypto.randomUUID(),
        status: "submitted",
        actorId: user.uid,
        actorRole: "customer",
        createdAt: new Date().toISOString(),
      },
    ],
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return { customOrderId: customOrderRef.id };
}

export async function sendCustomOrderQuote(
  input: SendCustomQuoteInput,
): Promise<void> {
  const { auth, db } = requireFirebaseServices();
  const user = auth.currentUser;
  if (!user) throw new Error("Your seller session expired.");
  const profileSnapshot = await getDoc(doc(db, "users", user.uid));
  const sellerStudioId = profileSnapshot.data()?.studioId;
  if (
    profileSnapshot.data()?.role !== "seller" ||
    typeof sellerStudioId !== "string"
  ) {
    throw new Error("A verified seller account is required.");
  }
  if (
    !Number.isInteger(input.pricePaise) ||
    input.pricePaise <= 0 ||
    !Number.isInteger(input.shippingPaise) ||
    input.shippingPaise < 0 ||
    !Number.isInteger(input.productionDays) ||
    input.productionDays <= 0 ||
    !Number.isInteger(input.revisionLimit) ||
    input.revisionLimit < 0 ||
    input.expiresAt.length < 8 ||
    input.terms.trim().length < 20
  ) {
    throw new Error("Complete valid quote details are required.");
  }

  const orderRef = doc(
    db,
    "customOrders",
    input.customOrderId,
  );
  await runTransaction(db, async (transaction) => {
    const snapshot = await transaction.get(orderRef);
    if (!snapshot.exists()) {
      throw new Error("Custom order not found.");
    }
    const order = snapshot.data();
    if (order.studioId !== sellerStudioId) {
      throw new Error(
        "This request does not belong to your Studio.",
      );
    }
    if (
      ![
        "submitted",
        "sellerReview",
        "clarificationRequested",
      ].includes(String(order.status))
    ) {
      throw new Error(
        "A quote cannot be sent in the current state.",
      );
    }
    transaction.update(orderRef, {
      status: "quoteSent",
      quote: {
        quoteId: crypto.randomUUID(),
        pricePaise: input.pricePaise,
        shippingPaise: input.shippingPaise,
        totalPaise: input.pricePaise + input.shippingPaise,
        productionDays: input.productionDays,
        revisionLimit: input.revisionLimit,
        expiresAt: input.expiresAt,
        terms: input.terms.trim(),
        createdAt: new Date().toISOString(),
        acceptedAt: null,
      },
      timeline: [
        ...(Array.isArray(order.timeline) ? order.timeline : []),
        {
          id: crypto.randomUUID(),
          status: "quoteSent",
          actorId: user.uid,
          actorRole: "seller",
          createdAt: new Date().toISOString(),
        },
      ],
      updatedAt: serverTimestamp(),
    });
  });
}

export async function submitCustomOrderPaymentReference(
  customOrderId: string,
  paymentReference: string,
): Promise<void> {
  const { auth, db } = requireFirebaseServices();
  const user = auth.currentUser;
  if (!user) throw new Error("Your session expired.");
  const reference = paymentReference.trim();
  if (reference.length < 4 || reference.length > 180) {
    throw new Error("Enter a valid UTR or transaction reference.");
  }

  const orderRef = doc(db, "customOrders", customOrderId);
  await runTransaction(db, async (transaction) => {
    const snapshot = await transaction.get(orderRef);
    if (!snapshot.exists()) {
      throw new Error("Custom order not found.");
    }
    const order = snapshot.data();
    if (order.customerId !== user.uid) {
      throw new Error(
        "Only the customer can submit this payment.",
      );
    }
    if (!order.quote || !["quoteSent", "paymentPending"].includes(String(order.status))) {
      throw new Error("No active quote is available.");
    }
    if (
      new Date(String(order.quote.expiresAt)).getTime() <
      Date.now()
    ) {
      throw new Error("This quote has expired.");
    }
    transaction.update(orderRef, {
      status: "paymentPending",
      paymentStatus: "pendingVerification",
      paymentReference: reference,
      paymentSubmittedAt: serverTimestamp(),
      paymentVerifiedAt: null,
      paymentVerifiedBy: null,
      paymentReviewNote: null,
      chatUnlocked: false,
      quote: {
        ...order.quote,
        acceptedAt:
          order.quote.acceptedAt ?? new Date().toISOString(),
      },
      updatedAt: serverTimestamp(),
    });
  });
}

export function subscribeCustomOrderMessages(
  customOrderId: string,
  listener: (messages: readonly CustomOrderMessage[]) => void,
): () => void {
  const { db } = requireFirebaseServices();
  return onSnapshot(
    query(
      collection(db, "customOrderMessages"),
      where("customOrderId", "==", customOrderId),
    ),
    (snapshot) => {
      listener(
        snapshot.docs
          .map(
            (item) =>
              ({
                messageId: item.id,
                ...item.data(),
              }) as CustomOrderMessage,
          )
          .sort(
            (left, right) =>
              timestampMillis(left.createdAt) -
              timestampMillis(right.createdAt),
          ),
      );
    },
  );
}

export async function sendCustomOrderMessage(
  input: CustomOrderMessageInput,
): Promise<void> {
  const { auth, db } = requireFirebaseServices();
  const user = auth.currentUser;
  if (!user || !user.emailVerified) {
    throw new Error("A verified account is required.");
  }
  const body = input.body.trim();
  if (body.length < 1 || body.length > 5000) {
    throw new Error("Message must be 1–5000 characters.");
  }
  const [orderSnapshot, profileSnapshot] = await Promise.all([
    getDoc(doc(db, "customOrders", input.customOrderId)),
    getDoc(doc(db, "users", user.uid)),
  ]);
  if (!orderSnapshot.exists()) {
    throw new Error("Custom order not found.");
  }
  const order = mapCustomOrder(
    orderSnapshot.id,
    orderSnapshot.data(),
  );
  if (
    !order.chatUnlocked ||
    !isCustomOrderChatUnlocked(order.status)
  ) {
    throw new Error(
      "Chat unlocks after Sidra verifies the custom-order payment.",
    );
  }
  const isCustomer = order.customerId === user.uid;
  const isSeller =
    profileSnapshot.data()?.role === "seller" &&
    profileSnapshot.data()?.studioId === order.studioId;
  if (!isCustomer && !isSeller) {
    throw new Error("Conversation access denied.");
  }

  const messageRef = doc(collection(db, "customOrderMessages"));
  await setDoc(messageRef, {
    messageId: messageRef.id,
    customOrderId: order.customOrderId,
    customerId: order.customerId,
    studioId: order.studioId,
    senderId: user.uid,
    senderRole: isCustomer ? "customer" : "seller",
    body,
    attachmentUrls: [],
    createdAt: serverTimestamp(),
  });
}

export async function submitCustomOrderProof(
  input: SubmitCustomOrderProofInput,
): Promise<void> {
  const callable = httpsCallable<
    SubmitCustomOrderProofInput,
    { accepted: true }
  >(
    requireFirebaseServices().functions,
    "submitCustomOrderProof",
  );
  await callable(input);
}

export async function reviewCustomOrderProof(
  input: ReviewCustomOrderProofInput,
): Promise<void> {
  const callable = httpsCallable<
    ReviewCustomOrderProofInput,
    { accepted: true }
  >(
    requireFirebaseServices().functions,
    "reviewCustomOrderProof",
  );
  await callable(input);
}
