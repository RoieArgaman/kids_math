import { readAccountStatus, ACCOUNT_STATUS_FIELD, type AccountStatus } from "@/lib/auth/accountStatus";

/**
 * Guardian data export (roadmap Phase 3.2).
 *
 * ADMIN-OPERATED: a guardian asks, an admin fulfils. This module is the pure projection layer —
 * it never touches Firestore, so it can be unit-tested exhaustively and reused by any future
 * caller (CLI, scheduled job) without a database.
 *
 * SECURITY — EXPLICIT ALLOW-LIST: every exported field is copied across BY NAME. We deliberately
 * do NOT spread the raw user doc and delete the sensitive keys: a spread-and-delete projection
 * silently starts leaking the moment someone adds a new secret field to the user doc. With the
 * allow-list below it is structurally impossible for `passwordHash` (or `tokenVersion`, or
 * `usernameLower`) to reach the response, whatever the doc grows into.
 *
 * The progress bundle is the child's OWN learner data and is exported whole — it is the point of
 * the export, and it never carries credentials.
 */

/** A read-only view of a Firestore doc, shaped like a snapshot but with no SDK dependency. */
export interface RawDoc {
  readonly id: string;
  readonly data: Readonly<Record<string, unknown>> | undefined;
}

/** The learner's synced progress bundle, passed through verbatim. */
export type ProgressBundleExport = Readonly<Record<string, unknown>>;

export interface UserExport {
  userId: string;
  username: string;
  role: "admin" | "user";
  /** ISO string as stored; empty when a pre-Phase-1 doc has none. */
  createdAt: string;
  /** Absent on pre-Phase-3 docs, which must read as active. */
  status: AccountStatus;
  /** null when the learner has never synced. */
  progress: ProgressBundleExport | null;
}

function asString(value: unknown): string {
  return typeof value === "string" ? value : "";
}

/**
 * Project one user doc + their progress doc into the export payload.
 *
 * @param userDoc     the `users/{id}` doc (missing `data` yields empty scalars — callers 404 first)
 * @param progressDoc the `user_progress/{id}` doc, or null when it was never created
 */
export function buildUserExport(userDoc: RawDoc, progressDoc: RawDoc | null): UserExport {
  const user = userDoc.data ?? {};
  const progress = progressDoc?.data;

  return {
    userId: userDoc.id,
    username: asString(user.username),
    role: user.role === "admin" ? "admin" : "user",
    createdAt: asString(user.createdAt),
    status: readAccountStatus(user[ACCOUNT_STATUS_FIELD]),
    // Copied by reference, not merged: no field of the user doc can bleed into it.
    progress: progress ? { ...progress } : null,
  };
}

/** Content-Disposition filename. Ids are Firestore-generated, but sanitize anyway — it's a header. */
export function exportFileName(userId: string, now: Date): string {
  const safeId = userId.replace(/[^A-Za-z0-9_-]/g, "") || "user";
  return `kids-math-export-${safeId}-${now.toISOString().slice(0, 10)}.json`;
}
