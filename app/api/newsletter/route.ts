import crypto from "node:crypto";
import { NextResponse } from "next/server";
import { FieldValue, Timestamp } from "firebase-admin/firestore";
import { sidraAdminDb } from "@/lib/server/firebaseAdmin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

function hash(value: string): string {
  return crypto.createHash("sha256").update(value).digest("hex");
}

export async function POST(request: Request): Promise<NextResponse> {
  try {
    const body = await request.json() as { email?: unknown };
    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    if (email.length > 254 || !EMAIL.test(email)) {
      return NextResponse.json({ error: "Enter a valid email address." }, { status: 400 });
    }

    const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
    const db = sidraAdminDb();
    const subscriber = db.collection("newsletterSubscribers").doc(hash(email));
    const limiter = db.collection("newsletterRateLimits").doc(hash(forwarded));
    const now = Timestamp.now();
    const result = await db.runTransaction(async (transaction) => {
      const [subscriberSnapshot, limiterSnapshot] = await Promise.all([
        transaction.get(subscriber),
        transaction.get(limiter),
      ]);
      const limit = limiterSnapshot.data() ?? {};
      const started = limit.windowStartedAt instanceof Timestamp ? limit.windowStartedAt : null;
      const active = Boolean(started && now.toMillis() - started.toMillis() < 3_600_000);
      const attempts = active ? Number(limit.attempts ?? 0) : 0;
      if (attempts >= 12) throw new Error("NEWSLETTER_RATE_LIMIT");
      transaction.set(limiter, {
        attempts: attempts + 1,
        windowStartedAt: active ? started : now,
        updatedAt: FieldValue.serverTimestamp(),
      }, { merge: true });
      const existing = subscriberSnapshot.data() ?? {};
      transaction.set(subscriber, {
        email,
        emailHash: hash(email),
        status: "active",
        source: "homepage",
        consentVersion: "homepage-newsletter-v1",
        subscribedAt: existing.subscribedAt ?? FieldValue.serverTimestamp(),
        lastSubmittedAt: FieldValue.serverTimestamp(),
        submissionCount: FieldValue.increment(1),
        updatedAt: FieldValue.serverTimestamp(),
      }, { merge: true });
      return { accepted: true as const, alreadySubscribed: existing.status === "active" };
    });
    return NextResponse.json(result);
  } catch (error) {
    const rateLimited = error instanceof Error && error.message === "NEWSLETTER_RATE_LIMIT";
    return NextResponse.json(
      { error: rateLimited ? "Too many attempts. Please try again later." : "Subscription failed." },
      { status: rateLimited ? 429 : 500 },
    );
  }
}
