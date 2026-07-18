/**
 * ============================================================================
 *  RETENTION DRY RUN — READ-ONLY BY CONSTRUCTION. DELETION IS NOT IMPLEMENTED.
 * ============================================================================
 *
 * This script READS the `users` collection and PRINTS which accounts the Phase 3.3 retention
 * policy WOULD select for soft delete. It performs no write, update, or delete of any kind, and
 * that omission is DELIBERATE — not an unfinished TODO.
 *
 * Do NOT add a `--execute` flag, a write call, or a cron/scheduler entry pointing at this file.
 * Acting on retention needs its own roadmap item with an approved rollback and audit trail
 * (see lib/observability/auditLog.ts). A script that both selects and deletes is one bad flag
 * away from erasing learner data, so the two halves stay separated: selection lives in the pure
 * module lib/compliance/retention.ts, and this file only reports.
 *
 * Usage:
 *   node --env-file=.env.local scripts/retention-dry-run.mjs [--days 365] [--verbose]
 *
 * Requires .env.local with FIRESTORE_CREDENTIALS_JSON set (same bootstrap as create-user.mjs).
 * Exit code is 0 whenever the report renders — "found candidates" is information, not failure.
 */

import { initializeApp, getApps, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

/**
 * Default retention window. Intentionally generous: a child can be away for a full school year
 * (summer break + a repeated grade) and still come back to their progress.
 */
const DEFAULT_INACTIVE_DAYS = 365;

/**
 * The selection rules are duplicated here rather than imported, because this is a plain .mjs
 * script and lib/compliance/retention.ts is TypeScript behind the `@/` alias (no build step in
 * the script path). KEEP IN SYNC with that module — it is the source of truth and the only
 * version that is unit-tested. Boundary is `>=` there and here.
 */
function decide(user, now, inactiveDays) {
  if (user.role === "admin") return { kind: "skip", reason: "admin" };
  if (user.status === "deleted") return { kind: "skip", reason: "already-deleted" };
  if (user.createdAt === undefined || user.createdAt === null) {
    return { kind: "skip", reason: "missing-created-at" };
  }
  const createdMs = Date.parse(user.createdAt);
  if (Number.isNaN(createdMs)) return { kind: "skip", reason: "invalid-created-at" };
  const ageDays = (now - createdMs) / (24 * 60 * 60 * 1000);
  if (ageDays >= inactiveDays) return { kind: "select", ageDays };
  return { kind: "skip", reason: "within-retention", ageDays };
}

function parseArgs(argv) {
  const args = { days: DEFAULT_INACTIVE_DAYS, verbose: false };
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === "--days" && argv[i + 1]) args.days = Number(argv[++i]);
    else if (argv[i] === "--verbose") args.verbose = true;
  }
  return args;
}

function initFirebase() {
  if (getApps().length > 0) return;
  const raw = process.env.FIRESTORE_CREDENTIALS_JSON;
  if (!raw) {
    console.error("❌  FIRESTORE_CREDENTIALS_JSON is not set in .env.local");
    process.exit(1);
  }
  try {
    initializeApp({ credential: cert(JSON.parse(raw)) });
  } catch {
    console.error("❌  Failed to parse FIRESTORE_CREDENTIALS_JSON — check it is valid JSON");
    process.exit(1);
  }
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (!Number.isFinite(args.days) || args.days <= 0) {
    console.error("❌  --days must be a positive number");
    process.exit(1);
  }

  initFirebase();
  const db = getFirestore();

  // Read-only: .get() on the collection. No .set/.update/.delete anywhere in this file.
  const snap = await db.collection("users").get();
  const now = Date.now();

  const selected = [];
  const skipCounts = new Map();
  const skipped = [];

  snap.forEach((doc) => {
    const data = doc.data();
    const user = {
      userId: doc.id,
      createdAt: data.createdAt,
      role: data.role,
      status: data.status,
    };
    const decision = decide(user, now, args.days);
    if (decision.kind === "select") {
      selected.push({ ...user, ageDays: decision.ageDays });
    } else {
      skipCounts.set(decision.reason, (skipCounts.get(decision.reason) ?? 0) + 1);
      skipped.push({ ...user, reason: decision.reason });
    }
  });

  console.log("");
  console.log("=== RETENTION DRY RUN (read-only — nothing was modified) ===");
  console.log(`   policy:   inactiveDays=${args.days} (boundary: age >= inactiveDays)`);
  console.log(`   scanned:  ${snap.size} user doc(s)`);
  console.log(`   WOULD soft-delete: ${selected.length}`);
  console.log("");

  if (selected.length > 0) {
    console.log("--- Candidates (status would be set to \"deleted\" — NOT done by this script) ---");
    for (const user of selected) {
      const status = user.status ?? "active (implicit)";
      console.log(`   ${user.userId}  age=${user.ageDays.toFixed(1)}d  status=${status}`);
    }
    console.log("");
  }

  console.log("--- Skipped ---");
  for (const [reason, count] of [...skipCounts].sort((a, b) => b[1] - a[1])) {
    console.log(`   ${reason.padEnd(20)} ${count}`);
  }
  if (args.verbose) {
    console.log("");
    for (const user of skipped) {
      console.log(`   ${user.userId}  ${user.reason}`);
    }
  }
  console.log("");
  console.log("No deletion path exists. To act on this report, an admin must do so deliberately.");
}

main().catch((err) => {
  console.error("❌  Unexpected error:", err);
  process.exit(1);
});
