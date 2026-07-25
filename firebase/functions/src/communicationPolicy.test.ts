import { describe, expect, it } from "vitest";
import { canTransitionSupportStatus, cleanText, isSupportCategory } from "./communicationPolicy";

describe("communication policy", () => {
  it("normalizes customer text", () => expect(cleanText("  hello   world  ", 100)).toBe("hello world"));
  it("accepts only known categories", () => { expect(isSupportCategory("order")).toBe(true); expect(isSupportCategory("urgent-now")).toBe(false); });
  it("keeps closed tickets immutable", () => expect(canTransitionSupportStatus("closed", "open")).toBe(false));
  it("allows resolved tickets to reopen into progress", () => expect(canTransitionSupportStatus("resolved", "inProgress")).toBe(true));
});
