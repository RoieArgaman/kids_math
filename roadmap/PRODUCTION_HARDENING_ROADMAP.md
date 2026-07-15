# Production Hardening Roadmap — Scale & Sale

> **Status:** APPROVED ROADMAP (planning artifact — no code in this document).
> **Owner:** Engineering.
> **Created:** 2026-07-10.
> **Mode:** MAX (auto-escalated: touches auth/JWT, `middleware.ts`, `lib/*/storage.ts`
> schema, grade-unlock chain, and CRITICAL security findings — see `AGENTS.md` →
> Escalation Playbook).
> **Goal:** Take kids_math from a working single-tenant app to a product that (a) scales
> to many concurrent users and (b) survives the technical + legal due diligence of a
> corporate buyer (school district, publisher, ed-tech company).

This is the durable roadmap. Each **Phase** below is a self-contained task that gets its own
`/plan` (PRO/ULTRA/MAX per its risk) before implementation. **Progress so far: Phases 0 & 1 ✅
merged (Phase 1 via [#70](https://github.com/RoieArgaman/kids_math/pull/70)); Phases 2–5 not
started.** See the Progress tracker at the bottom for the live status.

---

## How to use this document

1. Work **top-down**: Phase 0 → 5. The order encodes dependency and risk, not preference.
2. Before starting any phase, open a fresh `/plan` for **that phase only**, using the
   "Tasks", "Files to touch", and "Tests" sections here as the seed.
3. Each phase has **go/no-go gates**. Phases 0–2 are continuously shippable hardening.
   Phases 3–4 are the actual "sellable" unlock and each requires an explicit product
   go/no-go before starting. Phase 5 is the parallel **monetization** track (freemium
   gate) and likewise gates on a product go/no-go.
4. Update the **Progress Tracker** table at the bottom as phases land.
5. Append a `LEARNING_LOG.md` entry when each phase completes (per Learning Loop rule).

---

## Executive summary

| Theme | Where we are today | Where a buyer needs us to be |
|-------|--------------------|------------------------------|
| **AuthN/AuthZ** | Custom JWT (HS256, 30-day), bcrypt(12), httpOnly cookie, role gate | Revocable sessions, lockout, password policy, secret rotation, audit trail |
| **Abuse resistance** | None (no rate limiting, no body caps) | Shared-state rate limiting, body caps, constant-time login |
| **Transport/headers** | None (no CSP/HSTS/frame headers) | Full security-header suite, CSP enforced |
| **Observability** | `console.error` only | Error tracking, structured logs, metrics, alerting, dashboards |
| **Disaster recovery** | None documented | Firestore PITR/backups, RPO/RTO, restore runbook |
| **Compliance** | Privacy page exists | COPPA / GDPR-K / Israeli Privacy Law posture, consent, export/erasure, DPA |
| **Multi-tenancy** | Flat `users` collection, 2 roles | Org model, org-scoped roles + queries, tenant isolation |
| **Scale of data model** | 1 `user_progress` doc/user, whole-doc write | Pagination, contention-safe writes, doc-size guardrails |
| **Monetization / free tier** | Logged-out users get everything free (no cap) | Metered free tier — logged-out daily cap that nudges account creation |

---

## Current-state architecture (as researched 2026-07-10)

- **Framework:** Next.js 14 App Router, React 18, TypeScript strict, Tailwind. Hebrew RTL.
- **Hosting:** Firebase App Hosting (`firebase.json` → `apphosting:kids-math`,
  `apphosting.yaml`). Deploy is CI-gated (`.github/workflows/deploy.yml` runs on successful
  `CI` workflow_run on `main`). `minInstances` currently unset (→ 0, cold starts).
- **Auth:** Custom JWT via `jose` (HS256), `lib/auth/jwt.server.ts`.
  - `SESSION_COOKIE_NAME = "kids_math_session"`, `SESSION_DURATION_SECONDS = 30 days`.
  - `signToken` embeds `{ userId, username, role }`. No `jti`, no version, no revocation.
  - `JWT_SECRET` from env, min-32-char check. Single secret, no rotation path.
  - Cookie: `httpOnly`, `sameSite: "lax"`, `secure` derived from proto/`x-forwarded-proto`.
- **Data:** Firestore via **Admin SDK only** (`lib/firestore/admin.ts`). **No client Firebase
  SDK anywhere** (grep-confirmed) → no client rules exposure, but **no `firestore.rules`
  file exists** either (should be committed as defense-in-depth).
  - `db.settings({ ignoreUndefinedProperties: true })`.
  - Collections: `users` (with `usernameLower`, `passwordHash`, `role`, `createdAt`),
    `user_progress/{userId}` (one merged bundle doc per user).
- **API routes** (`app/api/`):
  - `auth/login` (POST) — Firestore lookup by `usernameLower`, bcrypt compare, sets cookie.
  - `auth/me` (GET) — JWT-only, no DB read.
  - `auth/logout` (POST) — clears session + all grade-B unlock cookies.
  - `user/progress` (GET/POST) — JWT-gated; POST clamps future timestamps, merges in a
    Firestore transaction (`mergeBundles`), stamps `updatedAt`.
  - `admin/users` (GET/POST/PATCH/DELETE) — `requireAdmin` gate; strips `passwordHash` on
    list; unbounded `orderBy("createdAt","desc").get()`.
  - `grade-b-unlock` / `grade-b-lock` / `unlock-grade-b` / `lock-grade-b` — **unauthenticated**;
    set/clear the per-subject grade-B unlock cookie (content gate only, not data).
- **Middleware** (`middleware.ts`, EDGE runtime): grade-B subtree gate via cookies;
  `previewAll` QA bypass; matcher = `/grade/b/*`, `/english/b/*`, `/science/b/*`, `/subjects/b`.
  **Skips `/api/*` entirely** — so any future API rate limiting/headers must live in the
  route handlers or a separate mechanism, not this middleware.
- **Sync model** (`lib/user-data/*`, `lib/auth/serverSync.ts`): per-identity source-of-truth
  with owner marker, `authEpoch`, `syncPrimed` gate, debounced `scheduleSync`. Robust for
  correctness; documented in `LEARNING_LOG.md` (2026-07-10 isolation entry).
- **`UserProgressBundle`** (`lib/user-data/types.ts`): `bundleVersion 1|2|3|4`, additive/
  backward-compatible. Merge is whole-domain LWW + per-day workbook merge (`merge.ts`).
- **CI** (`.github/workflows/ci.yml`): `lint-and-unit` job + 3-shard `e2e`. **No `npm audit`,
  no Dependabot, no secret scanning, no SAST.** `next.config.mjs` sets
  `eslint.ignoreDuringBuilds: true` (lint runs in CI, not in the build itself).
- **Tests:** strong. Unit API tests (`tests/unit/app/api/*`), unit merge/sync tests, and
  e2e including the two regression anchors: `tests/e2e/multi-user-isolation.spec.ts` and
  `tests/e2e/auth-backward-compat.spec.ts`.

---

## Findings register (severity-ranked)

Each finding maps to a phase. IDs are stable — reference them in phase PRs and the tracker.

### Security

| ID | Finding | Severity | Evidence | Phase |
|----|---------|----------|----------|-------|
| **S1** | No rate limiting anywhere → login brute-force, credential stuffing, progress-push abuse | CRITICAL | no `rate-limit` refs; `middleware.ts` skips `/api/*` | 0 (shadow) → 2 (enforce) |
| **S2** | Login user-enumeration via timing — 401 returned before any bcrypt work when username unknown | HIGH | `app/api/auth/login/route.ts:30-32` | 0 |
| **S3** | No security headers (CSP, HSTS, X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy) | HIGH | `next.config.mjs` has no `headers()` | 0 |
| **S4** | Sessions non-revocable — 30-day JWT, no `jti`/version; admin `PATCH` password reset does NOT invalidate existing tokens; leaked secret = valid until expiry | HIGH | `lib/auth/jwt.server.ts`; `app/api/admin/users/route.ts` PATCH | 1 ✅ #70 |
| **S5** | No request-body size limit on progress POST → cost/DoS via oversized bundle; Firestore 1 MB doc ceiling unguarded | HIGH | `app/api/user/progress/route.ts:33` | 0 |
| **S6** | No dependency/secret scanning in CI (`npm audit`, Dependabot, secret scan, SAST all absent) | MEDIUM | `.github/workflows/ci.yml` | 0 |
| **S7** | Grade-unlock routes unauthenticated (anyone can POST to set unlock cookie) | LOW | `app/api/grade-b-unlock/route.ts` etc. | 1 ✅ #70 |
| **S8** | No structured input validation (hand-rolled `typeof` guards) — fragile as surface grows | MEDIUM | all route handlers | 1 ✅ #70 |
| **S9** | No audit log for admin actions (create/delete/reset user) | MEDIUM | `app/api/admin/users/route.ts` | 2 |
| **S10** | No `firestore.rules` committed (deny-all defense-in-depth even though Admin-SDK-only) | MEDIUM | repo root | 3 |
| **S11** | `x-forwarded-proto` / client-IP trust unverified behind App Hosting proxy (affects `secure` flag + any IP-keyed limiter) | MEDIUM (spike) | `login/route.ts:48-50`, `gradeUnlockCookies.ts:18-21` | 0 (spike) |
| **S12** | `JWT_SECRET` single value, no rotation runbook | MEDIUM | `apphosting.yaml`, `jwt.server.ts` | 1 ✅ #70 |

### Scale / sellability

| ID | Finding | Severity | Phase |
|----|---------|----------|-------|
| **C1** | No tenant/org model — flat `users`, no school/class grouping, no teacher/parent roles. Blocks selling to any organization. | CRITICAL (for sale) | 4 |
| **C2** | Children's-data compliance not evidenced — COPPA / GDPR-K / Israeli Privacy Law. Consent, retention, DPA, export/erasure. | CRITICAL (for sale) | 3 |
| **C3** | No observability — no error tracking, metrics, uptime, alerting. | HIGH | 2 |
| **C4** | Admin users list unbounded (`orderBy().get()`, no pagination) → breaks past a few hundred users. | MEDIUM | 4 |
| **C5** | Single `user_progress` doc grows unbounded; whole-doc read+write per push → contention + cost at scale; 1 MB ceiling. | MEDIUM | 4 |
| **C6** | `minInstances: 0` (cold starts); no separated staging env; single region. | MEDIUM | 2 |
| **C7** | No load/perf test or documented capacity targets. | MEDIUM | 2 |
| **C8** | No Firestore backups / PITR; no RPO/RTO or restore runbook (buyer due-diligence item). | HIGH | 2 |

### Monetization / access gating

| ID | Finding | Severity | Phase |
|----|---------|----------|-------|
| **M1** | Logged-out (unregistered) visitors get the full app unrestricted — no free-tier cap, so nothing nudges them to create an account. | MEDIUM (monetization) | 5 |

### Kids-gaming UX (deferred; surfaced in the Phase 1 PM review, 2026-07-15)

These improve the child-facing auth experience but are larger than Phase 1 hardening. The
cheap, lockout-softening items (show-password toggle, non-punitive voiced lockout, warm copy,
numeric keypad, admin-only "log out everywhere", admin "locked" badge/unlock) shipped **inside
Phase 1**; the two below are their own tasks.

| ID | Finding | Severity | Phase |
|----|---------|----------|-------|
| **UX1** | Login asks pre-literate 6–8-year-olds to type a username string + masked password. The kids-native pattern is **pick-your-avatar + a numeric PIN pad** (aligns with the app's numbers/taps-only ethos and the Phase 1 `overridePolicy` simple-password path). Reduces failed logins → fewer lockouts. | MEDIUM (UX) | Backlog (own ULTRA task) |
| **UX2** | Avatar is two gray initials — no identity/delight. Pick-a-character avatars are a known engagement + retention lever for this age group. | LOW (UX/engagement) | Backlog (own task) |

---

## Phase 0 — Security quick wins  ·  Mode: ULTRA  ·  ✅ COMPLETED

> **Status: DONE** (branch `claude/roadmap-quick-wins-vdg7z7`). All six quick wins (0.0–0.5)
> shipped together in one PR. Findings **S2, S3, S5, S6** are fixed & tested; **S1** is live in
> shadow (record-only) mode; **S11** is answered and documented in Appendix A. Kept here as a
> short record so the later phases' "Gate to start: Phase 0 merged" references still resolve.

**What shipped:**
- **0.0 (S11):** `lib/security/clientIp.ts` — trusted client-IP reader (right-most XFF position,
  ignores client-prepended spoof). Proxy-trust contract + verify-before-enforce caveat in Appendix A.
- **0.1 (S1):** `lib/security/rateLimit.ts` — Firestore-backed shared-state fixed-window limiter in
  **shadow mode** (records over-threshold via `console.warn("[rate-limit:shadow]")`, **never blocks**,
  **fail-open**). Wired on `/api/auth/login` (IP+username), `/api/user/progress` POST (userId), and
  admin mutations (adminId). Promotion to enforcing 429 stays in Phase 2.7.
- **0.2 (S2):** constant-time login — always runs a bcrypt compare (dummy cost-12 hash on the
  unknown-user path) so timing no longer reveals whether an account exists.
- **0.3 (S3):** `next.config.mjs` `headers()` — HSTS (**staged** short max-age), **CSP Report-Only**,
  `X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`.
- **0.4 (S5):** `lib/security/bodyLimit.ts` — 413 body caps. Login enforces immediately; the progress
  cap is **shadow-first** (`PROGRESS_BODY_CAP_ENFORCE` flag, default off) and sits just under
  Firestore's ~1 MiB doc ceiling, so no existing heavy bundle is ever rejected.
- **0.5 (S6):** `.github/dependabot.yml` (npm + actions) and a CI `security-scan` job
  (`npm audit --audit-level=high` non-blocking first, blocking `gitleaks` secret scan). No configs
  weakened (`ignoreDuringBuilds` untouched, CI lint authoritative).

**Tests:** `tests/unit/lib/security/{clientIp,rateLimit}.test.ts`, extended
`authLogin`/`userProgress` unit tests (constant-time, 413, shadow-vs-enforce body cap), and
`tests/e2e/security-headers.spec.ts`. Backward-compat: existing 30-day sessions untouched, CSP
Report-Only can't break cached clients, both regression anchors green.

---

## Phase 1 — Session integrity & auth hardening  ·  Mode: MAX  ·  ✅ COMPLETED (#70)

> **Status: DONE** (merged via [#70](https://github.com/RoieArgaman/kids_math/pull/70), branch
> `claude/roadmap-review-9a2c34`) — code + tests shipped, **all CI checks green** (lint-and-unit,
> 3× e2e, security-scan). Approved plan: [`PHASE_1_PLAN.md`](PHASE_1_PLAN.md).
>
> **Done (all 5 sub-tasks):** 1.1 revocable sessions via additive `tokenVersion` (**S4** ✅);
> 1.2 password policy + account lockout (N=5, 60s, fail-open, uniform 429); 1.3 central zod
> validation, progress envelope-only (**S8** ✅); 1.4 grade-unlock zod-hardened but kept
> intentionally anonymous (**S7** ✅); 1.5 JWT-rotation runbook — Appendix B + apphosting note
> (**S12** ✅). Both regression anchors green.
>
> **Added beyond the original plan (post-approval, per user):** admin instant-unlock + password
> reset also clears the lock; `overridePolicy` escape hatch for simple/PIN kid passwords;
> kids-gaming login UX (show-password toggle, non-punitive TTS-voiced lockout countdown +
> "try again" cue, warm copy); "log out everywhere" made **admin-only**; admin locked-badge.
>
> **Deferred (tracked):** avatar+PIN login (**UX1**) and playful avatars (**UX2**) → backlog;
> `inputMode="numeric"` dropped (would break alphanumeric passwords — belongs with UX1);
> audit-logging the `overridePolicy` use → **Phase 2** (S9).

**Objective:** Make sessions revocable and the auth surface robust — the core of any buyer's
security questionnaire. **Storage-schema-adjacent** (adds a field to `users` docs) → MAX.
**Gate to start:** Phase 0 merged (S11 answered; limiter available to pair with lockout).

### 1.1 — Revocable sessions via `tokenVersion` (S4)
- **Design (backward-compatible / additive):**
  - Add `tokenVersion: number` to each `users` doc (default/absent ⇒ treat as `0`).
  - `signToken` embeds `tokenVersion`. `verifyToken` (currently JWT-only) must now either
    (a) also carry `tokenVersion` in the token and reject on a lightweight check, or
    (b) do a cheap Firestore read to compare. **Decision to make in the phase plan:**
    pure-JWT (no DB read, but revocation only on next natural boundary) vs. DB-checked
    (immediate revocation, one read per request). Recommended: embed in JWT for `/me`, and
    do a version check on sensitive/mutating routes.
  - **Absent `tokenVersion` in an existing 30-day token ⇒ still valid** (do not lock out live
    users). This is the critical backward-compat rule.
- **Bump points:** admin `PATCH` password reset, self password change (if added), and a new
  **"log out everywhere"** action all `tokenVersion += 1`.
- **Files:** `lib/auth/jwt.server.ts`, `app/api/admin/users/route.ts` (PATCH), `app/api/auth/*`,
  possibly `middleware.ts` if version enforced at the edge (note: edge can't read Firestore →
  keep version enforcement in Node route handlers).
- **Tests:** unit — reset bumps version and invalidates the old token; pre-existing token with
  no version stays valid; `auth-backward-compat.spec.ts` MUST stay green. New e2e: reset →
  old session rejected on next mutating call.

### 1.2 — Password policy + account lockout (pairs with S1)
- **Task:** enforce a minimum password strength on create/reset (length + basic composition);
  lock an account after N consecutive failures for a cooldown (backed by the Phase 0 limiter's
  shared store, keyed by `usernameLower`).
- **UX (SeniorProductDesigner):** child/parent-legible Hebrew lockout + reset messaging, RTL,
  reuse shared UI library (rule 4).
- **Tests:** unit — weak password rejected; N failures → locked; cooldown expiry unlocks.

### 1.3 — Structured input validation (S8)
- **Task:** introduce a schema validator (e.g. `zod`) and centralize request-body schemas in
  `lib/security/schemas.ts`; replace hand-rolled `typeof` guards in every route handler.
  Keeps behavior identical but makes the surface auditable and consistent as it grows.
- **Tests:** existing API unit tests must stay green; add malformed-payload cases per route.

### 1.4 — Authenticate / retire grade-unlock routes (S7)
- **Task:** either require a valid session on `grade-b-unlock`/`lock` (+ legacy shims) or fold
  the unlock into the authenticated progress/reconcile flow. Low severity (content gate only)
  but tidy the unauthenticated write surface before sale.
- **Tests:** `tests/e2e/grade-b-gate.spec.ts` + `gradeBUnlock.test.ts` stay green under new auth.

### 1.5 — JWT-secret rotation runbook (S12)
- **Task:** document a rotation procedure that leverages `tokenVersion` + a brief dual-verify
  window (accept old+new secret during cutover). Design/runbook only in this phase; add
  `apphosting.yaml` secret-versioning notes. Append to Appendix B here.

### Phase 1 quality gates
MAX: two review cycles + QA team → `npm run test:qa` on PR CI → Playwright visual → verification
report. Storage-touching (adds `tokenVersion`) → follow `AGENTS.md` Data & Storage Rules; no
backfill needed (absent ⇒ 0), but document the field.

### Phase 1 Definition of Done
1. Password reset (and "log out everywhere") revokes existing sessions immediately on mutating
   routes; pre-existing tokens without a version still work.
2. Lockout + password policy live and tested.
3. All route bodies validated via a single schema module; no hand guards remain.
4. Grade-unlock write surface authenticated or retired.
5. JWT rotation runbook written. Regression anchors green.

---

## Phase 2 — Observability, DR & ops  ·  Mode: ULTRA

**Objective:** You cannot operate at scale or pass due diligence without seeing failures,
proving recoverability, and tuning the limiter with real data.
**Gate to start:** Phase 0 merged (limiter in shadow mode to promote).

### 2.1 — Error tracking + structured logging (C3)
- **Task:** wire Sentry (or GCP Error Reporting) into route handlers + a client error boundary;
  replace bare `console.error` (currently only in `user/progress/route.ts`). Emit structured
  logs (request id, route, status, latency).
- **PII (SeniorQA_Engineer):** scrub usernames/tokens/passwords at SDK init; deny-list fields —
  this is children's data.
- **Test:** unit — logger redacts denied fields; a thrown route error is captured.

### 2.2 — Admin audit log (S9)
- **Task:** write an `audit_log` collection row for every admin mutation (actor id, action,
  target id, timestamp, before/after where safe). Buyers require this.
- **Test:** unit — create/delete/reset user each writes an audit row.

### 2.3 — Health check, uptime, alerting, dashboards (C3, C7)
- **Task:** add a `/api/health` (or route) readiness check; configure an uptime monitor;
  alerts on error-rate + p95 latency + 5xx; a basic metrics dashboard. Document capacity
  targets (target concurrent users, req/s).
- **Test:** health route returns 200 + dependency status; alert config reviewed.
- **Status:** `/api/health` + structured logging + error seam + `audit_log` shipped in
  **sub-PR 2A** ([#71](https://github.com/RoieArgaman/kids_math/pull/71)). The console
  setup (Error Reporting view, uptime check, alert policies, dashboard) + documented
  capacity/threshold targets are the **owner runbook**:
  [`OBSERVABILITY_RUNBOOK.md`](../.claude/docs/OBSERVABILITY_RUNBOOK.md).

### 2.4 — Load / perf test (C7)
- **Task:** add a k6/Artillery script simulating classroom-concurrency (login burst + progress
  pushes) against a staging target; record baseline throughput + latency and the point where
  the single `user_progress` doc contention (C5) shows up (feeds Phase 4).
- **Deliverable:** baseline numbers appended to Appendix C.
- **Status:** the k6 harness shipped in **sub-PR 2C** — [`scripts/load/progress-load.js`](../scripts/load/progress-load.js)
  + [`scripts/load/README.md`](../scripts/load/README.md) (login-burst + steady progress-push
  scenarios, per-workload latency trends, C5-contention sweep instructions). **Running it +
  recording the baseline is an owner action** (needs k6 + a scratch target with test users;
  staging is deferred) → Appendix C.

### 2.5 — Firestore backups / PITR + restore runbook (C8)
- **Task:** enable Firestore scheduled backups / Point-In-Time Recovery; document **RPO/RTO**
  and a tested **restore runbook**. Buyer due-diligence hard item.
- **Test:** perform a restore drill to a scratch project; record results in Appendix D.

### 2.6 — Staging env + non-zero minInstances (C6)
- **Task:** separate a staging backend from production; set `minInstances >= 1` on prod in
  `apphosting.yaml` to remove cold starts (cost trade-off noted).

### 2.7 — Promote rate limiter to enforcing (S1)
- **Task:** using 2.3 dashboards, tune thresholds (generous for shared classroom IPs;
  allowlist; IP+username keying) and flip the limiter from shadow to **enforcing** (429).
- **Test:** e2e — N+1 logins → 429; classroom-simulated shared IP within threshold not blocked.

### Phase 2 Definition of Done
1. Errors tracked with PII scrubbed; admin actions audited.
2. Health check monitored; alerts on error-rate/latency live; dashboard exists.
3. Backups/PITR enabled with a tested restore runbook and documented RPO/RTO.
4. Load-test baseline recorded; limiter promoted to enforcing with tuned thresholds.
5. Staging separated; prod cold starts removed.

---

## Phase 3 — Compliance & data governance  ·  Mode: MAX  ·  🚦 product go/no-go before start

**Objective:** Make children's-data handling defensible — the single biggest *legal* blocker to
a corporate sale. Cross-functional (Legal + Eng); this roadmap covers the engineering
deliverables and flags the legal ones.
**Gate to start:** explicit product/legal go/no-go. Phase 2 audit log + backups in place.

### 3.1 — Compliance posture doc (C2) — *legal-led, eng-supported*
- **Deliverable:** a `SECURITY.md` + `COMPLIANCE.md` covering COPPA (US), GDPR-K (EU),
  Israeli Privacy Protection Law: lawful basis, **parental/guardian consent** capture,
  **data minimization** audit (what we store vs. need — we store usernames + progress; confirm
  no unnecessary PII), **retention policy**, sub-processor list, and a **DPA** template.

### 3.2 — Data export + erasure endpoints (C2) — **design org-aware up front (Δ4)**
- **Task:** authenticated **self-service export** (a user/guardian downloads their data) and
  **erasure** (right to be forgotten) endpoints. Erasure must delete `users/{id}` +
  `user_progress/{id}` + any audit/PII, and be **designed org-aware now** (Phase 4 introduces
  orgs; "delete a student" changes meaning when a teacher/roster owns records — don't build a
  contract Phase 4 has to rewrite). Coordinate with the existing admin `DELETE` (which already
  removes `users` + `user_progress`).
- **UX (SeniorProductDesigner):** export/erasure + consent screens — touch-first, a11y, RTL,
  Hebrew, shared UI library.
- **Test:** unit — export returns the full bundle; erasure removes every PII-bearing doc and is
  idempotent. e2e — request → data gone; session invalidated.

### 3.3 — Retention jobs (C2)
- **Task:** scheduled deletion of inactive/expired accounts per the retention policy; log to
  the audit trail.
- **Test:** unit — job selects only past-retention records.

### 3.4 — Commit `firestore.rules` deny-all (S10)
- **Task:** commit an explicit `firestore.rules` denying all client access (defense-in-depth,
  since only the Admin SDK is used) + a threat-model note. Add to `firebase.json`.
- **Test:** rules deny a simulated client read/write.

### Phase 3 Definition of Done
1. Compliance posture documented; DPA template ready.
2. Working, tested, **org-aware-designed** export + erasure endpoints.
3. Retention jobs running and audited.
4. `firestore.rules` deny-all committed.

---

## Phase 4 — Multi-tenancy & scale  ·  Mode: MAX  ·  🚦 product go/no-go + own MAX plan

**Objective:** The actual "sell to a company" unlock: org isolation, org roles, and removal of
the scale bottlenecks. **This is the largest and most irreversible phase — a storage-schema
migration.** It gets its **own dedicated MAX plan** with a backfill + rollback runbook per
`AGENTS.md` Data & Storage Rules (auto-escalate on `lib/*/storage.ts`).
**Gate to start:** Phases 1–3 merged; explicit product go/no-go. **Do not start before Phase 1
(session integrity) lands.**

### 4.1 — Tenant/org data model (C1)
- **Design (partition-key-first — Dev_Architect):**
  - New `orgs` collection (org id, name, plan, created).
  - Add `orgId` + richer `role` (`school-admin` | `teacher` | `parent` | `student`, superset of
    today's `user|admin`) to `users` **and** to `user_progress`.
  - **Every query scoped by `orgId` from day one** — retrofitting isolation later is how tenant
    data leaks. Login, admin list, progress read/write all filter by `orgId`.
  - Org-scoped admin: a school-admin manages only their org's users; a super-admin (us) spans
    orgs.
- **Backward-compat / migration:** existing single-tenant users backfilled into a **default
  org**; dual-read compatibility window; `bundleVersion`-style additive change to the progress
  doc. Full backfill + rollback runbook is the first deliverable of the Phase 4 plan.
- **Regression anchors:** `multi-user-isolation.spec.ts` MUST stay green; add a new
  `tests/e2e/tenant-isolation.spec.ts` proving a user in org A cannot read/write org B.

### 4.2 — Admin pagination (C4)
- **Task:** paginate `admin/users` GET (cursor/limit) instead of `orderBy().get()` all;
  scope to the caller's org.
- **Test:** unit — pagination returns bounded pages; e2e — large org list paginates.

### 4.3 — Progress-doc contention / sizing (C5)
- **Task:** using Phase 2.4 load-test data, decide whether to split `user_progress/{userId}`
  into per-domain subcollections (workbook/exam/review) to cut whole-doc write contention and
  stay clear of the 1 MB ceiling. Preserve the merge semantics + backward-compat.
- **Test:** merge/sync unit suite stays green; load test shows reduced contention.

### 4.4 — Migration + rollback runbook
- **Deliverable:** step-by-step backfill (single-tenant → default org), verification queries,
  and a rollback path. Dry-run on a scratch project first.

### Phase 4 Definition of Done
1. Org model live; every query org-scoped; tenant-isolation e2e green.
2. Org-scoped roles (school-admin/teacher/parent/student) enforced.
3. Admin list paginated; progress-doc contention addressed per load-test evidence.
4. Existing users migrated into a default org with a tested rollback path.
5. Both regression anchors + new tenant-isolation spec green.

---

## Phase 5 — Freemium access gating (logged-out daily limit)  ·  Mode: ULTRA  ·  🚦 product go/no-go before start

**Objective:** Cap free usage for logged-out (unregistered) visitors to create pressure toward
account creation — an anonymous visitor may work **one workbook day, in one subject, per calendar
day**. Today a logged-out visitor gets the whole app unrestricted (finding **M1**); this phase adds
a metered free tier.
**Gate to start:** product go/no-go. No server-schema change, so it is **independent of Phases 1–4**
— but **non-bypassable** enforcement depends on real accounts (Phase 1 sessions) plus a future
self-registration flow (see 5.4).

### 5.1 — Anonymous daily-usage store (client, localStorage) (M1)
- **Design (additive, MAX-free):** new module `lib/access/anonDailyLimit.ts` backed by a **brand-new**
  key `kids_math.anon.dailyUsage.v1` holding the single claimed slot for today:
  `{ date: "YYYY-MM-DD", subject, dayId }`. **Reuse `getTodayDate()`** from `lib/streak/engine.ts`
  for the local-day stamp.
- **Semantics:** the first workbook day an anonymous visitor opens *claims* today's slot. Re-opening
  the **same** day is always allowed (so they can finish it). Opening any **other** `dayId` or any
  **other subject** while `!isLoggedIn` and `date === today` is **blocked**. Resets at local midnight
  (date change) or on login.
- **Storage rule:** new key only — do **not** touch any `lib/*/storage.ts` progress schema (keeps
  this out of the storage-schema MAX rule). Anon-only, never synced to the server.

### 5.2 — Gate at day entry
- **Task:** gate the day hub / section entry on `!isLoggedIn && isBlockedByAnonDailyLimit(track, dayId)`
  (read `isLoggedIn` from `lib/auth/context.tsx`). Hook points: the day-hub screens rendered under
  `app/{grade,english,science}/**/day/[id]`.
- **UX:** reuse the `components/screens/LockedGradeScreen.tsx` lock-screen pattern + the shared UI
  library (rule 4). RTL Hebrew. CTA = "log in to keep learning" opening the existing
  `components/auth/LoginModal.tsx`; friendly "come back tomorrow, or log in" copy.

### 5.3 — Copy, testIds, voice review
- **Task:** `data-testid` via `lib/testIds.ts`; Hebrew niqqud + read-aloud review of the new
  lock-screen copy per CLAUDE.md rules 11–12 (numbers/taps only; spoken-content review).

### 5.4 — Companion / prerequisite (flag — not built in this phase)
- Self-registration does **not** exist yet (accounts are admin-created). This phase's gate uses the
  existing login; a self-service **signup** flow is the natural companion so blocked visitors can
  self-serve an account. Track as a separate follow-up before this cap ships to real traffic.

### Known limitation (state explicitly)
The cap is **client-side only** → bypassable by clearing `localStorage`, incognito, or another
browser. It is a **soft conversion nudge, not DRM**. Non-bypassable metering needs a **server-side
per-account entitlement** layer (depends on accounts / Phase 1) — out of scope for this phase.

### Phase 5 quality gates
ULTRA: multi-role review → `npm run test:qa` on PR CI → Playwright visual on the new lock screen →
verification report. No `lib/*/storage.ts` change (new anon key only), so no storage-schema MAX
escalation.

### Phase 5 Definition of Done
1. Anonymous visitor can do exactly one day, one subject, per calendar day; the same day stays
   re-openable; resets next local day.
2. Logged-in users entirely unaffected.
3. Lock screen with login CTA — RTL, a11y, TTS-reviewed, shared UI.
4. Client-only limitation documented; server-entitlement follow-up + self-registration companion
   captured.
5. No `lib/*/storage.ts` schema change; `multi-user-isolation` + `auth-backward-compat` anchors green.

**Tests:** unit — claim / allow-same-day / block-other-day / block-other-subject / reset-on-date-change
/ never-block-when-logged-in. e2e — anon opens day 1 (allowed) → opens day 2 (locked screen) → logs
in (unlocked).

---

## Cross-cutting rules (apply to every phase)

- **Backward compatibility is sacred.** `multi-user-isolation.spec.ts` and
  `auth-backward-compat.spec.ts` are the two regression anchors — they must stay green through
  every phase. Learner data in `localStorage` and `user_progress` must survive deploys
  (CLAUDE.md rule 5; `AGENTS.md` Data & Storage Rules).
- **Additive, not destructive:** new fields default-absent ⇒ old behavior (the `bundleVersion`
  and `tokenVersion` pattern).
- **No weakened configs** (rule 7): every change tightens security posture; fix code, not
  eslint/tsconfig.
- **No `any`; `data-testid` via `lib/testIds.ts`; route builders via `lib/routes.ts`;
  RTL-first.**
- **Tests run on the PR's CI** (saved preference); locally only fast gates
  (tsc/lint/testids/unit).
- **Per-phase Learning Loop:** append a `LEARNING_LOG.md` entry on completion.

## Consolidated risk register

| Risk | Severity | Mitigation |
|------|----------|------------|
| Auth change locks out live 30-day sessions | CRITICAL | Additive `tokenVersion` (absent ⇒ valid); `auth-backward-compat.spec.ts` green; staged rollout |
| Multi-tenant migration orphans learner data | CRITICAL | Own MAX plan; default-org backfill; dual-read window; rollback runbook; dry-run |
| Rate limiter is per-instance / bypassable | HIGH | Shared-state store from the start (never in-memory) |
| Rate limiter false-positives on shared classroom IPs | HIGH | Shadow mode first; IP+username keying; generous thresholds; allowlist; tune on dashboards |
| CSP breaks TTS/audio/inline styles | MEDIUM | `Report-Only` first, enforce after soak |
| Spoofable forwarded headers defeat IP limiting / `secure` flag | MEDIUM | S11 spike verifies trusted proxy header before keying on IP |
| Observability leaks children's PII | HIGH | Scrub usernames/tokens at SDK init; deny-list |
| Erasure contract rewritten by Phase 4 tenancy | MEDIUM | Design export/erasure org-aware in Phase 3 |
| Compliance scope creep blocks eng | MEDIUM | Split legal vs eng; eng ships export/erasure/retention primitives regardless |
| No DR proof at due diligence | HIGH | Phase 2 PITR/backups + tested restore drill + RPO/RTO |
| Client-side daily cap trivially bypassed (clear storage / incognito) | MEDIUM | Frame as soft nudge; real metering needs server entitlement (accounts) — revisit post-Phase 1 |
| Freemium cap frustrates a legit shared/family device (multiple children) | MEDIUM | Generous "one day" scope; clear login CTA; a logged-in account removes the cap entirely |

## Sequencing rationale

- **0 → 1 → 2** are pure hardening, continuously shippable, low regression risk.
- **0.0 (proxy spike) precedes 0.1 (limiter)** because IP-keying depends on it.
- **Limiter ships shadow (0.1) and enforces later (2.7)** so thresholds are tuned on real data
  — this resolves the only open review concern (classroom false-positives).
- **3 (compliance) and 4 (tenancy) each need a product go/no-go** and are the true "sellable"
  unlocks; 4 is last because it's the largest and most irreversible, and its erasure semantics
  depend on the org model designed-for in 3.

---

## Multi-role approval (recorded at plan time)

Round 1 (9/9 participated) + Round 2 (9/9, all APPROVE, prior CONCERN cleared). Key findings:
- **SeniorDev_TechLead:** limiter must be shared-state; isolate irreversible Phase 4; additive
  `tokenVersion`.
- **Dev_Architect:** `orgId` partition-key from day one; revisit single progress doc; add secret
  rotation.
- **QA_Architect:** two regression anchors are sacred; add backups/PITR + RPO/RTO; tighten build
  lint.
- **SeniorFrontEnd_TechLead:** CSP Report-Only first; RTL on new screens.
- **SeniorAutomation_Engineer:** concrete new unit/e2e files enumerated per phase.
- **SeniorQA_Engineer:** shadow-mode limiter resolves classroom false-positive concern; PII
  scrubbing.
- **SeniorProductDesigner:** consent/export/erasure UX org-aware + "log out everywhere".
- **SeniorProductManager:** go/no-go gates before Phases 3 & 4; backups/DR are due-diligence
  items.
- **MoE_PedagogyLead:** no educational-content change — N/A.

---

## Progress tracker

| Phase | Title | Mode | Gate | Status |
|-------|-------|------|------|--------|
| 0 | Security quick wins | ULTRA | none | ✅ Completed (`claude/roadmap-quick-wins-vdg7z7`) |
| 1 | Session integrity & auth hardening | MAX | Phase 0 | ✅ Completed ([#70](https://github.com/RoieArgaman/kids_math/pull/70)) — S4/S7/S8/S12; all CI green |
| 2 | Observability, DR & ops | ULTRA | Phase 0 | ⬜ Not started |
| 3 | Compliance & data governance | MAX | 🚦 go/no-go + Phase 2 | ⬜ Not started |
| 4 | Multi-tenancy & scale | MAX | 🚦 go/no-go + Phases 1–3 | ⬜ Not started |
| 5 | Freemium access gating (logged-out daily limit) | ULTRA | 🚦 go/no-go | ⬜ Not started |

---

## Appendices (filled in as phases execute)

- **Appendix A — Proxy trust / client-IP contract** (Phase 0.0):
  - **Contract (implemented in `lib/security/clientIp.ts`):** the client IP is read from
    `X-Forwarded-For` counting from the **right**, because on Firebase App Hosting (Google Front
    End / Cloud Run) the trusted proxy *appends* the IP it observed to the right of the chain, while
    a malicious client can only *prepend*. `getClientIp` therefore takes the entry at
    `TRUSTED_PROXY_HOPS` (currently `0` ⇒ right-most), ignoring any client-prepended spoof, and falls
    back to `x-real-ip` then the sentinel `"unknown"`.
  - **`x-forwarded-proto`:** used only to set the cookie `secure` flag (login + grade-unlock). Trusted
    as set by the front end; unchanged in Phase 0.
  - **⚠️ Verify-before-enforce:** `TRUSTED_PROXY_HOPS` is a best-effort default. Because the limiter
    runs shadow-only in Phase 0, an off-by-one cannot lock anyone out. **Before promoting the limiter
    to enforcing (Phase 2.7), confirm empirically** — inspect real `X-Forwarded-For` values from App
    Hosting logs — how many hops the platform appends, and bump `TRUSTED_PROXY_HOPS` if there is an
    extra internal hop.
  - **Refresh / rollback:** the whole phase is additive & reversible — revert the PR or toggle
    `PROGRESS_BODY_CAP_ENFORCE`; the shadow limiter's `rate_limits` docs are inert and safe to drop.
    No schema/storage migration, so existing sessions and progress are never at risk.
- **Appendix B — JWT-secret rotation runbook** (Phase 1.5):
  - **Goal:** replace `JWT_SECRET` without stranding users or leaving a leaked secret valid for
    its full 30-day window.
  - **Precondition (shipped in Phase 1):** sessions are revocable via `tokenVersion`
    (`lib/auth/jwt.server.ts` signs it; `lib/auth/session.server.ts` `verifySession` enforces it on
    data/admin routes and `/api/auth/me`). Tokens carry `HS256` signed with the single active secret.
  - **Rotation procedure (planned dual-verify window — not yet coded; design of record):**
    1. Generate a new ≥32-char secret; add it as a **new version** of the `kids-math-jwt-secret`
       Secret Manager secret. Do **not** remove the old version yet.
    2. Introduce a brief **dual-verify** window: `verifyToken` tries the new secret, then falls back
       to the old (accept either) while **signing only with the new**. (Implementation note: extend
       `getSecretKey` to read `JWT_SECRET` + optional `JWT_SECRET_PREVIOUS`.)
    3. Deploy. New logins/refreshes now mint tokens under the new secret; existing tokens still verify
       under the old.
    4. After the max session age (or sooner, if you also bump `tokenVersion` fleet-wide to force
       re-auth), **remove** `JWT_SECRET_PREVIOUS` and the old Secret Manager version. Single-secret
       state restored.
  - **Emergency (secret leaked):** rotate as above but immediately force re-auth by bumping every
    user's `tokenVersion` (a maintenance job) — this invalidates all outstanding tokens on the
    version-checked routes without waiting out the window.
  - **Rollback:** keep the old secret version until step 4; reverting the deploy re-accepts old tokens.
- **Appendix C — Load-test baseline** (Phase 2.4): harness ready
  ([`scripts/load/progress-load.js`](../scripts/load/progress-load.js), sub-PR 2C). _Baseline
  numbers TBD — paste throughput / login p95 / push p95 / error rate / the `PUSH_VUS`
  contention knee here after a run, with date + target + commit SHA._
- **Appendix D — Backup/restore drill results, RPO/RTO** (Phase 2.5): _TBD._

---

## How to extend this roadmap

- Add new findings to the **Findings register** with a stable `S#`/`C#` id and a target phase.
- When a phase completes, flip its **Progress tracker** row to ✅, fill its appendix, and add a
  `LEARNING_LOG.md` entry.
- Keep this file the single source of truth for the hardening effort; per-phase `/plan` runs
  reference it rather than duplicating it.
