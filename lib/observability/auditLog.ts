import { getFirestore } from "@/lib/firestore/admin";

/**
 * Admin audit log (roadmap S9 / Phase 2.2 — Observability).
 *
 * Append-only trail of admin mutations on the user-management surface. Each admin action
 * (create / reset / delete / unlock) writes ONE immutable row to the `audit_log` Firestore
 * collection so a human can later answer "who changed this account, and when".
 *
 * BEST-EFFORT / FAIL-SAFE: mirrors the fail-open philosophy of {@link ../security/accountLockout}.
 * The whole write is wrapped in try/catch and swallows any error — an audit-write failure must
 * NEVER throw or reject, because that would break the primary admin mutation that called it.
 * A missing audit row is acceptable; a broken admin action is not.
 *
 * SECURITY: never store secrets. `meta` must not carry passwords, hashes, tokens, or cookies —
 * it is the caller's responsibility to pass only safe fields (e.g. `{ role: "user" }`,
 * `{ overridePolicy: true }`).
 */

export type AuditAction =
  | "user.create"
  | "user.reset"
  // Lifecycle transitions. `user.delete` is a SOFT delete since Phase 3 — the doc is retained
  // and `user.restore` reverses it. True erasure is a separate Phase 4 action.
  | "user.delete"
  | "user.deactivate"
  | "user.restore"
  | "user.unlock"
  // Phase 3.2 — admin-operated guardian data export. Not a mutation, but the response egresses a
  // child's full record, so every fulfilment leaves a row naming the actor and the subject.
  | "user.export";

export interface AuditEntry {
  /** The admin performing the action. */
  actorId: string;
  action: AuditAction;
  /** The affected user id. */
  targetId?: string;
  /** Small, non-sensitive context, e.g. `{ overridePolicy: true, role: "user" }`. NEVER passwords/hashes/tokens. */
  meta?: Record<string, unknown>;
}

const COLLECTION = "audit_log";

/**
 * Write one append-only audit row. Best-effort: resolves normally even on failure.
 * Prefers explicit `null`/`{}` over `undefined` for stored fields.
 */
export async function writeAuditLog(entry: AuditEntry): Promise<void> {
  try {
    await getFirestore()
      .collection(COLLECTION)
      .add({
        actorId: entry.actorId,
        action: entry.action,
        targetId: entry.targetId ?? null,
        meta: entry.meta ?? {},
        at: new Date().toISOString(),
      });
  } catch {
    /* fail-safe: an audit-write failure must never break the primary admin mutation */
  }
}
