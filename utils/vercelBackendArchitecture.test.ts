import fs from "node:fs";
import { describe, expect, it } from "vitest";

describe("Vercel trusted backend architecture", () => {
  it("keeps client services away from Firebase callable functions", () => {
    const services = fs.readdirSync("services").filter((file) => file.endsWith(".ts"));
    const source = services.map((file) => fs.readFileSync(`services/${file}`, "utf8")).join("\n");
    expect(source).not.toContain("httpsCallable");
  });

  it("ships signed payment and authenticated backend routes", () => {
    expect(fs.existsSync("app/api/backend/[action]/route.ts")).toBe(true);
    const webhook = fs.readFileSync("app/api/payments/razorpay/webhook/route.ts", "utf8");
    expect(webhook).toContain("timingSafeEqual");
    expect(webhook).toContain("payment.captured");
    expect(webhook).toContain("runTransaction");
  });

  it("documents Vercel-only server deployment", () => {
    const guide = fs.readFileSync("SIDRA-VERCEL-BACKEND.md", "utf8");
    expect(guide).toContain("Do not run `firebase deploy --only functions`");
    expect(guide).toContain("RAZORPAY_WEBHOOK_SECRET");
  });
});
