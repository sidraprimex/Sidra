import { onRequest } from "firebase-functions/v2/https";
import { defineSecret } from "firebase-functions/params";
import { getFirestore, FieldValue } from "firebase-admin/firestore";
import { getStorage } from "firebase-admin/storage";
import crypto from "node:crypto";
import { verifyRazorpayWebhookSignature } from "./paymentGateway";
import type { VerifiedCheckout, VerifiedCheckoutItem } from "./secureCheckout";

const webhookSecret = defineSecret("RAZORPAY_WEBHOOK_SECRET");

function groupByStudio(items: VerifiedCheckoutItem[]): Map<string, VerifiedCheckoutItem[]> {
  const groups = new Map<string, VerifiedCheckoutItem[]>();
  for (const item of items) groups.set(item.studioId, [...(groups.get(item.studioId) ?? []), item]);
  return groups;
}

export const razorpayWebhook = onRequest({ secrets: [webhookSecret] }, async (request, response) => {
  const signature = String(request.header("x-razorpay-signature") ?? "");
  if (!verifyRazorpayWebhookSignature(request.rawBody, signature, webhookSecret.value())) {
    await getFirestore().collection("auditLogs").add({ action:"invalidPaymentWebhook", severity:"critical", createdAt:FieldValue.serverTimestamp(), metadata:{ip:request.ip} });
    response.status(401).send("Invalid signature"); return;
  }
  const event = request.body as { event?:string; payload?:{payment?:{entity?:{id?:string;order_id?:string;status?:string;method?:string;amount?:number}}}};
  if (event.event !== "payment.captured") { response.status(200).send("Ignored"); return; }
  const payment = event.payload?.payment?.entity;
  const gatewayPaymentId = String(payment?.id ?? "");
  const gatewayOrderId = String(payment?.order_id ?? "");
  if (!gatewayPaymentId || !gatewayOrderId) { response.status(400).send("Missing payment identifiers"); return; }

  const db = getFirestore();
  const sessionQuery = await db.collection("paymentSessions").where("gatewayOrderId", "==", gatewayOrderId).limit(1).get();
  if (sessionQuery.empty) { response.status(404).send("Payment session not found"); return; }
  const sessionRef = sessionQuery.docs[0].ref;
  const session = sessionQuery.docs[0].data();
  const checkout = session.checkout as VerifiedCheckout;
  if (!checkout || !Array.isArray(checkout.items) || Number(payment?.amount ?? checkout.totalPaise) !== checkout.totalPaise) {
    response.status(409).send("Payment amount does not match verified checkout"); return;
  }

  const result = await db.runTransaction(async (transaction) => {
    const paymentRef = db.collection("payments").doc(gatewayPaymentId);
    const existingPayment = await transaction.get(paymentRef);
    if (existingPayment.exists) return { duplicate:true, orderIds:existingPayment.data()?.orderIds ?? [], invoices:[] as Array<{path:string;body:unknown}> };
    const freshSession = await transaction.get(sessionRef);
    if (freshSession.data()?.status === "processed") return { duplicate:true, orderIds:freshSession.data()?.orderIds ?? [], invoices:[] as Array<{path:string;body:unknown}> };

    const groups = groupByStudio(checkout.items);
    const year = new Date().getUTCFullYear();
    const counterRef = db.collection("counters").doc(`orders-${year}`);
    const counter = await transaction.get(counterRef);
    const firstSequence = Number(counter.data()?.value ?? 0) + 1;
    transaction.set(counterRef, { value:firstSequence + groups.size - 1, updatedAt:FieldValue.serverTimestamp() }, { merge:true });

    for (const item of checkout.items) {
      const productRef = db.collection("products").doc(item.productId);
      const product = await transaction.get(productRef);
      if (!product.exists || product.data()?.status !== "published") throw new Error("A paid product is no longer available.");
      if (product.data()?.inventoryMode === "finite") {
        const current = Number(product.data()?.inventoryCount ?? 0);
        if (current < item.quantity) throw new Error("Paid quantity exceeds available stock.");
        transaction.update(productRef, { inventoryCount:current-item.quantity, updatedAt:FieldValue.serverTimestamp() });
      }
    }

    const orderIds:string[] = [];
    const invoices:Array<{path:string;body:unknown}> = [];
    let index = 0;
    for (const [studioId, items] of groups) {
      const orderRef = db.collection("orders").doc();
      const orderNumber = `SDR-${year}-${String(firstSequence + index).padStart(6,"0")}`;
      const subtotalPaise = items.reduce((sum,item)=>sum+item.unitPricePaise*item.quantity,0);
      const shippingPaise = checkout.shippingPaise > 0 ? 9900 : 0;
      const discountPaise = studioId === checkout.couponStudioId ? checkout.discountPaise : 0;
      const totalPaise = subtotalPaise + shippingPaise - discountPaise;
      const invoicePath = `invoices/${orderRef.id}/invoice.json`;
      const timeline = [{ id:crypto.randomUUID(), status:"placed", label:"Payment confirmed and order placed", actorId:"razorpay", actorRole:"system", reason:null, createdAt:new Date().toISOString(), customerVisible:true }];
      transaction.create(orderRef, {
        orderId:orderRef.id, orderNumber, customerId:session.customerId,
        customerName:checkout.customer.name, customerEmail:checkout.customer.email, customerPhone:checkout.customer.phone,
        studioId, studioIds:[studioId], studioName:items[0]?.studioName ?? "Sidra Studio", sellerUid:items[0]?.sellerUid ?? null,
        lineItems:items.map(item=>({productId:item.productId,variantId:item.variantId,name:item.productName,qty:item.quantity,unitPrice:item.unitPricePaise,subtotal:item.unitPricePaise*item.quantity})),
        items, orderStatus:"placed", status:"placed", paymentStatus:"paid", subtotalPaise, shippingPaise,
        discountPaise, couponCode:discountPaise ? checkout.couponCode : null, totalPaise,
        shippingAddress:checkout.shippingAddress, shippingPackage:null, invoiceUrl:`gs://${getStorage().bucket().name}/${invoicePath}`,
        customOrderId:null, paymentGateway:"razorpay", paymentReference:gatewayPaymentId, timeline,
        createdAt:FieldValue.serverTimestamp(), updatedAt:FieldValue.serverTimestamp(),
      });
      if (items[0]?.sellerUid) transaction.create(db.collection("notifications").doc(), {
        recipientUid:items[0].sellerUid, type:"newOrder", title:"New paid order received",
        body:`Order ${orderNumber} is ready for acceptance.`, actionUrl:`/studio-admin/orders/${orderRef.id}`,
        read:false, studioId, orderId:orderRef.id, createdAt:FieldValue.serverTimestamp(),
      });
      orderIds.push(orderRef.id);
      invoices.push({ path:invoicePath, body:{orderId:orderRef.id,orderNumber,lineItems:items,subtotalPaise,shippingPaise,discountPaise,totalPaise,currency:"INR",issuedAt:new Date().toISOString(),immutable:true} });
      index += 1;
    }
    transaction.create(db.collection("notifications").doc(), { recipientUid:session.customerId, type:"paymentConfirmed", title:"Payment confirmed", body:`${orderIds.length} order${orderIds.length===1?"":"s"} placed successfully.`, actionUrl:orderIds[0]?`/account/orders/${orderIds[0]}`:"/account/orders", read:false, orderId:orderIds[0]??null, createdAt:FieldValue.serverTimestamp() });
    transaction.create(paymentRef, { gateway:"razorpay", gatewayPaymentId, gatewayOrderId, orderId:orderIds[0]??null, orderIds, customerId:session.customerId, amountPaise:checkout.totalPaise, currency:"INR", method:payment?.method??"unknown", status:"captured", createdAt:FieldValue.serverTimestamp() });
    transaction.update(sessionRef, { status:"processed", orderId:orderIds[0]??null, orderIds, updatedAt:FieldValue.serverTimestamp() });
    return { duplicate:false, orderIds, invoices };
  });
  await Promise.all(result.invoices.map(invoice=>getStorage().bucket().file(invoice.path).save(JSON.stringify(invoice.body,null,2),{contentType:"application/json",resumable:false})));
  response.status(200).json({ok:true,orderId:result.orderIds[0]??null,orderIds:result.orderIds,duplicate:result.duplicate});
});
