import { type NextRequest } from "next/server";
import { getFirestore } from "@/lib/firestore/admin";
import { SESSION_COOKIE_NAME, verifyToken } from "./jwt.server";
import type { SessionClaims } from "./types";

/**
 * Session verification with optional revocation check (roadmap Phase 1 / S4).
 *
 * `verifyToken` alone is a pure-JWT check (signature + expiry + shape, no DB read). That is
 * enough for read-only identity (`/api/auth/me`). For anything that reads or mutates a user's
 * data, pass `requireVersionCheck: true`: we then read the user's stored `tokenVersion` and
 * reject the request when it no longer matches the version embedded in the token — that is how
 * a password reset or "log out everywhere" revokes an old session immediately.
 *
 * Backward-compat (critical): a pre-Phase-1 token carries no version claim ⇒ treated as 0, and
 * a user doc with no `tokenVersion` field ⇒ treated as 0, so an untouched live 30-day session
 * (0 === 0) stays valid.
 *
 * Errors: an invalid/expired/tampered token or a version mismatch ⇒ `null` (caller returns
 * 401). A Firestore read error is NOT swallowed — it propagates so the caller's existing
 * try/catch yields a 500 rather than spuriously logging the user out on a transient blip.
 */
export async function verifySession(
  request: NextRequest,
  { requireVersionCheck = false }: { requireVersionCheck?: boolean } = {},
): Promise<SessionClaims | null> {
  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  if (!token) return null;

  const claims = await verifyToken(token);
  if (!claims) return null;

  if (!requireVersionCheck) return claims;

  const db = getFirestore();
  const doc = await db.collection("users").doc(claims.userId).get();
  // A deleted account ⇒ no doc ⇒ reject. Absent field ⇒ version 0.
  if (!doc.exists) return null;
  const storedVersion = doc.data()?.tokenVersion;
  const currentVersion = typeof storedVersion === "number" ? storedVersion : 0;
  if (claims.tokenVersion !== currentVersion) return null;

  return claims;
}
