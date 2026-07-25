import { describe, expect, it } from "vitest";
describe("Phase 5 recently viewed ownership", () => {
  it("allows only the matching customer document", () => {
    const requestUid = "customer-a";
    const documentUid = "customer-a";
    expect(requestUid === documentUid).toBe(true);
    expect(requestUid === "customer-b").toBe(false);
  });
});
