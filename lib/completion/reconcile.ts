import { SUBJECTS, type Subject } from "@/lib/subjects";
import { isSubjectGradeComplete } from "@/lib/completion/subjectGrade";

/**
 * Cookie ↔ localStorage reconciliation (resolves plan review HIGH-1).
 *
 * Two sources of truth exist: the unlock COOKIES (server enforcement, read by
 * middleware — httpOnly, so the client cannot read them) and localStorage
 * COMPLETION (client UI). They can desync (user clears cookies but keeps
 * progress, restores a backup, or an unlock POST failed).
 *
 * Rule: localStorage completion is authoritative; the cookie is a derived cache.
 *
 * UNLOCK-ONLY (deliberate, per user decision): when a subject's grade A is
 * complete we (re)POST the unlock so the server gate self-heals a lost cookie —
 * but we NEVER auto-revoke here. Curriculum can grow (new grade-A lessons ship),
 * which would transiently make a previously-complete subject read "incomplete";
 * auto-locking would strip earned access from existing users. Revocation happens
 * only via the explicit admin-reset cascade.
 *
 * The unlock POST is httpOnly so it can't be observed client-side; a sessionStorage
 * guard keeps it to one POST per subject per session while still re-healing on a
 * fresh session after a cookie clear. `previewAll` bypasses gates → nothing to do.
 */

const RECONCILE_GUARD_PREFIX = "kids_math.reconciled.b.";

async function ensureSubjectUnlocked(subject: Subject): Promise<void> {
  const guardKey = `${RECONCILE_GUARD_PREFIX}${subject}`;
  try {
    if (window.sessionStorage.getItem(guardKey) === "1") return;
  } catch {
    /* sessionStorage unavailable (private mode) — fall through and POST */
  }
  try {
    const res = await fetch("/api/grade-b-unlock", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ subject }),
    });
    if (res.ok) {
      try {
        window.sessionStorage.setItem(guardKey, "1");
      } catch {
        /* ignore — worst case we re-POST next mount (idempotent) */
      }
    }
  } catch {
    /* offline / network error — retried on next mount */
  }
}

/**
 * Clear the once-per-session unlock-reconcile guards. Called on logout so the
 * NEXT student on this device (or this student's next login) re-evaluates unlock
 * from their OWN hydrated completion instead of skipping the POST because a prior
 * student already set the guard — otherwise a returning student who completed
 * grade A could be left wrongly locked.
 */
export function clearReconcileGuards(): void {
  if (typeof window === "undefined") return;
  for (const subject of SUBJECTS) {
    try {
      window.sessionStorage.removeItem(`${RECONCILE_GUARD_PREFIX}${subject}`);
    } catch {
      // sessionStorage unavailable — nothing to clear.
    }
  }
}

export async function reconcileGradeUnlockCookies(opts?: { previewAll?: boolean }): Promise<void> {
  if (typeof window === "undefined") return;
  if (opts?.previewAll) return;
  await Promise.all(
    SUBJECTS.filter((subject) => isSubjectGradeComplete(subject, "a")).map(ensureSubjectUnlocked),
  );
}
