import { SignJWT, jwtVerify } from "jose";
import type { AuthUser, SessionClaims } from "./types";

export const SESSION_COOKIE_NAME = "kids_math_session";
export const SESSION_DURATION_SECONDS = 30 * 24 * 60 * 60; // 30 days

function getSecretKey(): Uint8Array {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error("JWT_SECRET env var must be set and at least 32 characters");
  }
  return new TextEncoder().encode(secret);
}

/**
 * Sign a session token (roadmap Phase 1 / S4). `tokenVersion` is embedded so sessions can be
 * revoked: bumping the user's stored version invalidates every previously-issued token on the
 * routes that version-check (see `verifySession`). Defaults to 0 so callers that don't yet
 * track a version (and pre-existing 30-day tokens, which carry no claim) are treated as v0 —
 * the critical backward-compat rule: absent version ⇒ 0 ⇒ still valid against an untouched user.
 */
export async function signToken(user: AuthUser, tokenVersion = 0): Promise<string> {
  return new SignJWT({
    userId: user.userId,
    username: user.username,
    role: user.role,
    tokenVersion,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime(`${SESSION_DURATION_SECONDS}s`)
    .setIssuedAt()
    .sign(getSecretKey());
}

/**
 * Verify a token's signature/expiry and shape. Returns the claims incl. `tokenVersion`
 * (absent claim ⇒ 0, for pre-Phase-1 tokens). This is a pure-JWT check — no DB read; the
 * revocation comparison against the stored version lives in `verifySession`.
 */
export async function verifyToken(token: string): Promise<SessionClaims | null> {
  try {
    const { payload } = await jwtVerify(token, getSecretKey());
    if (
      typeof payload.userId !== "string" ||
      typeof payload.username !== "string" ||
      (payload.role !== "user" && payload.role !== "admin")
    ) {
      return null;
    }
    return {
      userId: payload.userId,
      username: payload.username,
      role: payload.role,
      tokenVersion: typeof payload.tokenVersion === "number" ? payload.tokenVersion : 0,
    };
  } catch {
    return null;
  }
}
