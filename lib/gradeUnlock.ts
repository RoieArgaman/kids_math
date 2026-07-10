import type { Subject } from "@/lib/subjects";

/**
 * Grade-B unlock cookies (server enforcement, read by `middleware.ts`).
 *
 * EDGE-SAFE: this module is imported by the edge middleware, so it must NOT import
 * storage / localStorage / any Node-only API. It only exposes cookie names + a type.
 *
 * Each subject carries its OWN cross-grade prerequisite, so grade-B access is granted
 * per subject via a dedicated cookie: `kids_math.unlocked.b.${subject}`.
 */
export const GRADE_B_UNLOCK_COOKIE_VALUE = "1";

/**
 * Legacy single cookie from the math-only design. Still recognized as the MATH
 * grade-B unlock so returning users who already earned math-B keep their access.
 */
export const MATH_B_LEGACY_COOKIE = "kids_math.unlocked_grade_b";

/**
 * @deprecated Back-compat alias for {@link MATH_B_LEGACY_COOKIE}. Prefer
 * {@link subjectGradeBUnlockCookieName} in new code.
 */
export const GRADE_B_UNLOCK_COOKIE_NAME = MATH_B_LEGACY_COOKIE;

/** Per-subject grade-B unlock cookie name, e.g. `kids_math.unlocked.b.english`. */
export function subjectGradeBUnlockCookieName(subject: Subject): string {
  return `kids_math.unlocked.b.${subject}`;
}
