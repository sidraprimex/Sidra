import {
  collection,
  doc,
  runTransaction,
  serverTimestamp,
} from "firebase/firestore";
import { requireFirebaseServices } from "@/services/firebaseClient";

export async function reviewCustomOrderPayment(input: {
  readonly customOrderId: string;
  readonly adminUid: string;
  readonly decision: "verified" | "rejected";
  readonly note?: string;
}): Promise<void> {
  const { db } = requireFirebaseServices();
  const orderRef = doc(
    db,
    "customOrders",
    input.customOrderId,
  );

  await runTransaction(db, async (transaction) => {
    const orderSnapshot = await transaction.get(orderRef);
    if (!orderSnapshot.exists()) {
      throw new Error("Custom order not found.");
    }
    const order = orderSnapshot.data();
    if (
      order.status !== "paymentPending" ||
      order.paymentStatus !== "pendingVerification" ||
      typeof order.paymentReference !== "string" ||
      order.paymentReference.trim().length < 4 ||
      !order.quote ||
      !Number.isInteger(order.quote.totalPaise) ||
      order.quote.totalPaise <= 0
    ) {
      throw new Error(
        "This custom-order payment is not awaiting verification.",
      );
    }

    if (input.decision === "rejected") {
      transaction.update(orderRef, {
        status: "quoteSent",
        paymentStatus: "rejected",
        paymentVerifiedAt: serverTimestamp(),
        paymentVerifiedBy: input.adminUid,
        paymentReviewNote:
          input.note?.trim().slice(0, 1000) ||
          "Payment reference could not be verified.",
        chatUnlocked: false,
        updatedAt: serverTimestamp(),
      });
      return;
    }

    const studioSnapshot = await transaction.get(
      doc(db, "studios", String(order.studioId)),
    );
    const sellerUid = studioSnapshot.data()?.ownerUid ?? null;
    transaction.update(orderRef, {
      status: "paid",
      paymentStatus: "verified",
      paymentVerifiedAt: serverTimestamp(),
      paymentVerifiedBy: input.adminUid,
      paymentReviewNote:
        input.note?.trim().slice(0, 1000) || null,
      chatUnlocked: true,
      updatedAt: serverTimestamp(),
    });

    const paymentRef = doc(
      db,
      "payments",
      `custom-order-${input.customOrderId}`,
    );
    transaction.set(paymentRef, {
      paymentId: paymentRef.id,
      customOrderId: input.customOrderId,
      orderId: null,
      customerId: order.customerId,
      studioId: order.studioId,
      gateway: "manualUpi",
      amount: order.quote.totalPaise,
      currency: "INR",
      status: "succeeded",
      paymentType: "customOrder",
      gatewayTransactionId: order.paymentReference,
      verifiedBy: input.adminUid,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    const customerNotification = doc(
      collection(db, "notifications"),
    );
    transaction.set(customerNotification, {
      recipientUid: order.customerId,
      type: "customOrderPaymentVerified",
      title: "Custom-order payment verified",
      body: `Your private conversation with ${String(order.studioName ?? "the Studio")} is now unlocked.`,
      actionUrl: `/account/custom-orders/${input.customOrderId}`,
      read: false,
      customOrderId: input.customOrderId,
      createdAt: serverTimestamp(),
    });
    if (typeof sellerUid === "string" && sellerUid) {
      const sellerNotification = doc(
        collection(db, "notifications"),
      );
      transaction.set(sellerNotification, {
        recipientUid: sellerUid,
        type: "customOrderPaymentVerified",
        title: "Custom-order payment verified",
        body: "Sidra verified the buyer payment. The private project conversation is now unlocked.",
        actionUrl: `/studio-admin/custom-orders/${input.customOrderId}`,
        read: false,
        studioId: order.studioId,
        customOrderId: input.customOrderId,
        createdAt: serverTimestamp(),
      });
    }
  });
}
