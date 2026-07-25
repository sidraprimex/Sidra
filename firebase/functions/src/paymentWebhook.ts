import { onRequest } from "firebase-functions/v2/https";
import { defineSecret } from "firebase-functions/params";
import { getFirestore, FieldValue } from "firebase-admin/firestore";
import { getStorage } from "firebase-admin/storage";
import { verifyRazorpayWebhookSignature } from "./paymentGateway";

const webhookSecret = defineSecret("RAZORPAY_WEBHOOK_SECRET");

async function nextOrderNumber(transaction: FirebaseFirestore.Transaction): Promise<string> {
  const year = new Date().getUTCFullYear();
  const counterRef = getFirestore().collection("counters").doc(`orders-${year}`);
  const snapshot = await transaction.get(counterRef);
  const sequence = Number(snapshot.data()?.value ?? 0) + 1;
  transaction.set(counterRef, { value: sequence, updatedAt: FieldValue.serverTimestamp() }, { merge: true });
  return `RSR-${year}-${String(sequence).padStart(6, "0")}`;
}

export const razorpayWebhook = onRequest({ secrets: [webhookSecret] }, async (request, response) => {
  const signature = String(request.header("x-razorpay-signature") ?? "");
  const rawBody = request.rawBody;
  if (!verifyRazorpayWebhookSignature(rawBody, signature, webhookSecret.value())) {
    await getFirestore().collection("auditLogs").add({
      action: "invalidPaymentWebhook",
      severity: "critical",
      createdAt: FieldValue.serverTimestamp(),
      metadata: { ip: request.ip },
    });
    response.status(401).send("Invalid signature");
    return;
  }

  const event = request.body as {
    event?: string;
    payload?: { payment?: { entity?: { id?: string; order_id?: string; status?: string; method?: string } } };
  };
  if (event.event !== "payment.captured") {
    response.status(200).send("Ignored");
    return;
  }

  const payment = event.payload?.payment?.entity;
  const gatewayPaymentId = String(payment?.id ?? "");
  const gatewayOrderId = String(payment?.order_id ?? "");
  if (!gatewayPaymentId || !gatewayOrderId) {
    response.status(400).send("Missing payment identifiers");
    return;
  }

  const db = getFirestore();
  const result = await db.runTransaction(async (transaction) => {
    const paymentRef = db.collection("payments").doc(gatewayPaymentId);
    if ((await transaction.get(paymentRef)).exists) return { duplicate: true, orderId: gatewayPaymentId };

    const sessions = await db.collection("paymentSessions").where("gatewayOrderId", "==", gatewayOrderId).limit(1).get();
    if (sessions.empty) throw new Error("Payment session not found.");
    const sessionRef = sessions.docs[0].ref;
    const session = sessions.docs[0].data();
    const checkout = session.checkout;
    const orderRef = db.collection("orders").doc();
    const orderNumber = await nextOrderNumber(transaction);
    let inventoryAlertRequired = false;

    for (const item of checkout.items as Array<{ productId: string; quantity: number }>) {
      const productRef = db.collection("products").doc(item.productId);
      const productSnapshot = await transaction.get(productRef);
      const product = productSnapshot.data() ?? {};
      if (product.inventoryMode === "finite") {
        const current = Number(product.inventoryCount ?? 0);
        if (current < item.quantity) {
          inventoryAlertRequired = true;
        } else {
          transaction.update(productRef, { inventoryCount: current - item.quantity, updatedAt: FieldValue.serverTimestamp() });
        }
      }
    }

    const invoicePath = `invoices/${orderRef.id}/invoice.json`;
    transaction.create(orderRef, {
      orderNumber,
      customerId: session.customerId,
      items: checkout.items,
      studioIds: [...new Set((checkout.items as Array<{ studioId: string }>).map((item) => item.studioId))],
      paymentStatus: "paid",
      status: "confirmed",
      subtotalPaise: checkout.subtotalPaise,
      shippingPaise: checkout.shippingPaise,
      totalPaise: checkout.totalPaise,
      invoiceUrl: `gs://${getStorage().bucket().name}/${invoicePath}`,
      timeline: [{ type: "paymentConfirmed", createdAt: new Date().toISOString(), customerVisible: true }],
      inventoryAlertRequired,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });
    transaction.create(paymentRef, {
      gateway: "razorpay",
      gatewayPaymentId,
      gatewayOrderId,
      orderId: orderRef.id,
      amountPaise: checkout.totalPaise,
      currency: "INR",
      method: payment?.method ?? "unknown",
      status: "captured",
      createdAt: FieldValue.serverTimestamp(),
    });
    transaction.update(sessionRef, { status: "processed", orderId: orderRef.id, updatedAt: FieldValue.serverTimestamp() });
    if (inventoryAlertRequired) {
      const alertRef = db.collection("notifications").doc();
      transaction.create(alertRef, {
        audience: "founder",
        type: "paidOrderInventoryConflict",
        orderId: orderRef.id,
        read: false,
        createdAt: FieldValue.serverTimestamp(),
      });
    }
    return { duplicate: false, orderId: orderRef.id, orderNumber, invoicePath, checkout };
  });

  if (!result.duplicate && result.invoicePath) {
    const invoice = {
      orderNumber: result.orderNumber,
      lineItems: result.checkout.items,
      subtotalPaise: result.checkout.subtotalPaise,
      shippingPaise: result.checkout.shippingPaise,
      totalPaise: result.checkout.totalPaise,
      currency: "INR",
      gstNumber: "",
      immutable: true,
      issuedAt: new Date().toISOString(),
    };
    await getStorage().bucket().file(result.invoicePath).save(JSON.stringify(invoice, null, 2), {
      contentType: "application/json",
      resumable: false,
    });
  }

  response.status(200).json({ ok: true, orderId: result.orderId, duplicate: result.duplicate });
});
