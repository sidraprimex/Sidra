import { describe, expect, it } from "vitest";
import {
  canSellerRespondToReview,
  canSubmitVerifiedReview,
  isValidReviewRating,
} from "@/utils/reviewPolicy";

describe("Phase 9 customer engagement rules", () => {
  it("accepts ratings only from one to five", () => {
    expect(isValidReviewRating(1)).toBe(true);
    expect(isValidReviewRating(5)).toBe(true);
    expect(isValidReviewRating(0)).toBe(false);
    expect(isValidReviewRating(6)).toBe(false);
  });

  it("requires order ownership and delivery for review submission", () => {
    expect(canSubmitVerifiedReview("delivered", "customer-1", "customer-1")).toBe(true);
    expect(canSubmitVerifiedReview("inTransit", "customer-1", "customer-1")).toBe(false);
    expect(canSubmitVerifiedReview("delivered", "customer-1", "customer-2")).toBe(false);
  });

  it("limits seller replies to their own published reviews", () => {
    expect(canSellerRespondToReview("published", "studio-1", "studio-1")).toBe(true);
    expect(canSellerRespondToReview("pending", "studio-1", "studio-1")).toBe(false);
    expect(canSellerRespondToReview("published", "studio-1", "studio-2")).toBe(false);
  });
});
