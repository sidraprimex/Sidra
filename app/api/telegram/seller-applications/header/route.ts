import { NextResponse } from "next/server";
import { verifyFirebaseRequest } from "@/lib/server/firebaseIdentity";
import {
  sendTelegramMessage,
  telegramChatId,
} from "@/lib/server/telegramBot";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface HeaderPayload {
  uid?: string;
  applicationId?: string;
  fullName?: string;
  studioName?: string;
  email?: string;
  mobile?: string;
  city?: string;
  state?: string;
  instagram?: string | null;
  experience?: string;
  productCategories?: string[];
  whyJoin?: string;
  expectedMonthlyCapacity?: number;
}

function clean(value: unknown, limit = 700): string {
  return String(value ?? "")
    .replace(/[\u0000-\u001f\u007f]/g, " ")
    .trim()
    .slice(0, limit);
}

function errorResponse(caught: unknown): NextResponse {
  const message =
    caught instanceof Error ? caught.message : "Telegram request failed.";

  const status =
    message === "AUTH_REQUIRED" ||
    message === "INVALID_FIREBASE_SESSION"
      ? 401
      : message === "FORBIDDEN"
        ? 403
        : 500;

  return NextResponse.json({ error: message }, { status });
}

export async function POST(request: Request): Promise<NextResponse> {
  try {
    const identity = await verifyFirebaseRequest(request);
    const payload = (await request.json()) as HeaderPayload;

    if (!identity.emailVerified) {
      throw new Error("FORBIDDEN");
    }

    if (!payload.uid || payload.uid !== identity.uid) {
      throw new Error("FORBIDDEN");
    }

    const applicationId = clean(payload.applicationId, 100);

    if (!applicationId) {
      return NextResponse.json(
        { error: "Application ID is required." },
        { status: 400 },
      );
    }

    const categories = Array.isArray(payload.productCategories)
      ? payload.productCategories.map((item) => clean(item, 100)).join(", ")
      : "";

    const text = [
      "SIDRA SELLER APPLICATION",
      "",
      `Application ID: ${applicationId}`,
      `User UID: ${identity.uid}`,
      `Seller name: ${clean(payload.fullName, 180)}`,
      `Studio name: ${clean(payload.studioName, 180)}`,
      `Email: ${clean(identity.email || payload.email, 240)}`,
      `Mobile: ${clean(payload.mobile, 80)}`,
      `Location: ${clean(payload.city, 120)}, ${clean(payload.state, 120)}`,
      `Instagram: ${clean(payload.instagram || "Not provided", 300)}`,
      `Experience: ${clean(payload.experience, 500)}`,
      `Categories: ${categories || "Not provided"}`,
      `Monthly capacity: ${clean(payload.expectedMonthlyCapacity, 40)}`,
      `Why Sidra: ${clean(payload.whyJoin, 900)}`,
      "",
      "Status: Uploading portfolio",
      `Submitted: ${new Date().toISOString()}`,
    ].join("\n");

    const message = await sendTelegramMessage(text);

    return NextResponse.json({
      chatId: String(message.chat.id || telegramChatId()),
      messageId: message.message_id,
    });
  } catch (caught) {
    return errorResponse(caught);
  }
}
