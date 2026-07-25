import { z } from "zod";

export const sellerApplicationSchema = z.object({
  fullName: z.string().trim().min(2).max(120),
  studioName: z.string().trim().min(2).max(120),
  email: z.string().email(),
  mobile: z.string().trim().regex(/^\+?[0-9][0-9\s-]{7,17}$/),
  city: z.string().trim().min(2).max(80),
  state: z.string().trim().min(2).max(80),
  instagram: z.union([z.literal(""), z.string().url()]).optional(),
  experience: z.string().trim().min(20).max(2000),
  productCategories: z.string().trim().min(2).max(500),
  whyJoin: z.string().trim().min(20).max(2000),
  expectedMonthlyCapacity: z.string().regex(/^[0-9]+$/),
});

export type SellerApplicationFormValues = z.infer<typeof sellerApplicationSchema>;

export function splitCategories(value: string): string[] {
  return [...new Set(value.split(",").map((item) => item.trim()).filter(Boolean))].slice(0, 20);
}
