import { NextResponse, type NextRequest } from "next/server";
import { verifyToken, SESSION_COOKIE_NAME } from "@/lib/auth/jwt.server";
import { getFirestore } from "@/lib/firestore/admin";
import type { UserProgressBundle } from "@/lib/user-data/types";
import { mergeBundles, clampFutureTimestamps } from "@/lib/user-data/merge";
import { recordRateLimit } from "@/lib/security/rateLimit";
import { isBodyTooLarge, PROGRESS_MAX_BODY_BYTES } from "@/lib/security/bodyLimit";

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
  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await verifyToken(token);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const db = getFirestore();
    const doc = await db.collection("user_progress").doc(user.userId).get();
    if (!doc.exists) return NextResponse.json(null);
    return NextResponse.json(doc.data());
  } catch (err) {
    console.error("GET /api/user/progress failed", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await verifyToken(token);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Shadow-mode record only — never blocks in Phase 0 (roadmap S1).
  await recordRateLimit(`progress:${user.userId}`, PROGRESS_RATE_LIMIT);

  if (isBodyTooLarge(request, PROGRESS_MAX_BODY_BYTES)) {
    if (enforceBodyCap()) {
      return NextResponse.json({ error: "Payload too large" }, { status: 413 });
    }
    // eslint-disable-next-line no-console -- shadow-mode recording until enforcement is enabled.
    console.warn(
      `[body-cap:shadow] userId=${user.userId} bytes=${request.headers.get("content-length")}`,
    );
  }

  try {
    const body = (await request.json()) as unknown;
    const bundleVersion =
      typeof body === "object" && body !== null
        ? (body as Record<string, unknown>).bundleVersion
        : undefined;
    // Accept v1 (math only), v2 (adds English), v3 (adds per-track review), and
    // v4 (adds Science) — backward + forward compatible. Rejecting v4 here was a
    // pre-existing bug: the client emits bundleVersion 4, so every push 400'd.
    if (bundleVersion !== 1 && bundleVersion !== 2 && bundleVersion !== 3 && bundleVersion !== 4) {
      return NextResponse.json({ error: "Invalid bundle" }, { status: 400 });
    }

    // Guard LWW/per-day merges against a device with a fast clock before merging.
    const incoming = clampFutureTimestamps(body as UserProgressBundle, new Date());

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
    console.error("POST /api/user/progress failed", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
