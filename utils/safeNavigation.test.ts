import { describe, expect, it } from "vitest";
import { safeInternalDestination } from "@/utils/safeNavigation";

describe("safe internal auth destinations", () => {
  it("keeps product, query and hash destinations inside Sidra", () => {
    expect(safeInternalDestination("/product/rehaal?variant=gold#buy")).toBe("/product/rehaal?variant=gold#buy");
  });

  it("blocks external, protocol-relative and auth-loop destinations", () => {
    expect(safeInternalDestination("https://example.com/phish")).toBe("/account/dashboard");
    expect(safeInternalDestination("//example.com/phish")).toBe("/account/dashboard");
    expect(safeInternalDestination("/login?next=/login")).toBe("/account/dashboard");
  });
});
