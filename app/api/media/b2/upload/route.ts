import { NextResponse } from "next/server";
import { b2Request, safeB2FileName } from "@/lib/server/backblazeB2";
import { firebaseBearerToken, verifyFirebaseRequest } from "@/lib/server/firebaseIdentity";
import { getFirestoreDocumentWithUserToken } from "@/lib/server/firestoreRest";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 30;
const MAX_FILE_BYTES = 8 * 1024 * 1024;

export async function POST(request: Request): Promise<NextResponse> {
  try {
    const identity = await verifyFirebaseRequest(request);
    if (!identity.emailVerified) return NextResponse.json({ error: "Verify your email before uploading." }, { status: 403 });
    const form = await request.formData();
    const file = form.get("file");
    const ownerUid = String(form.get("ownerUid") ?? "");
    const applicationId = String(form.get("applicationId") ?? "").replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 100);
    const context = String(form.get("context") ?? "seller-application");
    const studioId = String(form.get("studioId") ?? "").replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 100);
    const productId = String(form.get("productId") ?? "").replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 100);
    if (ownerUid !== identity.uid) return NextResponse.json({ error: "Invalid media owner." }, { status: 403 });
    if ((context === "product" || context === "seller-kyc") && studioId) {
      const profile = await getFirestoreDocumentWithUserToken(firebaseBearerToken(request), `users/${identity.uid}`);
      const configuredAdmin = identity.email?.toLowerCase() === "syedafsharkhadri63@gmail.com";
      if (String(profile?.studioId ?? "") !== studioId && !configuredAdmin) {
        return NextResponse.json({ error: "This Studio media destination is not assigned to your account." }, { status: 403 });
      }
    }
    const sellerKycFile = context === "seller-kyc"
      && (file instanceof File)
      && (file.type.startsWith("image/") || file.type === "application/pdf");
    if (!(file instanceof File) || (!file.type.startsWith("image/") && !sellerKycFile)) return NextResponse.json({ error: "Choose a valid image or PDF." }, { status: 400 });
    if (file.size > MAX_FILE_BYTES) return NextResponse.json({ error: `${file.name} is larger than 8 MB.` }, { status: 413 });
    let path: string;
    if (context === "seller-application" && applicationId) path = `seller-applications/${identity.uid}/${applicationId}/portfolio/${safeB2FileName(file.name)}`;
    else if (context === "product" && studioId && productId) path = `studios/${studioId}/products/${productId}/${safeB2FileName(file.name)}`;
    else if (context === "profile") path = `users/${identity.uid}/profile/${safeB2FileName(file.name)}`;
    else if (context === "seller-kyc" && studioId) path = `studios/${studioId}/kyc/${safeB2FileName(file.name)}`;
    else return NextResponse.json({ error: "Invalid media destination." }, { status: 400 });
    const uploaded = await b2Request("PUT", path, Buffer.from(await file.arrayBuffer()), file.type || "image/jpeg");
    if (!uploaded.ok) throw new Error(`B2 upload failed (${uploaded.status}).`);
    const publicUrl = context === "product" || context === "profile"
      ? `/api/media/b2/public?path=${encodeURIComponent(path)}`
      : "";
    return NextResponse.json({ path, publicUrl, fileName: file.name, contentType: file.type, size: file.size });
  } catch (caught) {
    const message = caught instanceof Error ? caught.message : "B2 upload failed.";
    return NextResponse.json({ error: message }, { status: message.includes("AUTH") ? 401 : 500 });
  }
}
