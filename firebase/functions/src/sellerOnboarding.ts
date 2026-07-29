import { randomUUID } from "node:crypto";
import { getAuth } from "firebase-admin/auth";
import { getStorage } from "firebase-admin/storage";
import { FieldValue, getFirestore } from "firebase-admin/firestore";
import { HttpsError, onCall } from "firebase-functions/v2/https";
import { onDocumentUpdated } from "firebase-functions/v2/firestore";
import { logger } from "firebase-functions";
import { executeSellerProvisioning, ProvisioningAlreadyHandledError, shouldStartProvisioning, type ProvisioningContext, type ProvisioningDependencies, type ProvisioningState, type ProvisioningStep } from "./sellerProvisioningCore";
import { DEFAULT_SELLER_WELCOME_TEMPLATE, isSellerWelcomeTemplate, renderCmsTemplate, type SellerWelcomeTemplate } from "./cmsDefaults";

const db = getFirestore();
const auth = getAuth();
const bucket = getStorage().bucket();
const founderRoles = new Set(["founder", "superAdmin"]);
const decisions = new Set(["approve", "reject", "requestMoreInfo", "hold"]);
const statusByDecision = { approve: "approved", reject: "rejected", requestMoreInfo: "moreInfoRequested", hold: "onHold" } as const;
function now() { return FieldValue.serverTimestamp(); }

