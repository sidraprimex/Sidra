import type { AuditedDocument } from "@/types/firestore";

export interface CategoryReturnPolicy {
  readonly returnWindowDays: number;
  readonly customOrderReturnable: boolean;
}

export interface Category extends AuditedDocument {
  readonly categoryId: string;
  readonly name: string;
  readonly slug: string;
  readonly description: string;
  readonly imageUrl: string | null;
  readonly featured: boolean;
  readonly active: boolean;
  readonly sortOrder: number;
  readonly returnPolicy: CategoryReturnPolicy;
  readonly seoId: string | null;
}

export interface Collection extends AuditedDocument {
  readonly collectionId: string;
  readonly name: string;
  readonly slug: string;
  readonly description: string;
  readonly imageUrl: string | null;
  readonly productIds: readonly string[];
  readonly featured: boolean;
  readonly active: boolean;
  readonly sortOrder: number;
  readonly seoId: string | null;
}
