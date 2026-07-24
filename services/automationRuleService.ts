import { orderBy } from "firebase/firestore";
import { getDocumentById, listDocuments, setDocument, updateDocument } from "@/services/firestoreRepository";
import type { AutomationRule } from "@/types/platform";

export function getAutomationRule(automationRuleId: string): Promise<AutomationRule | null> {
  return getDocumentById<AutomationRule>("automationRules", automationRuleId);
}

export function listAutomationRules(maxResults = 100): Promise<readonly AutomationRule[]> {
  return listDocuments<AutomationRule>("automationRules", [orderBy("createdAt", "desc")], maxResults);
}

export function saveAutomationRule(rule: AutomationRule): Promise<void> {
  return setDocument("automationRules", rule.automationRuleId, rule);
}

export function updateAutomationRule(automationRuleId: string, value: Partial<AutomationRule>): Promise<void> {
  return updateDocument<AutomationRule>("automationRules", automationRuleId, value);
}
