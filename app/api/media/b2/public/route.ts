import { NextResponse } from "next/server";
import { b2Request } from "@/lib/server/backblazeB2";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request): Promise<Response> {
  try {
    const path = new URL(request.url).searchParams.get("path") ?? "";
    if (!path.startsWith("studios/") && !path.startsWith("users/")) return NextResponse.json({ error: "Invalid public media path." }, { status: 403 });
    const response = await b2Request("GET", path);
    if (!response.ok || !response.body) return NextResponse.json({ error: "Media not found." }, { status: response.status });
    return new Response(response.body, {
      headers: {
        "content-type": response.headers.get("content-type") ?? "image/jpeg",
        "cache-control": "public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800",
      },
    });
  } catch (caught) {
    return NextResponse.json({ error: caught instanceof Error ? caught.message : "Media could not be loaded." }, { status: 500 });
  }
}
