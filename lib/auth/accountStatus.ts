/**
 * Account lifecycle status. Soft delete: a "deleted" account is retained and restorable.
 *
 * Pre-Phase-3 user docs have no `status` field and there is no backfill, so absent MUST read as
 * active — otherwise every existing learner is locked out at once.
 */

export type AccountStatus = "active" | "deactivated" | "deleted";

export const ACCOUNT_STATUS_FIELD = "status";

/**
 * Absent ⇒ active (pre-feature docs). Any unrecognized explicit value ⇒ non-active: it can only
 * arrive by a deliberate write, and every plausible future status ("suspended") is more
 * restrictive than active, so failing closed is the safe direction here — unlike the fail-open
 * stance in rateLimit/accountLockout.
 */
export function readAccountStatus(raw: unknown): AccountStatus {
  if (raw === undefined || raw === null || raw === "active") return "active";
  if (raw === "deleted") return "deleted";
  return "deactivated";
}

/** Both non-active states are refused identically — distinguishing them would leak account state. */
export function canAuthenticate(status: AccountStatus): boolean {
  return status === "active";
}

/**
 * Never express this as a Firestore query predicate: equality AND inequality filters both exclude
 * docs missing the field, so `where("status","==","active")` matches zero pre-feature users.
 */
export function isDocActive(data: Record<string, unknown> | undefined): boolean {
  return canAuthenticate(readAccountStatus(data?.[ACCOUNT_STATUS_FIELD]));
}
