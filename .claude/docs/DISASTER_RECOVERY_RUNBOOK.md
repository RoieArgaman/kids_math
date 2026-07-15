# Disaster Recovery Runbook — kids_math (Phase 2.5)

> **Status:** Runbook for roadmap Production Hardening **Phase 2.5** (finding **C8**).
> **Scope:** Firestore point-in-time recovery (PITR), scheduled backups, RPO/RTO targets,
> and a **tested restore procedure** — the buyer due-diligence "can you recover from data
> loss?" item.
> **Audience:** project owner / on-call. The enable + drill steps are **GCP console / gcloud
> actions** (owner) — this doc specifies exactly what to run and how to verify.
> **What's protected:** all Firestore collections — `users`, `user_progress`, `audit_log`,
> `account_lockouts`, `rate_limits`. (Learner localStorage lives on-device and is synced up to
> `user_progress`; it is covered transitively.)

---

## Why this exists

There is currently **no backup / PITR** on the Firestore database and **no restore procedure**
(finding C8). A dropped collection, a bad migration, or an accidental mass delete would be
unrecoverable. A corporate buyer's technical due diligence will ask for RPO/RTO and evidence of
a tested restore. This runbook establishes both.

---

## Targets — RPO / RTO

| Term | Definition | Target |
|------|------------|--------|
| **RPO** (Recovery Point Objective) | Max acceptable data loss, measured in time | **≤ 1 hour** via PITR (Firestore PITR gives ~1-minute granularity for the last 7 days) |
| **RTO** (Recovery Time Objective) | Max acceptable time to restore service | **≤ 4 hours** (restore to a recovery database + repoint the app) |

PITR covers the **last 7 days** at fine granularity. Scheduled **backups** cover the
longer-retention / "the 7-day window has passed" case. Both are enabled below.

---

## Step 1 — Enable PITR  ·  OWNER (gcloud/console)  ·  C8

PITR retains a rolling 7-day history so you can read the database as of any minute in that
window.

```bash
# Enable PITR on the (default) Firestore database in the production project.
gcloud firestore databases update \
  --database="(default)" \
  --project=kids-learing-hub \
  --enable-pitr
```

Verify:
```bash
gcloud firestore databases describe --database="(default)" --project=kids-learing-hub \
  --format="value(pointInTimeRecoveryEnablement)"
# expect: POINT_IN_TIME_RECOVERY_ENABLED
```

## Step 2 — Enable scheduled backups  ·  OWNER  ·  C8

Backups cover retention beyond the 7-day PITR window.

```bash
# Daily backups, retained 14 days (tune retention to your compliance/retention policy — see
# Phase 3). weekly schedules are also available.
gcloud firestore backups schedules create \
  --database="(default)" \
  --project=kids-learing-hub \
  --recurrence=daily \
  --retention=14d
```

Verify:
```bash
gcloud firestore backups schedules list --database="(default)" --project=kids-learing-hub
```

## Step 3 — Restore procedure  ·  OWNER  ·  C8

> **Do not overwrite the production database in place.** Firestore restores create a **new**
> database; you validate it, then repoint the app. This keeps the damaged prod DB available for
> forensics and makes the restore reversible.

### 3a. Restore from PITR (data loss within the last 7 days)

```bash
# Choose a timestamp just BEFORE the incident (RFC3339, within the last 7 days).
gcloud firestore databases restore \
  --source-database="(default)" \
  --destination-database="recovery-YYYYMMDD" \
  --snapshot-time="2026-07-15T09:00:00Z" \
  --project=kids-learing-hub
```

### 3b. Restore from a scheduled backup (older than 7 days)

```bash
gcloud firestore backups list --project=kids-learing-hub \
  --format="table(name, database, snapshotTime)"

gcloud firestore databases restore \
  --source-backup="projects/kids-learing-hub/locations/<loc>/backups/<backupId>" \
  --destination-database="recovery-YYYYMMDD" \
  --project=kids-learing-hub
```

### 3c. Validate the recovery database (before repointing)

Point a scratch instance of the app (or the Admin SDK) at `recovery-YYYYMMDD` and spot-check:
- `users` count is within expectations; a known admin account exists.
- `user_progress` for a known test user has the expected `bundleVersion` + recent `updatedAt`.
- `audit_log` contains the pre-incident rows.

### 3d. Repoint production

Firebase App Hosting uses the default database via ADC. To cut over to the recovered data, the
supported path is to **restore into a new database and update the app's Firestore database id**
(env/config) to the recovery database, deploy, and verify — OR, once validated, promote the
recovery database per current Firebase guidance. Record the exact cutover you used in the drill
notes (Appendix D) since the promote/rename story evolves.

---

## Step 4 — Restore drill (REQUIRED — this is the deliverable)  ·  OWNER

A backup you have never restored is not a backup. Perform a drill and record the results:

1. Pick a recent PITR timestamp; restore to `recovery-drill` (Step 3a).
2. Run the 3c validation checks against it.
3. **Time it end-to-end** — that measured duration is your real **RTO**; confirm it's within
   the ≤ 4h target (or revise the target with justification).
4. Delete `recovery-drill` when done (`gcloud firestore databases delete`).
5. Paste results into **Appendix D** of `roadmap/PRODUCTION_HARDENING_ROADMAP.md`:
   date, snapshot time, measured RTO, validation outcome, and any deviations.

---

## Ongoing / ownership

- **Re-drill** at least once per quarter and after any schema/migration change (e.g. the Phase 4
  tenancy migration).
- **Retention** must stay consistent with the Phase 3 data-retention policy (children's data).
- **Access:** restore commands require Firestore admin IAM — keep that role tightly scoped and
  audited.

## Owner checklist

- [ ] PITR enabled and verified (Step 1).
- [ ] Daily backup schedule created and verified (Step 2).
- [ ] Restore drill completed; RTO measured; results in Appendix D (Step 4).
- [ ] RPO/RTO targets confirmed or revised with rationale.
