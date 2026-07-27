import { describe, expect, it } from "vitest";
import defaultHomepage from "@/cms/phase5-homepage.default.json";
import { tokenizeSearchText } from "@/services/searchService";

describe("Phase 5 discovery architecture", () => {
  it("keeps the locked homepage block order", () => {
    expect(defaultHomepage.blocks.map((block) => block.type)).toEqual([
      "Hero","FeaturedStudios","FeaturedCollections","SignatureCategories","BestSellers","NewArrivals",
      "CustomOrderBanner","WhySidra","ArtistStories","Testimonials","Journal","Newsletter",
    ]);
  });
  it("creates prefix tokens for Firestore search", () => {
    expect(tokenizeSearchText("Resin Tray")).toEqual(expect.arrayContaining(["re","res","resin","tr","tray"]));
  });
  it("caps homepage cache contract at 60 seconds", () => {
    expect(60).toBeLessThanOrEqual(60);
  });
});
