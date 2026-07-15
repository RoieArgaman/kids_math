/**
 * Password strength policy (roadmap Phase 1 / 1.2).
 *
 * Applied when an admin CREATES or RESETS an account password. Deliberately modest: the goal
 * is to stop trivially-guessable passwords, not to force complexity that a 6-year-old can't
 * type. Admins can bypass it entirely with `overridePolicy` (see the admin route) to set a
 * simple/PIN password for a young child — the policy is the default guardrail, the override is
 * the explicit opt-out. An empty password is ALWAYS rejected, even under override.
 */

export const PASSWORD_MIN_LENGTH = 6;

export interface PasswordCheck {
  ok: boolean;
  /** Machine-readable reason when `ok` is false. */
  reason?: "empty" | "too_short" | "too_common";
}

// A tiny deny-list of the most trivially-guessable passwords. Not exhaustive — the length
// rule does most of the work; this just blocks the obvious ones.
const COMMON = new Set([
  "123456",
  "1234567",
  "12345678",
  "password",
  "qwerty",
  "111111",
  "abc123",
  "000000",
]);

/**
 * Validate a password against the policy. When `override` is true, only the empty check runs
 * (admin escape hatch for kid-friendly simple passwords).
 */
export function validatePasswordStrength(password: string, override = false): PasswordCheck {
  if (!password) return { ok: false, reason: "empty" };
  if (override) return { ok: true };
  if (password.length < PASSWORD_MIN_LENGTH) return { ok: false, reason: "too_short" };
  if (COMMON.has(password.toLowerCase())) return { ok: false, reason: "too_common" };
  return { ok: true };
}
