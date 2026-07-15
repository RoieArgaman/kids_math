import { NextResponse, type NextRequest } from "next/server";
import { verifySession } from "@/lib/auth/session.server";
import { getFirestore } from "@/lib/firestore/admin";
import type { UserProgressBundle } from "@/lib/user-data/types";
import { mergeBundles, clampFutureTimestamps } from "@/lib/user-data/merge";
import { enforceRateLimit, rateLimitedResponse } from "@/lib/security/rateLimit";
import { isBodyTooLarge, PROGRESS_MAX_BODY_BYTES } from "@/lib/security/bodyLimit";
import { progressEnvelopeSchema } from "@/lib/security/schemas";
import { captureError } from "@/lib/observability/errorReporting";

// Progress pushes are userId-keyed. Generous window — a busy session pushes often.
const PROGRESS_RATE_LIMIT = { limit: 60, windowMs: 60 * 1000 };

// The body cap is staged: while enforcement is off (default), an over-cap body is only
// logged and still processed, so no long-time student's accumulated bundle is ever
// rejected. Flip PROGRESS_BODY_CAP_ENFORCE=1 once shadow logs confirm zero legit hits.
// Read per-request so ops can toggle it via env without a code change.
function enforceBodyCap(): boolean {
  return process.env.PROGRESS_BODY_CAP_ENFORCE === "1";
}

export async function GET(request: NextRequest) {
  try {
    // Data access ⇒ version-check so a revoked session (password reset / "log out
    // everywhere") is refused immediately (roadmap S4).
    const user = await verifySession(request, { requireVersionCheck: true });
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const db = getFirestore();
    const doc = await db.collection("user_progress").doc(user.userId).get();
    if (!doc.exists) return NextResponse.json(null);
    return NextResponse.json(doc.data());
  } catch (err) {
    captureError(err, { route: "GET /api/user/progress" });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    // Data mutation ⇒ version-check so a revoked session is refused immediately (S4).
    const user = await verifySession(request, { requireVersionCheck: true });
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // Staged limiter (S1): records always, blocks only when RATE_LIMIT_ENFORCE=1 (roadmap 2.7).
    const rl = await enforceRateLimit(`progress:${user.userId}`, PROGRESS_RATE_LIMIT);
    if (rl.blocked) return rateLimitedResponse(rl.retryAfterMs);

    if (isBodyTooLarge(request, PROGRESS_MAX_BODY_BYTES)) {
      if (enforceBodyCap()) {
        return NextResponse.json({ error: "Payload too large" }, { status: 413 });
      }
      // eslint-disable-next-line no-console -- shadow-mode recording until enforcement is enabled.
      console.warn(
        `[body-cap:shadow] userId=${user.userId} bytes=${request.headers.get("content-length")}`,
      );
    }

    // Envelope-only validation (S8): confirm it's an object with a known bundleVersion
    // (v1 math, v2 +English, v3 +review, v4 +Science) — backward + forward compatible.
    // We deliberately do NOT deep-validate the bundle; the merge layer is the tolerant
    // reader, and a strict schema would risk rejecting real accumulated learner data.
    const parsed = progressEnvelopeSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid bundle" }, { status: 400 });
    }

    // Guard LWW/per-day merges against a device with a fast clock before merging.
    const incoming = clampFutureTimestamps(parsed.data as unknown as UserProgressBundle, new Date());

    const db = getFirestore();
    const ref = db.collection("user_progress").doc(user.userId);
    // Transaction serializes concurrent pushes so one never clobbers another.
    await db.runTransaction(async (tx) => {
      const snap = await tx.get(ref);
      const existing = snap.exists ? (snap.data() as UserProgressBundle) : null;
      const merged = mergeBundles(existing, incoming);
      tx.set(ref, { ...merged, updatedAt: new Date().toISOString() });
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    captureError(err, { route: "POST /api/user/progress" });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
