import fs from "node:fs";
import { describe, expect, it } from "vitest";
import { readJsonResponse } from "@/services/httpResponse";

describe("trusted admin and API response architecture", () => {
  it("resolves server roles from the protected user profile when Functions claims are stale", () => {
    const identity = fs.readFileSync("lib/server/firebaseAdmin.ts", "utf8");
    expect(identity).toContain('.collection("users").doc(decoded.uid).get()');
    expect(identity).toContain("isConfiguredAdminEmail");
    expect(identity).toContain('throw new Error("ACCOUNT_ACCESS_DENIED")');
  });

  it("keeps Admin OS writes behind the authenticated Vercel backend", () => {
    const service = fs.readFileSync("services/adminOperatingService.ts", "utf8");
    expect(service).toContain('callVercelBackend("loadAdminSnapshot"');
    expect(service).toContain('callVercelBackend("updateAdminDocument"');
    expect(service).not.toContain(`from "firebase/${"firestore"}"`);
  });

  it("turns an HTML deployment response into a useful error", async () => {
    const response = new Response("<!doctype html><title>Deployment missing</title>", { status: 404 });
    await expect(readJsonResponse(response, "Service unavailable.")).rejects.toThrow("Service unavailable.");
  });
});
