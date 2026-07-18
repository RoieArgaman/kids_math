import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE_NAME } from "@/lib/auth/jwt.server";
import { verifySession } from "@/lib/auth/session.server";
import { getFirestore } from "@/lib/firestore/admin";
import { clearAllGradeBUnlockCookies } from "@/lib/server/gradeUnlockCookies";

/**
 * "Log out everywhere" (roadmap Phase 1 / S4). Bumps the caller's `tokenVersion`, which
 * immediately invalidates every previously-issued session for this user on the version-checked
 * routes — including the one making this request. It then clears this device's session +
 * Grade-B cookies exactly like `logout`, so the caller is signed out here too.
 *
 * Identity comes from a plain JWT check (no version-check): the point is to revoke, so we don't
 * gate the revoke itself on the version we're about to bump.
 */
export async function POST(request: NextRequest) {
  try {
    const claims = await verifySession(request);
    if (!claims) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const db = getFirestore();
    const ref = db.collection("users").doc(claims.userId);
    await db.runTransaction(async (tx) => {
      const snap = await tx.get(ref);
      if (!snap.exists) return;
      const current = snap.data()?.tokenVersion;
      const nextVersion = (typeof current === "number" ? current : 0) + 1;
      // Field-masked, not a whole-doc set: spreading the snapshot would write back a stale
      // `status` and resurrect an account deleted between this read and the commit.
      tx.update(ref, { tokenVersion: nextVersion });
    });

    const res = NextResponse.json({ ok: true });
    res.cookies.set(SESSION_COOKIE_NAME, "", {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: 0,
    });
    clearAllGradeBUnlockCookies(res, request);
    return res;
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
