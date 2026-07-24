import { getAuth } from "firebase-admin/auth";
import { FieldValue, getFirestore } from "firebase-admin/firestore";
import { logger } from "firebase-functions";
import { defineString } from "firebase-functions/params";
import { onDocumentWritten } from "firebase-functions/v2/firestore";

const founderUidAllowlist = defineString("FOUNDER_UID_ALLOWLIST", { default: "" });
const PRIVILEGED_ROLES = new Set(["founder", "superAdmin"]);
const VALID_ROLES = new Set([
  "visitor", "customer", "seller", "support", "contentManager",
  "financeManager", "marketingManager", "founder", "superAdmin",
]);

function allowedFounderUids(): Set<string> {
  return new Set(founderUidAllowlist.value().split(",").map((value) => value.trim()).filter(Boolean));
}

export const syncUserClaims = onDocumentWritten("users/{uid}", async (event) => {
  const uid = event.params.uid;
  const after = event.data?.after;
  if (!after?.exists) {
    await getAuth().setCustomUserClaims(uid, null);
    return;
  }

  const data = after.data();
  const requestedRole = typeof data.role === "string" && VALID_ROLES.has(data.role) ? data.role : "customer";
  let effectiveRole = requestedRole;

  if (PRIVILEGED_ROLES.has(requestedRole) && !allowedFounderUids().has(uid)) {
    effectiveRole = "customer";
    await getFirestore().doc(`users/${uid}`).update({
      role: "customer",
      updatedAt: FieldValue.serverTimestamp(),
    });
    logger.warn("Rejected privileged Sidra role for UID outside Founder allow-list", { uid, requestedRole });
  }

  const claims: Record<string, string> = { role: effectiveRole };
  if (effectiveRole === "seller" && typeof data.studioId === "string" && data.studioId.length > 0) {
    claims.studioId = data.studioId;
  }
  await getAuth().setCustomUserClaims(uid, claims);
  logger.info("Sidra custom claims synchronized", { uid, role: effectiveRole, studioId: claims.studioId ?? null });
});
