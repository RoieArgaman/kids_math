import { getTodayDate } from "@/lib/streak/engine";
import { SUBJECTS, type Subject } from "@/lib/subjects";
import type { DayId } from "@/lib/types";

/**
 * Freemium access gating (Phase 5) — an anonymous (logged-out) visitor may open
 * ONE workbook day, in ONE subject, per calendar day. Opening the same day again
 * is always allowed (so they can finish it); opening any other day or any other
 * subject while logged out is blocked until the local date rolls over.
 *
 * This is a SOFT CONVERSION NUDGE, not DRM. It lives in its own anon-only
 * localStorage key — never in any lib/<domain>/storage.ts progress schema, never synced
 * to the server, and deliberately EXCLUDED from `clearLocalProgress()`'s allow-list
 * so a login→logout cycle restores (not resets) the cap. Non-bypassable metering
 * would need a server-side per-account entitlement layer (depends on accounts).
 */
export const ANON_DAILY_USAGE_KEY = "kids_math.anon.dailyUsage.v1";

/** The single free slot an anonymous visitor has claimed for one local day. */
export type AnonDailyUsage = {
  /** Local calendar day (`YYYY-MM-DD`) the slot belongs to, per `getTodayDate()`. */
  date: string;
  subject: Subject;
  dayId: DayId;
};

function isValidUsage(value: unknown): value is AnonDailyUsage {
  if (typeof value !== "object" || value === null) return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v.date === "string" &&
    typeof v.subject === "string" &&
    (SUBJECTS as readonly string[]).includes(v.subject) &&
    typeof v.dayId === "string"
  );
}

/**
 * Read today's claimed slot, or `null` if none/invalid. Any parse or shape failure
 * returns `null` (fail-open to "no slot claimed" → allowed) — a corrupt value must
 * never lock a child out.
 */
export function readAnonDailyUsage(): AnonDailyUsage | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(ANON_DAILY_USAGE_KEY);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    return isValidUsage(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

/**
 * Claim today's slot for `(subject, dayId)` — first open wins. A no-op if a valid
 * slot already exists for `today` (so re-opening the same day never overwrites, and
 * StrictMode double-invocation is safe). Only ever CALL this for an allowed anon
 * visitor; logged-in users are never metered.
 */
export function claimAnonDaySlot(
  subject: Subject,
  dayId: DayId,
  today: string = getTodayDate(),
): void {
  if (typeof window === "undefined") return;
  const existing = readAnonDailyUsage();
  if (existing && existing.date === today) return;
  try {
    window.localStorage.setItem(
      ANON_DAILY_USAGE_KEY,
      JSON.stringify({ date: today, subject, dayId } satisfies AnonDailyUsage),
    );
  } catch {
    // ignore — a storage failure fails open (visitor stays allowed)
  }
}

/**
 * Whether an anonymous visitor is blocked from opening `(subject, dayId)` right now.
 * Blocked iff a slot exists for `today` AND it is for a DIFFERENT day or subject.
 * A missing slot, or a stale slot from an earlier day, is treated as free.
 */
export function isBlockedByAnonDailyLimit(
  subject: Subject,
  dayId: DayId,
  today: string = getTodayDate(),
): boolean {
  const usage = readAnonDailyUsage();
  if (!usage || usage.date !== today) return false;
  return usage.subject !== subject || usage.dayId !== dayId;
}

/**
 * Clear the slot. Exposed for tests only — it is intentionally NOT wired to
 * login/logout: clearing on login would let a login→logout cycle mint a fresh free
 * day (the lock's own CTA is "log in"), so the slot's lifetime is purely date-based.
 */
export function clearAnonDailyUsage(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(ANON_DAILY_USAGE_KEY);
  } catch {
    // ignore
  }
}
