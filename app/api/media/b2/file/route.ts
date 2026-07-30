import { NextResponse } from "next/server";
import { b2Request } from "@/lib/server/backblazeB2";
import { verifyFirebaseRequest } from "@/lib/server/firebaseIdentity";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request): Promise<Response> {
  try {
    const identity = await verifyFirebaseRequest(request);
    const url = new URL(request.url);
    const path = url.searchParams.get("path") ?? "";
    const ownerUid = url.searchParams.get("ownerUid") ?? "";
    const configuredAdmin = identity.email?.toLowerCase() === "syedafsharkhadri63@gmail.com";
    const sellerApplicationPath = path.startsWith(`seller-applications/${ownerUid}/`);
    const sellerKycPath = path.startsWith("studios/") && path.includes("/kyc/");
    if (
      (!sellerApplicationPath && !sellerKycPath)
      || (sellerApplicationPath && identity.uid !== ownerUid && !configuredAdmin)
      || (sellerKycPath && !configuredAdmin)
    ) return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
    const response = await b2Request("GET", path);
    if (!response.ok || !response.body) return NextResponse.json({ error: "Media not found." }, { status: response.status });
    return new Response(response.body, {
      headers: {
        "content-type": response.headers.get("content-type") ?? "image/jpeg",
        "cache-control": "private, max-age=300",
      },
    });
  } catch (caught) {
    return NextResponse.json({ error: caught instanceof Error ? caught.message : "Media could not be loaded." }, { status: 500 });
  }
}
