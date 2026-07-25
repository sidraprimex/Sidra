import { describe, expect, it } from "vitest";
import crypto from "node:crypto";
import { verifyRazorpayWebhookSignature } from "./paymentGateway";

describe("Razorpay webhook verification", () => {
  it("accepts the exact HMAC signature", () => {
    const body = Buffer.from('{"event":"payment.captured"}');
    const secret = "test-secret";
    const signature = crypto.createHmac("sha256", secret).update(body).digest("hex");
    expect(verifyRazorpayWebhookSignature(body, signature, secret)).toBe(true);
  });

  it("rejects a forged signature", () => {
    expect(verifyRazorpayWebhookSignature(Buffer.from("{}"), "forged", "secret")).toBe(false);
  });
});
