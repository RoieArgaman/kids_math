import { createHash } from "node:crypto";
import { getFirestore } from "@/lib/firestore/admin";

/**
 * Shared-state rate limiter (roadmap S1 / Phase 0.1) — SHADOW MODE.
 *
 * App Hosting is multi-instance with `minInstances: 0`, so any in-memory counter is
 * per-instance and bypassable/lost on cold start. State therefore lives in Firestore:
 * one `rate_limits/{hash(key)}` doc holding a fixed-window `{ count, windowStart }`,
 * updated in a transaction so concurrent requests serialize.
 *
 * In Phase 0 this only *records* would-be-throttled requests — it never blocks. Callers
 * use {@link recordRateLimit}, which logs an over-threshold hit and otherwise does
 * nothing. Promotion to enforcing 429s happens in roadmap Phase 2.7 once dashboards tune
 * the thresholds. The limiter is FAIL-OPEN: any Firestore error resolves to `allowed`,
 * because a limiter must never take the site down.
 *
 * NOTE (before Phase 2.7 enforcing): each distinct key writes one `rate_limits` doc and
 * nothing prunes them, so a flood of distinct keys (e.g. credential stuffing across many
 * usernames) grows the collection unbounded. Add a Firestore TTL policy on a per-doc
 * `expiresAt` field (or a scheduled cleanup) when this graduates from shadow mode.
 */

const COLLECTION = "rate_limits";

export interface RateLimitOptions {
  /** Max requests permitted within the window before a request is flagged. */
  limit: number;
  /** Fixed-window length in milliseconds. */
  windowMs: number;
}

export interface RateLimitResult {
  /** False only when the count within the current window exceeds `limit`. */
  allowed: boolean;
  /** Count within the current window (0 when the check failed open). */
  count: number;
  limit: number;
  key: string;
}

/** Firestore doc ids must not contain "/" and shouldn't leak raw keys (which embed IPs/usernames). */
function docIdFor(key: string): string {
  return createHash("sha256").update(key).digest("hex");
}

/**
 * Increment the fixed-window counter for `key` and report whether it is within `limit`.
 * Never throws — returns `{ allowed: true, count: 0 }` on any backend error (fail-open).
 */
export async function checkRateLimit(
  key: string,
  { limit, windowMs }: RateLimitOptions,
): Promise<RateLimitResult> {
  try {
    const db = getFirestore();
    const ref = db.collection(COLLECTION).doc(docIdFor(key));
    const now = Date.now();

    const count = await db.runTransaction(async (tx) => {
      const snap = await tx.get(ref);
      const data = snap.exists ? (snap.data() as { count?: number; windowStart?: number }) : null;
      const windowStart = typeof data?.windowStart === "number" ? data.windowStart : 0;
      const prevCount = typeof data?.count === "number" ? data.count : 0;

      // Start a fresh window when none exists or the current one has elapsed.
      const inWindow = data !== null && now - windowStart < windowMs;
      const nextCount = inWindow ? prevCount + 1 : 1;
      const nextWindowStart = inWindow ? windowStart : now;
      tx.set(ref, { count: nextCount, windowStart: nextWindowStart });
      return nextCount;
    });

    return { allowed: count <= limit, count, limit, key };
  } catch {
    // Fail open: never let the limiter break the request it is measuring.
    return { allowed: true, count: 0, limit, key };
  }
}

/**
 * Shadow-mode entry point: run {@link checkRateLimit} and, when the key is over
 * threshold, emit a structured record. Does NOT block. Real observability is Phase 2;
 * `console.warn` is the interim recording channel.
 */
export async function recordRateLimit(key: string, options: RateLimitOptions): Promise<void> {
  const result = await checkRateLimit(key, options);
  if (!result.allowed) {
    // eslint-disable-next-line no-console -- shadow-mode recording until Phase 2 observability lands.
    console.warn(
      `[rate-limit:shadow] over-threshold key=${result.key} count=${result.count} limit=${result.limit}`,
    );
  }
}
