import { createHash } from "node:crypto";
import { NextResponse } from "next/server";
import { getFirestore } from "@/lib/firestore/admin";

/**
 * Shared-state rate limiter (roadmap S1 / Phase 0.1 shadow → Phase 2.7 enforce).
 *
 * App Hosting is multi-instance with `minInstances: 0`, so any in-memory counter is
 * per-instance and bypassable/lost on cold start. State therefore lives in Firestore:
 * one `rate_limits/{hash(key)}` doc holding a fixed-window `{ count, windowStart, expiresAt }`,
 * updated in a transaction so concurrent requests serialize.
 *
 * STAGED ENFORCEMENT (Phase 2.7): {@link enforceRateLimit} always *records* an over-threshold
 * hit (so dashboards keep seeing the signal), and only *blocks* when {@link isRateLimitEnforced}
 * is true — i.e. the `RATE_LIMIT_ENFORCE=1` env flag is set. It ships **off** (shadow) exactly
 * like the body-cap (`PROGRESS_BODY_CAP_ENFORCE`) and staged HSTS: enforcement is flipped on only
 * AFTER the dashboards confirm thresholds don't false-positive shared classroom IPs and after
 * `TRUSTED_PROXY_HOPS` is verified against real `X-Forwarded-For` logs (roadmap Appendix A). The
 * limiter is FAIL-OPEN: any Firestore error resolves to `allowed`, because a limiter must never
 * take the site down.
 *
 * TTL: each doc carries `expiresAt` (window end). A Firestore TTL policy on `rate_limits.expiresAt`
 * prunes stale docs so a flood of distinct keys can't grow the collection unbounded — the policy
 * itself is an owner/console action (see OBSERVABILITY_RUNBOOK.md).
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
  /** Milliseconds until the current window ends (0 when the check failed open). */
  retryAfterMs: number;
}

export interface RateLimitDecision extends RateLimitResult {
  /** True only when the request is over threshold AND enforcement is enabled ⇒ caller must 429. */
  blocked: boolean;
}

/** Firestore doc ids must not contain "/" and shouldn't leak raw keys (which embed IPs/usernames). */
function docIdFor(key: string): string {
  return createHash("sha256").update(key).digest("hex");
}

/** Whether the limiter blocks (429) or only records. Read per-request so ops can toggle via env. */
export function isRateLimitEnforced(): boolean {
  return process.env.RATE_LIMIT_ENFORCE === "1";
}

/**
 * Increment the fixed-window counter for `key` and report whether it is within `limit`.
 * Never throws — returns `{ allowed: true, count: 0, retryAfterMs: 0 }` on any backend error
 * (fail-open).
 */
export async function checkRateLimit(
  key: string,
  { limit, windowMs }: RateLimitOptions,
): Promise<RateLimitResult> {
  try {
    const db = getFirestore();
    const ref = db.collection(COLLECTION).doc(docIdFor(key));
    const now = Date.now();

    const { count, windowStart } = await db.runTransaction(async (tx) => {
      const snap = await tx.get(ref);
      const data = snap.exists ? (snap.data() as { count?: number; windowStart?: number }) : null;
      const prevWindowStart = typeof data?.windowStart === "number" ? data.windowStart : 0;
      const prevCount = typeof data?.count === "number" ? data.count : 0;

      // Start a fresh window when none exists or the current one has elapsed.
      const inWindow = data !== null && now - prevWindowStart < windowMs;
      const nextCount = inWindow ? prevCount + 1 : 1;
      const nextWindowStart = inWindow ? prevWindowStart : now;
      tx.set(ref, {
        count: nextCount,
        windowStart: nextWindowStart,
        // TTL field: window end. A Firestore TTL policy on `expiresAt` prunes stale docs.
        expiresAt: new Date(nextWindowStart + windowMs).toISOString(),
      });
      return { count: nextCount, windowStart: nextWindowStart };
    });

    return {
      allowed: count <= limit,
      count,
      limit,
      key,
      retryAfterMs: Math.max(0, windowStart + windowMs - now),
    };
  } catch {
    // Fail open: never let the limiter break the request it is measuring.
    return { allowed: true, count: 0, limit, key, retryAfterMs: 0 };
  }
}

/**
 * Staged limiter entry point: run {@link checkRateLimit}, record an over-threshold hit (so the
 * observability dashboards see the signal even before enforcement), and report whether the caller
 * must block. `blocked` is true ONLY when over threshold AND {@link isRateLimitEnforced}. When the
 * flag is off this is behaviourally identical to the old shadow limiter (records, never blocks).
 */
export async function enforceRateLimit(
  key: string,
  options: RateLimitOptions,
): Promise<RateLimitDecision> {
  const result = await checkRateLimit(key, options);
  const enforcing = isRateLimitEnforced();
  if (!result.allowed) {
    // eslint-disable-next-line no-console -- interim recording channel until Phase 2 dashboards use structured logs.
    console.warn(
      `[rate-limit:${enforcing ? "enforce" : "shadow"}] over-threshold key=${result.key} count=${result.count} limit=${result.limit}`,
    );
  }
  return { ...result, blocked: !result.allowed && enforcing };
}

/** Shared 429 for a blocked request: JSON body + `Retry-After` header (seconds). */
export function rateLimitedResponse(retryAfterMs: number): NextResponse {
  const retryAfterSeconds = Math.max(1, Math.ceil(retryAfterMs / 1000));
  return NextResponse.json(
    { error: "rate_limited", retryAfterSeconds },
    { status: 429, headers: { "Retry-After": String(retryAfterSeconds) } },
  );
}
