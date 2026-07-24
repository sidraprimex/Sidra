import type { DateTimeValue } from "@/types/firestore";

export type CmsSurface = "homepage" | "navigation" | "footer" | "theme" | "announcementBar" | "emailTemplates" | "policies";

export interface CmsBlock {
  readonly id: string;
  readonly type: string;
  readonly enabled: boolean;
  readonly order: number;
  readonly data: Readonly<Record<string, unknown>>;
}

export interface CmsDocument {
  readonly docId: CmsSurface | string;
  readonly blocks: readonly CmsBlock[];
  readonly version: number;
  readonly published: boolean;
  readonly updatedBy: string;
  readonly updatedAt: DateTimeValue;
}