function slugBase(value: string) { return value.toLowerCase().normalize("NFKD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 54) || "studio"; }
async function studioUnavailableMode(): Promise<"temporarilyUnavailable" | "notFound"> {
  const setting = await db.doc("settings/studioVisibility").get();
  return setting.data()?.suspendedStudioMode === "notFound" ? "notFound" : "temporarilyUnavailable";
}
async function reserveUniqueSlug(studioName: string, studioId: string): Promise<string> {
  const base = slugBase(studioName);
  const unavailableMode = await studioUnavailableMode();
  for (let attempt = 0; attempt < 100; attempt += 1) {
    const slug = attempt === 0 ? base : `${base}-${attempt + 1}`;
    const routeRef = db.doc(`studioRoutes/${slug}`);
    try {
      await db.runTransaction(async (transaction) => {
        const route = await transaction.get(routeRef);
        if (route.exists) throw new Error("SLUG_COLLISION");
        transaction.create(routeRef, { studioId, slug, displayName: studioName, status: "provisioning", unavailableMode, createdAt: now(), updatedAt: now() });
        transaction.update(db.doc(`studios/${studioId}`), { slug, updatedAt: now() });
      });
      return slug;
    } catch (error) { if (!(error instanceof Error) || error.message !== "SLUG_COLLISION") throw error; }
  }
  throw new Error("Unable to reserve a unique Studio slug.");
}
function dependencies(): ProvisioningDependencies {
  let studioCreated = false;
  let slugReserved = false;
  let storageTreeStarted = false;
  let analyticsCreated = false;
  let seoCreated = false;
  let priorClaims: Record<string, unknown> = {};
  let claimsChanged = false;
  let userDocumentChanged = false;
  let welcomeMailId: string | null = null;
  let welcomeMailCreated = false;
  let notificationId: string | null = null;
  let notificationCreated = false;
  const movedPortfolio: Array<{ source: string; destination: string }> = [];
  return {
    async createStudio(context, state) {
      const applicationRef = db.doc(`sellerApplications/${context.applicationId}`);
      const studioRef = db.doc(`studios/${state.studioId}`);
      await db.runTransaction(async (transaction) => {
        const application = await transaction.get(applicationRef);
        if (!application.exists || application.data()?.status !== "approved") {
          throw new ProvisioningAlreadyHandledError();
        }
        transaction.create(studioRef, {
          studioId: state.studioId, ownerUid: context.uid, name: context.studioName, slug: null,
          description: "", logoUrl: null, bannerUrl: null, galleryUrls: [], category: null,
          followerCount: 0, rating: 0, reviewCount: 0, totalOrders: 0, revenueTotal: 0,
          subscriptionTier: "starter", subscriptionPlan: "commission",
          subscriptionMonthlyFeePaise: 0, commissionRateBasisPoints: 1200,
          subscriptionStatus: "commission", verificationBadge: "none", featured: false, active: false,
          provisioningState: "provisioning", seo: { title: context.studioName, description: "", ogImage: null },
          policies: { shipping: "", returns: "", customOrderTerms: "" }, createdAt: now(), updatedAt: now(),
        });
        transaction.update(applicationRef, { status: "provisioning", studioId: state.studioId, updatedAt: now() });
      });
      studioCreated = true;
    },
    async reserveSlug(context, state) {
      state.slug = await reserveUniqueSlug(context.studioName, state.studioId);
      slugReserved = true;
    },
    async createStorageTree(context, state) {
      const expectedPrefix = `temp/${context.uid}/seller-applications/`;
      if (context.portfolioPaths.some((sourcePath) => !sourcePath.startsWith(expectedPrefix))) {
        throw new Error("Seller portfolio ownership validation failed.");
      }
      storageTreeStarted = true;
      for (const folder of ["logo", "banner", "gallery", "products"]) await bucket.file(`studios/${state.studioId}/${folder}/.keep`).save("", { contentType: "application/x-empty", metadata: { metadata: { managedBy: "sidraProvisioning" } } });
      for (const sourcePath of context.portfolioPaths) {
        const destination = `studios/${state.studioId}/gallery/${randomUUID()}`;
        await bucket.file(sourcePath).copy(bucket.file(destination));
        await bucket.file(sourcePath).delete();
        movedPortfolio.push({ source: sourcePath, destination });
      }
    },
    async initializeAnalytics(_context, state) {
      await db.doc(`analytics/${state.studioId}`).create({ studioId: state.studioId, views: 0, visitors: 0, followers: 0, productViews: 0, wishlistAdds: 0, orders: 0, grossRevenue: 0, netRevenue: 0, conversionRate: 0, updatedAt: now() });
      analyticsCreated = true;
    },
    async createSeoMetadata(context, state) {
      await db.doc(`seo/${state.studioId}`).create({ entityType: "studio", entityId: state.studioId, slug: state.slug, title: context.studioName, description: "", keywords: [], canonicalUrl: `/studio/${state.slug}`, noIndex: true, createdAt: now(), updatedAt: now() });
      seoCreated = true;
    },
    async assignSellerRole(context, state) {
      const user = await auth.getUser(context.uid); priorClaims = user.customClaims ?? {};
      await auth.setCustomUserClaims(context.uid, { ...priorClaims, role: "seller", studioId: state.studioId });
      claimsChanged = true;
      await db.doc(`users/${context.uid}`).update({ role: "seller", studioId: state.studioId, updatedAt: now() });
      userDocumentChanged = true;
    },
    async sendWelcomeEmail(context, state) {
      const templateRef = db.doc("cms/emailTemplates");
      const templateSnapshot = await templateRef.get();
      const configuredTemplate = templateSnapshot.data()?.sellerWelcome;
      let welcome: SellerWelcomeTemplate;
      if (isSellerWelcomeTemplate(configuredTemplate)) {
        welcome = configuredTemplate;
      } else {
        welcome = DEFAULT_SELLER_WELCOME_TEMPLATE;
        await templateRef.set({
          sellerWelcome: welcome,
          phase3BootstrapVersion: 1,
          updatedAt: now(),
        }, { merge: true });
      }
      const templateData = {
        fullName: context.fullName,
        studioName: context.studioName,
        studioUrl: `/studio/${state.slug}`,
        dashboardUrl: "/studio-admin/overview",
      };
      const message: { subject: string; text?: string; html?: string } = {
        subject: renderCmsTemplate(welcome.subject, templateData),
      };
      if (typeof welcome.text === "string") message.text = renderCmsTemplate(welcome.text, templateData);
      if (typeof welcome.html === "string") message.html = renderCmsTemplate(welcome.html, templateData);
      welcomeMailId = `sellerWelcome-${context.applicationId}`;
      await db.doc(`mail/${welcomeMailId}`).create({
        to: [context.email],
        message,
        sourceTemplatePath: "cms/emailTemplates.sellerWelcome",
        templateData,
        deliveryState: "queued",
        createdAt: now(),
      });
      welcomeMailCreated = true;
    },
    async sendSellerNotification(context, state) {
      notificationId = `sellerApproved-${context.applicationId}`;
      await db.doc(`notifications/${notificationId}`).create({ recipientUid: context.uid, type: "sellerApproved", title: "Your Sidra Studio is ready", body: `${context.studioName} has been provisioned.`, actionUrl: "/studio-admin/overview", read: false, studioId: state.studioId, createdAt: now() });
      notificationCreated = true;
    },
    async writeApprovalAudit(context, state) {
      const batch = db.batch();
      batch.create(db.collection("auditLogs").doc(), { logId: randomUUID(), actorUid: context.approvingAdminUid, action: "sellerApproved", targetType: "sellerApplication", targetId: context.applicationId, previousValue: { status: "approved" }, newValue: { status: "provisioned", studioId: state.studioId, slug: state.slug }, timestamp: now(), ipAddress: null, userAgent: "cloud-function" });
      batch.update(db.doc(`studios/${state.studioId}`), { active: true, provisioningState: "complete", updatedAt: now() });
      if (state.slug) batch.update(db.doc(`studioRoutes/${state.slug}`), { status: "active", updatedAt: now() });
      batch.update(db.doc(`sellerApplications/${context.applicationId}`), { status: "provisioned", studioId: state.studioId, slug: state.slug, provisionedAt: now(), updatedAt: now(), failureReason: null });
      await batch.commit();
    },
    async compensate(step: ProvisioningStep, context: ProvisioningContext, state: ProvisioningState) {
      if (step === "sendSellerNotification" && notificationCreated && notificationId) await db.doc(`notifications/${notificationId}`).delete();
      if (step === "sendWelcomeEmail" && welcomeMailCreated && welcomeMailId) await db.doc(`mail/${welcomeMailId}`).delete();
      if (step === "assignSellerRole") {
        if (claimsChanged) await auth.setCustomUserClaims(context.uid, priorClaims);
        if (userDocumentChanged) await db.doc(`users/${context.uid}`).update({ role: typeof priorClaims.role === "string" ? priorClaims.role : "customer", studioId: typeof priorClaims.studioId === "string" ? priorClaims.studioId : null, updatedAt: now() });
      }
      if (step === "createSeoMetadata" && seoCreated) await db.doc(`seo/${state.studioId}`).delete();
      if (step === "initializeAnalytics" && analyticsCreated) await db.doc(`analytics/${state.studioId}`).delete();
      if (step === "createStorageTree" && storageTreeStarted) {
        for (const item of movedPortfolio) {
          const [exists] = await bucket.file(item.destination).exists();
          if (exists) await bucket.file(item.destination).copy(bucket.file(item.source));
        }
        await bucket.deleteFiles({ prefix: `studios/${state.studioId}/` });
      }
      if (step === "reserveSlug" && slugReserved && state.slug) await db.doc(`studioRoutes/${state.slug}`).delete();
      if (step === "createStudio" && studioCreated) await db.doc(`studios/${state.studioId}`).delete();
    },
    async writeFailureAudit(context, state, error) {
      await db.collection("auditLogs").add({ logId: randomUUID(), actorUid: context.approvingAdminUid, action: "provisioningFailed", targetType: "sellerApplication", targetId: context.applicationId, previousValue: { status: "provisioning" }, newValue: { status: "provisioningFailed", reason: error.message }, timestamp: now(), ipAddress: null, userAgent: "cloud-function" });
      await db.doc(`sellerApplications/${context.applicationId}`).update({ status: "provisioningFailed", studioId: null, slug: null, failureReason: error.message, updatedAt: now() });
    },
    async alertFounder(context, state, error) {
      const founders = await db.collection("users").where("role", "in", ["founder", "superAdmin"]).get();
      const batch = db.batch();
      founders.docs.forEach((founder) => batch.create(db.collection("notifications").doc(), { recipientUid: founder.id, type: "provisioningFailed", title: "Studio provisioning needs attention", body: `${context.studioName}: ${error.message}`, actionUrl: `/admin/sellers/applications`, read: false, studioId: state.studioId, createdAt: now() }));
      await batch.commit();
    },
  };
}
export const reviewSellerApplication = onCall(async (request) => {
  if (!request.auth || !founderRoles.has(String(request.auth.token.role))) throw new HttpsError("permission-denied", "Founder access is required.");
  const applicationId = typeof request.data?.applicationId === "string" ? request.data.applicationId : "";
  const decision = typeof request.data?.decision === "string" ? request.data.decision : "";
  const note = typeof request.data?.note === "string" ? request.data.note.trim().slice(0, 2000) : "";
  if (!applicationId || !decisions.has(decision)) throw new HttpsError("invalid-argument", "A valid application and decision are required.");
  if (decision !== "approve" && note.length < 3) throw new HttpsError("invalid-argument", "A review note is required.");
  const applicationRef = db.doc(`sellerApplications/${applicationId}`);
  await db.runTransaction(async (transaction) => {
    const snapshot = await transaction.get(applicationRef);
    if (!snapshot.exists) throw new HttpsError("not-found", "Seller application not found.");
    const current = String(snapshot.data()?.status ?? "");
    if (!["pending", "moreInfoRequested", "onHold", "provisioningFailed"].includes(current)) throw new HttpsError("failed-precondition", "This application cannot receive another decision.");
    transaction.update(applicationRef, { status: statusByDecision[decision as keyof typeof statusByDecision], reviewNote: note || null, reviewedBy: request.auth!.uid, reviewedAt: now(), updatedAt: now(), failureReason: null });
    transaction.create(db.collection("auditLogs").doc(), { logId: randomUUID(), actorUid: request.auth!.uid, action: `sellerApplication${decision[0].toUpperCase()}${decision.slice(1)}`, targetType: "sellerApplication", targetId: applicationId, previousValue: { status: current }, newValue: { status: statusByDecision[decision as keyof typeof statusByDecision], note: note || null }, timestamp: now(), ipAddress: request.rawRequest.ip ?? null, userAgent: request.rawRequest.headers["user-agent"] ?? null });
  });
  return { accepted: true as const };
});
export const provisionApprovedSeller = onDocumentUpdated("sellerApplications/{applicationId}", async (event) => {
  const before = event.data?.before.data(); const after = event.data?.after.data();
  if (!before || !after || !shouldStartProvisioning(before.status, after.status)) return;
  const context: ProvisioningContext = { applicationId: event.params.applicationId, uid: String(after.uid), approvingAdminUid: String(after.reviewedBy), fullName: String(after.fullName), studioName: String(after.studioName), email: String(after.email), portfolioPaths: Array.isArray(after.portfolioImages) ? after.portfolioImages.map((item: { path?: unknown }) => String(item.path ?? "")).filter(Boolean) : [] };
  try {
    await executeSellerProvisioning(context, dependencies());
  } catch (error) {
    if (error instanceof ProvisioningAlreadyHandledError) return;
    throw error;
  }
});
export const syncStudioRouteStatus = onDocumentUpdated("studios/{studioId}", async (event) => {
  const before = event.data?.before.data(); const after = event.data?.after.data();
  if (!before || !after || before.active === after.active && before.slug === after.slug && before.provisioningState === after.provisioningState) return;
  if (before.slug && after.slug !== before.slug) { logger.error("Studio slug mutation detected", { studioId: event.params.studioId, before: before.slug, after: after.slug }); return; }
  if (typeof after.slug === "string") {
    const status = after.active === true ? "active" : after.provisioningState === "complete" ? "suspended" : "provisioning";
    const unavailableMode = await studioUnavailableMode();
    await db.doc(`studioRoutes/${after.slug}`).set({ studioId: event.params.studioId, slug: after.slug, displayName: after.name, status, unavailableMode, updatedAt: now() }, { merge: true });
  }
});
