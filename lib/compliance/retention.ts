/**
 * Data-retention SELECTION (roadmap Phase 3.3).
 *
 * This module answers exactly one question: "given a snapshot of user docs and a policy, which
 * accounts WOULD be soft-deleted right now?". It is deliberately a PURE function — no clock read,
 * no Firestore, no I/O — because retention is the one place where a bug silently destroys learner
 * data. Purity means the whole decision surface is reachable from unit tests with a fixed `now`,
 * so the boundary cases below are proven rather than assumed.
 *
 * NO DELETION LIVES HERE. Selection and execution are split on purpose: `scripts/retention-dry-run.mjs`
 * only prints this function's output. Nothing in the repo can currently act on it.
 *
 * SOFT DELETE ONLY: the project has no hard-delete path, so "selected" means "would be flagged
 * `status: "deleted"`", never "would be erased". Learner progress in Firestore/localStorage must
 * survive (see AGENTS.md → Data & Storage Rules).
 *
 * AGE PROXY: user docs carry `createdAt` but no `lastLoginAt` yet, so account age is the only
 * signal available. `policy.inactiveDays` is therefore measured from account creation. When a
 * last-activity timestamp lands, extend {@link RetentionUser} rather than reinterpreting `createdAt`.
 */

/**
 * Account lifecycle state. ABSENT means ACTIVE — legacy docs predate this field and must not be
 * treated as an unknown/quarantined state (that would either skip real candidates or, worse,
 * select accounts we know nothing about).
 */

/** A user doc as read from Firestore. Every field but `userId` is optional — legacy docs vary. */
import { readAccountStatus, type AccountStatus } from "@/lib/auth/accountStatus";

export interface RetentionUser {
  userId: string;
  /** ISO-8601 creation timestamp. Absent on the oldest docs. */
  createdAt?: string;
  role?: string;
  status?: AccountStatus | string;
}

export interface RetentionPolicy {
  /** Age (in days) at which an account becomes eligible for soft delete. */
  inactiveDays: number;
}

/** Why an account was NOT selected — kept explicit so the dry-run report can explain itself. */
export type RetentionSkipReason =
  | "admin"
  | "already-deleted"
  | "missing-created-at"
  | "invalid-created-at"
  | "within-retention";

export type RetentionDecision =
  | { kind: "select"; userId: string; ageDays: number }
  | { kind: "skip"; userId: string; reason: RetentionSkipReason; ageDays?: number };

const MS_PER_DAY = 24 * 60 * 60 * 1000;

/**
 * BOUNDARY: `>=`. An account is selected once its age REACHES `inactiveDays` — age exactly equal
 * to the policy window is IN. Rationale: the policy reads "keep data for N days"; on day N the
 * promised retention period has fully elapsed, so holding the data longer is the surprising
 * behaviour, not deleting it. `>` would silently retain every account for N+1 days and make the
 * policy number a lie. Tested exactly at the boundary (and one ms either side).
 */
function decide(user: RetentionUser, now: number, policy: RetentionPolicy): RetentionDecision {
  // Admins first: an admin is never a retention candidate regardless of age or status, and this
  // ordering means an admin doc can't be classified by some other reason and lose that guarantee.
  if (user.role === "admin") return { kind: "skip", userId: user.userId, reason: "admin" };

  // Already soft-deleted — selecting it again would churn writes and re-fire any future audit row.
  if (readAccountStatus(user.status) === "deleted") {
    return { kind: "skip", userId: user.userId, reason: "already-deleted" };
  }

  if (user.createdAt === undefined) {
    return { kind: "skip", userId: user.userId, reason: "missing-created-at" };
  }

  const createdMs = Date.parse(user.createdAt);
  // FAIL-CLOSED on garbage: an unparseable date yields NaN, and every NaN comparison is false.
  // We check it explicitly rather than leaning on that, so the intent survives a refactor —
  // "cannot prove the account is old" must always mean "leave it alone".
  if (Number.isNaN(createdMs)) {
    return { kind: "skip", userId: user.userId, reason: "invalid-created-at" };
  }

  // Clock skew / future-dated docs land here with a negative age and fall through to
  // "within-retention", which is the safe side.
  const ageDays = (now - createdMs) / MS_PER_DAY;
  if (ageDays >= policy.inactiveDays) {
    return { kind: "select", userId: user.userId, ageDays };
  }
  return { kind: "skip", userId: user.userId, reason: "within-retention", ageDays };
}

/**
 * Classify every user. Returns one decision per input, in input order — the dry-run reporter uses
 * the skips to show its work ("why was this account spared?"), which is the whole point of a
 * dry run.
 */
export function evaluateAccounts(
  users: readonly RetentionUser[],
  now: number,
  policy: RetentionPolicy,
): RetentionDecision[] {
  return users.map((user) => decide(user, now, policy));
}

/**
 * The accounts that WOULD be soft-deleted. Pure: `now` is passed in, never read from the clock.
 *
 * `deactivated` accounts ARE eligible — deactivation is not deletion, and an account parked in
 * that state still ages out under the policy.
 */
export function selectExpiredAccounts(
  users: readonly RetentionUser[],
  now: number,
  policy: RetentionPolicy,
): RetentionUser[] {
  // Index-matched against `evaluateAccounts` (one decision per input, same order) rather than
  // matched by userId — duplicate ids in a snapshot would otherwise select the same doc twice.
  const decisions = evaluateAccounts(users, now, policy);
  return users.filter((_user, index) => decisions[index]?.kind === "select");
}
