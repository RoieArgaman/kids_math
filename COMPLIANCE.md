# COMPLIANCE.md — Children's-data posture (kids_math)

> ## ⚠️ NOT LEGAL ADVICE — engineering posture only
>
> This document describes **what the code actually does** with learner data, so an engineer,
> an auditor, or a buyer's due-diligence reviewer can verify each claim against the repo.
> It is not a privacy policy, not a legal opinion, and not a compliance certification.
> Nothing here has been reviewed by counsel. Before relying on it for a sale, a school
> contract, or a regulatory filing, have a qualified lawyer in the relevant jurisdiction
> review both this document and the product.

**Scope:** roadmap Phase 3.5, finding **C2a**. Companion docs: [`SECURITY.md`](SECURITY.md)
(controls), [`.claude/docs/DPA_TEMPLATE.md`](.claude/docs/DPA_TEMPLATE.md) (processor terms),
[`roadmap/PRODUCTION_HARDENING_ROADMAP.md`](roadmap/PRODUCTION_HARDENING_ROADMAP.md) (findings
register and phase status).

**Last verified against the code:** 2026-07-18.

---

## Read this first — the three limitations

If you read nothing else, read this. Each is stated in full in [Limitations](#limitations).

1. **We cannot erase learner data.** Delete is a *soft* delete. Nothing in this repo removes a
   user record or a progress bundle. We can export and deactivate; we **cannot** erase.
2. **Soft delete is account bookkeeping, not access removal.** A soft-deleted child on the same
   device can keep using the app offline.
3. **Retention is not automated.** Nothing deletes on a schedule. The selector also measures
   *account age*, not last activity.

---

## What we actually store

All server-side data lives in one Firestore database, reached **only** through the Firebase
Admin SDK on the server ([`lib/firestore/admin.ts`](lib/firestore/admin.ts)). There is no client
Firebase SDK anywhere in the codebase.

| Collection | Doc id | Fields | Contains personal data? |
|---|---|---|---|
| `users` | auto-id | `username`, `usernameLower`, `passwordHash` (bcrypt), `role`, `tokenVersion`, `createdAt`, `status` (written only on a lifecycle transition; absent ⇒ active, including on newly-created accounts) | Yes — a chosen username |
| `user_progress` | `userId` | The learner's progress bundle (`bundleVersion` 1–4: workbook, final exam, GMAT challenge, badges, streak, English, Science) | Yes — learning activity |
| `audit_log` | auto-id | `actorId`, `action`, `targetId`, `meta`, `at` | Pseudonymous — user *ids*, never names |
| `rate_limits` | `sha256(key)` | `count`, `windowStart`, `expiresAt` | No — see minimisation below |
| `account_lockouts` | `sha256(usernameLower)` | `failures`, `lockedUntil`, `expiresAt` | No — see minimisation below |
| `_health` | fixed | Readiness probe only | No |

### Most learner progress also lives in the browser

This matters more than the table suggests. The app is **localStorage-first**: progress is written
to `localStorage` under `kids_math.*` keys and synced to `user_progress` opportunistically. Lesson
content is **static files** served to the browser. Consequences that run through this whole
document:

- A logged-out or never-logged-in child generates learner data that **never reaches our server**.
- Server-side deletion or deactivation does not, by itself, remove data from a device.
- The device copy *is* torn down when a revoked client next reaches the server — see
  [Limitation 2](#2-soft-delete-revokes-sync-and-login-not-app-access).

---

## Data minimisation

We store **no email, no phone number, no postal address, no real name, and no date of birth.**
There is no field for any of them, and no route accepts one — see
[`lib/security/schemas.ts`](lib/security/schemas.ts), where the entire authenticated write surface
is enumerated.

- **Usernames are chosen by an administrator**, not by the child, via `POST /api/admin/users`.
  Whether a username identifies a real child is therefore an *operational* choice by the deploying
  organisation, not a property of the system. Guidance for operators: use pseudonymous handles.
- **Hashed doc ids are a deliberate minimisation control.** `rate_limits` and `account_lockouts`
  key their documents on `sha256(...)` of the rate-limit key or the lowercased username
  ([`lib/security/rateLimit.ts`](lib/security/rateLimit.ts),
  [`lib/security/accountLockout.ts`](lib/security/accountLockout.ts)). The stored key therefore
  never contains a raw username or a raw client IP. Both collections also carry an `expiresAt`
  field with a Firestore TTL policy, so rows are transient rather than accumulating.
- **The audit log stores ids, not names** ([`lib/observability/auditLog.ts`](lib/observability/auditLog.ts)).
  Its `meta` field is documented as never carrying passwords, hashes, tokens, or cookies.
- **No third-party analytics, ads, or trackers.** The CSP in
  [`next.config.mjs`](next.config.mjs) is `default-src 'self'` with no third-party origin
  allow-listed; `connect-src` is `'self'` only.
- **No password is ever stored or logged in the clear** — only a bcrypt hash, cost 12.

---

## Regulatory posture, right by right

Relevant regimes: **COPPA** (US, under-13), **GDPR / GDPR-K** (EU, Art. 8 children's consent),
and the **Israeli Privacy Protection Law** (5741-1981) with its 2024 amendment (Amendment 13).
The user base is Israeli 6–8-year-olds.

Honest status of each data-subject right, as implemented **today**:

| Right | Status | What actually exists |
|---|---|---|
| **Access** (GDPR Art. 15) | ✅ | `GET /api/admin/users/export?userId=…` returns a child's full record — account fields plus the whole progress bundle — as a downloadable JSON file. Admin-operated: a guardian asks, an admin fulfils. A **soft-deleted** user exports normally, which is exactly who a guardian tends to ask about. |
| **Rectification** (Art. 16) | 🟡 **Partial** | An admin can reset a password and change lifecycle status (`PATCH /api/admin/users`). There is **no route to correct a username** or any other stored field. |
| **Erasure** (Art. 17) | ❌ **Not available** | See [Limitation 1](#1-no-true-erasure-yet). Deferred to Phase 4. |
| **Portability** (Art. 20) | ✅ | The same export endpoint emits structured, machine-readable JSON (`Content-Disposition: attachment`, `Cache-Control: no-store`). A learner can additionally retrieve their own bundle via `GET /api/user/progress`. |
| **Restriction / objection** (Art. 18, 21) | ✅ | `PATCH … {action:"deactivate"}` stops all processing for that account: login is refused and sync is revoked. Reversible via `restore`. |
| **Consent capture** (GDPR Art. 8, COPPA verifiable parental consent) | ❌ **Not built** | There is no guardian-consent flow anywhere in the product. Tracked as roadmap **UX3**. This document describes posture; capturing consent is a separate product task. |

**On the export's safety.** The projection in [`lib/compliance/export.ts`](lib/compliance/export.ts)
is an explicit **allow-list** — each exported field is copied by name, rather than spreading the
user doc and deleting sensitive keys. `passwordHash`, `tokenVersion`, and `usernameLower` are
therefore structurally incapable of reaching the response, whatever new fields the user doc grows.
Every fulfilment writes a `user.export` audit row **before** the response is returned, because an
export is a data egress and must always be traceable to the admin who performed it.

---

## Limitations

These three are the ones that would fail a due-diligence review if left unsaid. They are stated
without softening, deliberately.

### 1. No true erasure yet

**We cannot erase learner data. Delete is a soft delete: the user record and the progress bundle
are retained in full and are restorable. Permanent erasure is deferred to Phase 4 as a
super-admin, org-scoped privilege. We can export and deactivate; we CANNOT currently erase.**

`DELETE /api/admin/users` sets `status: "deleted"` on the `users` doc and bumps `tokenVersion`.
That is the entire operation. `users/{id}` remains. `user_progress/{id}` remains, untouched. A
subsequent `restore` returns the child's work intact — which is the *intended* product behaviour,
and is exactly why it is not erasure.

Consequences to state to any buyer or school:

- A "right to be forgotten" request **cannot be honoured** by the current system.
- Soft-deleted accounts are never purged, so `users` grows monotonically and usernames stay
  permanently taken (roadmap **C11**).
- Backups extend the retention of deleted data further still — PITR holds a rolling 7 days and
  scheduled backups are retained 14 days, so a record persists in recoverable form for at least
  that long after any future erasure. See
  [`.claude/docs/DISASTER_RECOVERY_RUNBOOK.md`](.claude/docs/DISASTER_RECOVERY_RUNBOOK.md). Any
  erasure procedure built in Phase 4 must state its position on backup residency.
- Even a *pre*-Phase-3 hard delete was incomplete: it left
  `account_lockouts/{sha256(usernameLower)}` behind, a record derived from the child's username
  (roadmap **C10**).

Tracked as **C2b**, Phase 4.5. Until it ships, do not claim erasure.

### 2. Soft delete revokes sync and login, not app access

**Soft delete is account bookkeeping, NOT access removal.** It revokes the account's ability to
log in and to sync — it does not remove the child's access to the app.

Why: no page or layout calls `verifySession`. Only the API routes do.
[`middleware.ts`](middleware.ts) explicitly skips `/api/*`, and its matcher covers only the
grade-B subtrees, gated on anonymous one-year cookies. Lesson content is static files and progress
is `localStorage`. **A soft-deleted child on the same device can therefore keep using the app
offline, including grade-B content, and loses only cross-device sync.**

The one real mitigation, and it is genuine: **their local data IS wiped on the next load that
reaches the server.** [`lib/auth/context.tsx`](lib/auth/context.tsx) treats a confirmed 401 from
`/api/auth/me` on a device that was signed in as revocation, and runs the full local teardown —
`clearLocalProgress()` and `clearLocalOwner()`. So a deleted child's progress is not left readable
to the next person on a shared school or family device, provided the device gets online once.

Describe this control accurately: it ends the *account*, and it cleans the device on next contact.
It does not lock a child out of an offline app. Tracked as **S14**.

### 3. Retention is not automated

**Nothing deletes on a schedule.** There is no cron, no scheduled job, and no execution path.

What exists is two halves, deliberately kept apart:

- [`lib/compliance/retention.ts`](lib/compliance/retention.ts) — a **pure** selection module.
  `selectExpiredAccounts(users, now, policy)` reads no clock and performs no I/O; it answers only
  "which accounts *would* be selected". Admin accounts and already-deleted accounts are excluded;
  a missing or unparseable `createdAt` fails closed (skip).
- [`scripts/retention-dry-run.mjs`](scripts/retention-dry-run.mjs) — a **read-only** reporter. It
  performs no write, update, or delete. That omission is deliberate and documented in the file
  itself; a script that both selects and deletes is one bad flag away from erasing learner data.

Two further caveats:

- Even if it *were* wired up, "selected" would mean **soft delete** — see Limitation 1. There is
  no hard-delete path for it to call.
- **The policy currently measures ACCOUNT AGE, not last activity**, because no `lastLoginAt` field
  exists on the user doc. `policy.inactiveDays` is therefore counted from `createdAt`. An account
  in daily use for two years is indistinguishable, to this selector, from one abandoned on day one.
  A "365-day retention policy" built on it would not mean what a reader assumes it means. When a
  last-activity timestamp lands, extend `RetentionUser` rather than reinterpreting `createdAt`.

Default window in the dry run is 365 days — generous by design, so a child can miss a full school
year and still return to their progress.

---

## Sub-processors

| Sub-processor | Service | Region | Data |
|---|---|---|---|
| Google Cloud / Firebase | Firestore (database) | **`europe-west1`** (Belgium) | `users`, `user_progress`, `audit_log`, `rate_limits`, `account_lockouts` |
| Google Cloud / Firebase | App Hosting (application runtime, Cloud Run) | **`europe-west4`** (Netherlands) | Request processing; application logs |
| Google Cloud | Secret Manager | Project-scoped | `JWT_SECRET` only |
| Google Cloud | Error Reporting / Cloud Logging | Project-scoped | Structured logs, captured errors |

**Google is the only sub-processor.** No analytics vendor, CDN, ad network, or third-party API is
involved at runtime.

**Data residency:** all learner data is stored and processed **within the EU**. Users are in
Israel, which holds an EU adequacy decision. The application was relocated from `us-east4`
(Virginia) to `europe-west4` on 2026-07-18 to co-locate with Firestore — a latency fix (roadmap
**C9**) that also removed the transatlantic data path. `europe-west1` itself is not an App Hosting
region, which is why the app sits in `europe-west4` rather than sharing the database's region.
Verify against [`apphosting.yaml`](apphosting.yaml) and
[`.claude/docs/C9_RELOCATION_RUNBOOK.md`](.claude/docs/C9_RELOCATION_RUNBOOK.md).

Backups and PITR inherit the Firestore region; see the
[DR runbook](.claude/docs/DISASTER_RECOVERY_RUNBOOK.md) for retention windows and their
implications for how long deleted data remains recoverable.

---

## Lawful basis and roles

Stated as an engineering position for counsel to confirm, not as a legal conclusion:

- **Controller / processor:** where the product is deployed for a school or organisation, that
  organisation is expected to be the **controller** and this service the **processor**. In direct
  home use, the operator of this deployment is the controller. Settle this per contract —
  see [`.claude/docs/DPA_TEMPLATE.md`](.claude/docs/DPA_TEMPLATE.md).
- **Purpose:** delivering and resuming a child's maths/English/science practice. There is no
  profiling, no advertising, no automated decision-making with legal effect, and no sale or
  sharing of data.
- **Lawful basis:** to be determined with counsel per deployment — most plausibly performance of a
  contract with the guardian/school, or consent under GDPR Art. 8. **Note that no consent capture
  mechanism exists in the product** (roadmap UX3), so a consent-based basis is not currently
  evidenced by the system.

---

## Verifying these claims

Every claim above is checkable in this repo:

```bash
# What can be written server-side at all — the whole authenticated write surface
cat lib/security/schemas.ts

# Confirm no route erases anything; DELETE only sets status
grep -rn "\.delete()" app/api lib

# Confirm the export projection is an allow-list, not a spread-and-delete
cat lib/compliance/export.ts

# Confirm there is no scheduled retention job and no delete path in the dry run
grep -rn "execute\|cron\|schedule\|delete" scripts/retention-dry-run.mjs

# Confirm hashed doc ids in the limiter collections
grep -n "sha256" lib/security/*.ts
```

---

## How to update this document

1. Re-read the code paths cited above; **do not** update the prose from a plan or a PR
   description. A compliance doc that describes intent rather than behaviour is worse than none.
2. When a limitation is closed, move it out of [Limitations](#limitations) and cite the shipped
   file and route by path.
3. Update **Last verified against the code** at the top.
4. Cross-check the roadmap's findings register (C2a, C2b, C10, C11, S14, UX3) so status marks
   agree in both places.
