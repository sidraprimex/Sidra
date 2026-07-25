import { describe, expect, it } from "vitest";
import { normalizeSlug, validateProductDraft } from "@/utils/productValidation";

describe("Phase 4 architecture", () => {
  it("normalizes stable product slugs", () => {
    expect(normalizeSlug("Golden Resin Tray")).toBe("golden-resin-tray");
  });

  it("blocks publishing without product media", () => {
    const result = validateProductDraft({
      name: "Golden Resin Tray",
      categoryId: "trays",
      categorySlug: "trays",
      collectionIds: [],
      shortDescription: "A handcrafted statement tray.",
      description: "A handcrafted resin statement tray created with layered pigments and a polished finish for refined interiors.",
      story: "",
      pricePaise: 499900,
      salePricePaise: null,
      sku: "TRAY-01",
      inventoryMode: "madeToOrder",
      inventoryCount: null,
      variants: [],
      materials: ["resin"],
      dimensions: { lengthCm: 30, widthCm: 20, heightCm: 2 },
      weightGrams: 900,
      productionTimeDays: 7,
      shippingTimeDays: 5,
      seo: { title: "", description: "", keywords: [] },
    }, [], "publish");
    expect(result.valid).toBe(false);
    expect(result.errors.media).toBeTruthy();
  });
});
