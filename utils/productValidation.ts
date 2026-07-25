import type { ProductDraftInput, ProductMedia } from "@/types/phase4-product";

export interface ProductValidationResult {
  readonly valid: boolean;
  readonly errors: Readonly<Record<string, string>>;
}

export function validateProductDraft(
  input: ProductDraftInput,
  media: readonly ProductMedia[],
  intent: "saveDraft" | "submit" | "publish",
): ProductValidationResult {
  const errors: Record<string, string> = {};
  if (input.name.trim().length < 3) errors.name = "Product name must contain at least 3 characters.";
  if (!input.categoryId) errors.categoryId = "Select an approved category.";
  if (input.shortDescription.trim().length < 20) errors.shortDescription = "Add a clear short description.";
  if (input.description.trim().length < 60) errors.description = "Add a complete product description.";
  if (!Number.isInteger(input.pricePaise) || input.pricePaise <= 0) errors.pricePaise = "Enter a valid price.";
  if (input.salePricePaise !== null && input.salePricePaise >= input.pricePaise) {
    errors.salePricePaise = "Sale price must be lower than the regular price.";
  }
  if (input.inventoryMode === "finite" && (!Number.isInteger(input.inventoryCount) || (input.inventoryCount ?? -1) < 0)) {
    errors.inventoryCount = "Finite inventory requires a non-negative whole-number quantity.";
  }
  if (intent !== "saveDraft" && media.filter((item) => item.kind === "image").length === 0) {
    errors.media = "At least one product image is required before submission.";
  }
  if (input.productionTimeDays < 0 || input.shippingTimeDays < 0) {
    errors.timeline = "Production and shipping time cannot be negative.";
  }
  return { valid: Object.keys(errors).length === 0, errors };
}

export function normalizeSlug(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}
