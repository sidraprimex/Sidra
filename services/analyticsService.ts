import { orderBy, where } from "firebase/firestore";
import { getDocumentById, listDocuments } from "@/services/firestoreRepository";
import type { AnalyticsMetricDocument } from "@/types/platform";

export function getAnalyticsMetric(analyticsId: string): Promise<AnalyticsMetricDocument | null> {
  return getDocumentById<AnalyticsMetricDocument>("analytics", analyticsId);
}

export function listSubjectAnalytics(subjectType: AnalyticsMetricDocument["subjectType"], subjectId: string, maxResults = 50): Promise<readonly AnalyticsMetricDocument[]> {
  return listDocuments<AnalyticsMetricDocument>("analytics", [where("subjectType", "==", subjectType), where("subjectId", "==", subjectId), orderBy("periodStart", "desc")], maxResults);
}
