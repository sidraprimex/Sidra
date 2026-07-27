import { z } from "zod";

const cleanText = (value: unknown): string => String(value ?? "").trim();

export const sellerApplicationSchema = z.object({
  fullName: z.string().trim().min(2).max(120),
  studioName: z.string().trim().min(2).max(120),
  email: z.string().email(),
  mobile: z.string().trim().regex(/^\+?[0-9][0-9\s-]{7,17}$/),
  city: z.string().trim().min(2).max(80),
  state: z.string().trim().min(2).max(80),
  instagram: z.union([z.literal(""), z.string().url()]).optional(),
  experience: z.preprocess(cleanText, z.string().min(1, "Enter your experience, for example 2 years.").max(2000)),
  productCategories: z.preprocess(cleanText, z.string().min(2, "Enter at least one category, for example Watches.").max(500)),
  whyJoin: z.preprocess(cleanText, z.string().min(5, "Tell us briefly why you want to join Sidra.").max(2000)),
  expectedMonthlyCapacity: z.preprocess(cleanText, z.string().regex(/^[0-9]+$/, "Enter a whole number, for example 10.")),
});

export type SellerApplicationFormInput = z.input<typeof sellerApplicationSchema>;
export type SellerApplicationFormValues = z.output<typeof sellerApplicationSchema>;

export function splitCategories(value: string): string[] {
  return [...new Set(value.split(",").map((item) => item.replace(/^[\s"']+|[\s"']+$/g, "").trim()).filter(Boolean))].slice(0, 20);
}
