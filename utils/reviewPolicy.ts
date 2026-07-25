export function isValidReviewRating(value: number): value is 1 | 2 | 3 | 4 | 5 {
  return Number.isInteger(value) && value >= 1 && value <= 5;
}

export function canSubmitVerifiedReview(orderStatus: string, customerId: string, authenticatedUserId: string): boolean {
  return customerId === authenticatedUserId && ["delivered", "completed"].includes(orderStatus);
}

export function normalizeReviewText(value: string, maximum: number): string {
  return value.trim().replace(/\s+/g, " ").slice(0, maximum);
}

export function canSellerRespondToReview(reviewStatus: string, reviewStudioId: string, sellerStudioId: string): boolean {
  return reviewStatus === "published" && reviewStudioId === sellerStudioId;
}
