import { createHash } from "node:crypto";
import { getFirestore } from "@/lib/firestore/admin";

/**
 * Account lockout (roadmap Phase 1 / 1.2) — the first ENFORCING limiter (the Phase 0 rate
 * limiter is shadow-only). After {@link LOCKOUT_MAX_FAILURES} consecutive failed logins for a
 * username, further attempts are refused for {@link LOCKOUT_COOLDOWN_MS} (1 minute) — a short,
 * kid-friendly speed-bump that throttles brute-force without punishing a child who mistyped.
 *
 * Anti-enumeration (S2): the caller records failures for UNKNOWN usernames too and returns a
 * uniform response, so "locked" never reveals whether an account exists. State is keyed by the
 * lowercased username, hashed into the doc id (never store the raw username).
 *
 * FAIL-OPEN: any Firestore error resolves to "not locked" — a lockout store outage must never
 * lock every child out of the app. State is shared (Firestore), not per-instance, so it holds
 * across App Hosting's multi-instance / cold-start topology.
 *
 * TTL: each doc carries `expiresAt`; a Firestore TTL policy on that field should prune stale
 * lockout docs (tracked with the Phase 2.7 rate-limit TTL follow-up).
 */

const COLLECTION = "account_lockouts";
export const LOCKOUT_MAX_FAILURES = 5;
export const LOCKOUT_COOLDOWN_MS = 60 * 1000; // 1 minute
const DOC_TTL_MS = 24 * 60 * 60 * 1000; // prune after a day of inactivity

interface LockoutDoc {
  failures?: number;
  lockedUntil?: number;
  expiresAt?: string;
}

export interface LockoutStatus {
  locked: boolean;
  /** Milliseconds until the lock lifts (only when `locked`). */
  retryAfterMs?: number;
  /** Attempts left before a lock (only when not locked). */
  attemptsRemaining?: number;
}

function docIdFor(usernameLower: string): string {
  return createHash("sha256").update(usernameLower).digest("hex");
}

/** Read-only lockout check — call before doing any password work. Fail-open. */
export async function checkLockout(usernameLower: string): Promise<LockoutStatus> {
  try {
    const db = getFirestore();
    const snap = await db.collection(COLLECTION).doc(docIdFor(usernameLower)).get();
    const data = snap.exists ? (snap.data() as LockoutDoc) : null;
    const lockedUntil = typeof data?.lockedUntil === "number" ? data.lockedUntil : 0;
    const now = Date.now();
    if (lockedUntil > now) return { locked: true, retryAfterMs: lockedUntil - now };
    const failures = typeof data?.failures === "number" ? data.failures : 0;
    return { locked: false, attemptsRemaining: Math.max(0, LOCKOUT_MAX_FAILURES - failures) };
  } catch {
    return { locked: false, attemptsRemaining: LOCKOUT_MAX_FAILURES };
  }
}

/**
 * Record one failed attempt and report the resulting status. On the failure that reaches the
 * threshold, sets a fresh {@link LOCKOUT_COOLDOWN_MS} lock and resets the counter so the next
 * window starts clean after the cooldown. Transactional so concurrent failures serialize.
 * Fail-open.
 */
export async function recordFailedAttempt(usernameLower: string): Promise<LockoutStatus> {
  try {
    const db = getFirestore();
    const ref = db.collection(COLLECTION).doc(docIdFor(usernameLower));
    const now = Date.now();
    return await db.runTransaction(async (tx) => {
      const snap = await tx.get(ref);
      const data = snap.exists ? (snap.data() as LockoutDoc) : null;
      const lockedUntil = typeof data?.lockedUntil === "number" ? data.lockedUntil : 0;

      // Already locked — don't extend it; just report the remaining time.
      if (lockedUntil > now) {
        return { locked: true, retryAfterMs: lockedUntil - now };
      }

      const failures = (typeof data?.failures === "number" ? data.failures : 0) + 1;
      const nowLocked = failures >= LOCKOUT_MAX_FAILURES;
      tx.set(ref, {
        failures: nowLocked ? 0 : failures,
        lockedUntil: nowLocked ? now + LOCKOUT_COOLDOWN_MS : 0,
        expiresAt: new Date(now + DOC_TTL_MS).toISOString(),
      });
      return nowLocked
        ? { locked: true, retryAfterMs: LOCKOUT_COOLDOWN_MS }
        : { locked: false, attemptsRemaining: LOCKOUT_MAX_FAILURES - failures };
    });
  } catch {
    return { locked: false, attemptsRemaining: LOCKOUT_MAX_FAILURES };
  }
}

/**
 * Clear all lockout state for a username — called on a successful login, on an admin "unlock"
 * action, and on an admin password reset (all mean "let this account back in now"). Fail-open.
 */
export async function clearLockout(usernameLower: string): Promise<void> {
  try {
    const db = getFirestore();
    await db.collection(COLLECTION).doc(docIdFor(usernameLower)).delete();
  } catch {
    /* fail-open: nothing to do */
  }
}
