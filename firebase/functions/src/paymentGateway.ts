import crypto from "node:crypto";

export function verifyRazorpayWebhookSignature(body: Buffer, signature: string, secret: string): boolean {
  if (!signature || !secret) return false;
  const expected = crypto.createHmac("sha256", secret).update(body).digest("hex");
  const left = Buffer.from(expected);
  const right = Buffer.from(signature);
  return left.length === right.length && crypto.timingSafeEqual(left, right);
}
