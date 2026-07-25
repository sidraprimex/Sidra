import { initializeApp } from "firebase-admin/app";

initializeApp();

export { syncUserClaims } from "./authClaims.js";
export { createCustomOrderRequest } from "./customOrders.js";
export { appendOrderTimeline } from "./orderTimeline.js";
export { createVerifiedReview, guardReviewVerification } from "./reviews.js";
export { purgeExpiredTempUploads } from "./storageMaintenance.js";
export { provisionApprovedSeller, reviewSellerApplication, syncStudioRouteStatus } from "./sellerOnboarding";
export { recognizeSellerHandwriting } from "./handwritingRecognition";
export { validateProductMediaUpload } from "./productMediaValidation";
export { moderateProduct } from "./productPublishing";
export { maintainProductSearchIndex } from "./productSearchIndex";
export { initiatePayment } from "./initiatePayment";
export { razorpayWebhook } from "./paymentWebhook";
export { updateOrderStatus } from "./updateOrderStatus";
export { requestOrderRefund } from "./requestOrderRefund";
export { submitCustomOrder } from "./submitCustomOrder";
export { sendCustomOrderQuote, sendCustomOrderMessage } from "./customOrderActions";
export { acceptCustomOrderQuote } from "./customOrderPayment";
export { submitCustomOrderProof, reviewCustomOrderProof } from "./customOrderProofs";
export { submitProductReview } from "./submitProductReview";
export { toggleWishlistProduct, toggleStudioFollow, getCustomerDashboardSummary } from "./customerEngagement";
export { respondToReview } from "./respondToReview";
export { aggregatePublishedReview } from "./reviewAggregation";
export { savePlatformContent, saveCommerceSettings, getFounderControlCenterSummary } from "./founderAdmin";
export { getSellerAnalyticsSummary, saveCustomerSegment, saveSellerCampaign, saveSellerCoupon } from "./sellerGrowth";
export { createSupportTicket, sendSupportMessage, manageSupportTicket, markAllNotificationsRead } from "./communication";
