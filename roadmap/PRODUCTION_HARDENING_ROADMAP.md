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
`/plan` (PRO/ULTRA/MAX per its risk) before implementation. **Progress so far: Phases 0, 1 & 2 ✅
done** (Phase 1 via [#70](https://github.com/RoieArgaman/kids_math/pull/70); Phase 2 ops completed
2026-07-17/18, incl. the C9 relocation); **Phase 3 planned** (scope revised 2026-07-18 — soft
delete, not erasure); **Phase 3.5 planned and NEXT UP** (design system & desktop, added
2026-07-18); **Phases 4–5 not started.** See the Progress tracker at the bottom for live
status.

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
| **S18** | **Local learner data is never torn down on revocation.** `lib/auth/context.tsx:118` receives a 401 from `/api/auth/me` and simply returns — it never clears localStorage or the owner marker. Today the window is bounded because a deleted account truly vanishes; under soft delete it becomes the permanent steady state, so a deleted child's full workbook/badges/exam state stays on the device and renders to the next anonymous visitor. On a shared school or family device this is a privacy **regression introduced by a privacy phase**. Related: `pushUserProgress` swallows the 401, so post-revocation work is lost with no UI signal. | HIGH | `lib/auth/context.tsx:57,118`, `lib/user-data/api.ts:386-397` | 3 |
| **S14** | **Soft delete revokes *sync*, not *access*.** No page or layout calls `verifySession` — only the five API routes do; `middleware.ts` skips `/api/*` and its matcher covers only grade-B subtrees, gated on **anonymous one-year** cookies. Content is static and progress is localStorage. A soft-deleted child therefore keeps the whole app (incl. grade-B) and loses only cross-device sync. Acceptable as *product bookkeeping*; **must not be described as access removal** in `COMPLIANCE.md`. Mitigations: clear grade-B cookies on soft delete (as `logout` does), and make a 401 from `/api/auth/me` a hard client sign-out. | HIGH | `middleware.ts:41,79`, `lib/server/gradeUnlockCookies.ts:17-25` | 3 |
| **S15** | **Login lockout interaction is an enumeration oracle** — bigger than the timing channel. The real 401 body is `{ error, attemptsRemaining }`, so a bare `{ error }` on the lifecycle path is distinguishable without timing. And if a deactivated account doesn't record failures it **never locks out**: 6 wrong passwords ⇒ 429 for active accounts, 401 forever for deactivated ones. Mirror risk: a check placed after `clearLockout` lets a deactivated user with the right password reset that username's counter on demand. | HIGH | `app/api/auth/login/route.ts:79-88` | 3 |
| **S16** | **No self-deactivation or last-admin guard.** `DELETE` guards `userId === admin.userId`; the new lifecycle actions have no equivalent, and no last-admin check exists anywhere. An admin can deactivate themselves or the last other admin; the same-transaction `tokenVersion` bump kills sessions instantly and `requireAdmin` then 403s everyone. Recovery needs direct Firestore credentials via `scripts/create-user.mjs`. | MEDIUM | `app/api/admin/users/route.ts:201,21-25` | 3 |
| **S17** | **`ignoreUndefinedProperties: true` makes the dangerous direction silent.** Since absent ⇒ active, any write producing a lifecycle field as `undefined` (partial spread, or a `set` built from a pre-field snapshot) is **dropped by the SDK without error** and the account reads active. The usual throw-on-undefined guardrail is disabled project-wide, so this fails invisibly. Write explicit literals via `tx.update`; assert field **presence**, not just value. | MEDIUM | `lib/firestore/admin.ts:28` | 3 |
| **S13** | **Full-document overwrite on `users` can resurrect revoked state.** Both writers do `tx.set(ref, { ...snap.data(), <field> })` — a whole-doc write built from an earlier snapshot. Today the only mutable field is `tokenVersion`, so this is safe *by luck*. The moment a second mutable field exists (Phase 3 `status`), a concurrent "log out everywhere" can write back stale flags and **silently un-delete a soft-deleted account**. Fix: `tx.update()` with only the fields each writer owns. | HIGH | `app/api/auth/logout-all/route.ts:27`, `app/api/admin/users/route.ts:169` | 3 |

### Scale / sellability

| ID | Finding | Severity | Phase |
|----|---------|----------|-------|
| **C1** | No tenant/org model — flat `users`, no school/class grouping, no teacher/parent roles. Blocks selling to any organization. | CRITICAL (for sale) | 4 |
| **C2a** | Children's-data compliance posture not evidenced — COPPA / GDPR-K / Israeli Privacy Law: lawful basis, retention policy, sub-processors, DPA, and **data export**. | CRITICAL (for sale) | 3 |
| **C2b** | **No true erasure** ("right to be forgotten"). Phase 3 ships *soft* delete (record retained, reversible) — deliberately **not** erasure. Permanent erasure is a **destructive, org-scoped privilege**: it belongs to the super-admin who spans organizations, who may delegate it to an org admin. That role does not exist until the org model lands, so erasure is sequenced with it. Until then we can export and deactivate, but **cannot honestly claim erasure** — `COMPLIANCE.md` must say so plainly. | CRITICAL (for sale) | 4 |
| **C3** | No observability — no error tracking, metrics, uptime, alerting. | HIGH | 2 |
| **C4** | Admin users list unbounded (`orderBy().get()`, no pagination) → breaks past a few hundred users. Worse than it looks: the list also does **one `checkLockout` read per user** (N+1). **Phase 3 accelerates this** (see C11) — reconsider pulling it forward. | MEDIUM | 4 (review timing) |
| **C10** | **Admin `DELETE` is a partial erasure.** It removes `users/{id}` + `user_progress/{id}` but leaves `account_lockouts/{sha256(usernameLower)}` — a record derived from the child's username — behind. Superseded in Phase 3 (delete becomes *soft*, nothing is removed), but it is the exact gap the Phase 4 erasure path must close, and it means any pre-Phase-3 "we deleted them" claim was incomplete. `rate_limits` is **not** affected: its doc ids are `sha256(key)` where the key embeds a client IP, so rows are neither derivable nor persistent (60s window + TTL policy). | MEDIUM | 4 (with C2b) |
| **C11** | **`users` grows monotonically after Phase 3.** Soft-deleted accounts are never purged (no erasure until Phase 4) and their usernames stay permanently taken. Combined with the unbounded N+1 admin list (C4), read cost and latency rise forever and never fall. Mitigated short-term by hiding deleted users from the default list view. | MEDIUM | 4 (with C4) |
| **C5** | Single `user_progress` doc grows unbounded; whole-doc read+write per push → contention + cost at scale; 1 MB ceiling. | MEDIUM | 4 |
| **C6** | `minInstances: 0` (cold starts); no separated staging env; single region. | MEDIUM | 2 |
| **C7** | No load/perf test or documented capacity targets. | MEDIUM | 2 |
| **C8** | No Firestore backups / PITR; no RPO/RTO or restore runbook (buyer due-diligence item). | HIGH | 2 |
| **C9** | **Cross-region + far-from-users topology:** app ran in `us-east4` (Virginia), Firestore in `europe-west1` (Belgium), users in Israel — every DB call crossed the Atlantic (~4/login). Login p95 ≈ 16s under burst. **Fixed 2026-07-18:** relocated the app to **`europe-west4`** (Netherlands — nearest App Hosting region to Firestore's europe-west1; europe-west1 itself isn't an App Hosting region) via a new backend `kids-math-eu`, cutting over to `kids-math-eu--…europe-west4.hosted.app`. With `minInstances:3`, a clean load test (100% checks, 0% failures) showed **login median ~675ms / p95 ~3.1s** (from ~16s) and **progress-push median ~317ms / p95 ~2.2s**; `TRUSTED_PROXY_HOPS=2` + enforcement re-verified on the new backend; monitoring re-pointed (new uptime check + alert). Weekly load-test `schedule` **enabled** with thresholds re-based on the measured baseline. **Old `us-east4` backend decommissioned 2026-07-18** (old URL now 404; its uptime check removed) — relocation complete end-to-end. See [`C9_RELOCATION_RUNBOOK.md`](../.claude/docs/C9_RELOCATION_RUNBOOK.md). | HIGH | ✅ **Resolved** |

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
| **UX3** | **Guardian-consent capture** has no flow. Split out of Phase 3.5 (2026-07-18): consent is a product/UX problem — who consents, how it is evidenced, what happens when it is withheld or withdrawn — not a document, and designing it for guardians of 6–8-year-olds is a task in its own right. `COMPLIANCE.md` documents the *posture*; capturing consent is separate. | MEDIUM (compliance/UX) | Backlog (own ULTRA task) |

### Design system & responsive (surfaced 2026-07-18 by the FE-framework design QA)

Sourced from the `Full App QA Report` design-QA pass (20 screens, mobile + desktop, ~60
findings). Every claim below was re-verified against current source before being recorded here.
Where the report and the code disagreed, the **code** is recorded.

| ID | Finding | Severity | Phase |
|----|---------|----------|-------|
| **D1** | **No desktop layout exists.** `main { width: min(100%, 720px) }` caps every screen, and the tree contains **43 `sm:` utilities, 1 `md:`, 1 `lg:`, 0 `xl:`** — on any wide screen the whole product is a mobile column in empty gutters. Worst on the dense screens (Home's day cards, 35+ badge gallery, 3-subject picker, Parent Dashboard, Admin Users). | HIGH (UX) | 3.5 |
| **D2** | **Token drift from the repo's own documented standard.** `.claude/docs/UI_COMPONENTS.md` fixes card radius at `20px`, yet **10 distinct radii** ship (`2xl`×50, `xl`×28, `3xl`×24, `[22px]`, `[18px]`, `[24px]`, `[20px]`, `[26px]`, `[14px]`, `[13px]`); "interactive purple" has 5+ values (`#6d28d9`×32, `#a78bfa`×16, `#8b75cc`×15, `violet-700`, `violet-900`); card titles use both `--title` and `text-violet-900`; the accent rail is 4px/5px/6px. **Note: the source report said "at least four radii" — it is ten.** | HIGH (UX) | 3.5 |
| **D3** | **Touch targets fall under the project's own 44px rule in clusters.** TopBar login is `px-3 py-1.5` inside an `h-10` bar (physically capped at 40px); Plan day-chips are `min-h-10 min-w-10` (40px) and a child taps them to open a day; Admin Users rows carry up to 7 actions at `px-3 py-1.5 text-xs` (~30px); login + admin inputs ~36–40px. | HIGH (a11y) | 3.5 |
| **D4** | ~~**Tailwind v4 migration (#101) needs a sweep**~~ — **audited 2026-07-18 (3.5.1): no regressions, no code change.** All three suspected v4 hazards came back clean. **(a) Default border color** (`gray-200`→`currentColor`): a precise audit — border *width* utility with no border *colour* utility on the same element — found **2** candidates, both **false positives** (`DayCard.tsx:72` colours via inline `style.borderInlineStartColor`; `BadgeGalleryScreen.tsx:217` colours via `TIER_BORDER` in both branches). The "56 sites" figure in the original plan was a **crude grep artifact** (`border` matched inside `border-slate-200` etc.), not a real count. **(b) Focus rings** (default 3px→1px): **no bare `ring` utility exists** — all 16 uses are explicit `ring-1`/`ring-2`, and all 11 `outline-hidden` sites pair with a visible ring. **(c) Shadow scale** (`shadow-sm`→`shadow-xs`): 29 `shadow-xs`, **zero** stale `shadow-sm` — #101 renamed them all; elevation did not flatten. **⚠️ (d) CORRECTION — a fourth hazard WAS a live regression, missed by the 3.5.1 audit and fixed separately in 3.5.1b.** See D9. | ~~HIGH~~ | 🟡 **(a)(b)(c) resolved no-op; (d) was real** |
| **D5** | **Duplicated components.** Two different day-card designs (Math `<DayCard>` vs English/Science hand-rolled); two "centered panel" shells (`LockedGradeScreen` vs `CenteredPanel`); three loading treatments; Grade Picker hand-rolls cards instead of the exported `<ActionCard>`; Privacy resizes `HeroHeader` with `!important`. | MEDIUM | 3.5 |
| **D6** | **"Locked" is opacity on the whole card in 16 places**, at three different values (`opacity-60`, `opacity-50 grayscale`). **Measured 2026-07-18 (3.5.1):** muted hint text at `opacity-60` sits at **2.03:1** on white / **2.00:1** on cream — AA needs **4.5**. This is a hard failure, not a borderline one. Even `--muted` at *full* opacity on the locked surface only reaches **3.39:1**, so the fix needs its own darker token: `--locked-muted: #6f6880` measures **4.89:1** ✅. Tokens + `.is-locked` landed in 3.5.1; **adoption at the 16 call sites is 3.5.2**. | MEDIUM (a11y) | 3.5 |
| **D7** | **Admin area is off-palette** — `slate-*` text/borders/inputs make it look like a different product than the warm learner UI. | MEDIUM | 3.5 |
| **D9** | **🔴 LIVE v4 REGRESSION — the whole design-token layer was silently dead in production.** Tailwind v4 **removed** the v3 shorthand `text-[--token]`; the class still *compiles* but emits `color: --title` — **invalid CSS the browser discards**. **43 usages across 14 files** had been inert since #101 shipped. Not all were visible: `--title` (#2c2348) happens to equal `--foreground`, so titles inherited an identical colour and looked fine — which is exactly why this survived review. But `--muted` rendered dark instead of grey, `--accent` inherited, `bg-[--track]` went transparent (progress-bar tracks vanished), and `border-[--border]` fell back to `currentColor`. **Fixed in 3.5.1b** by rewriting all 43 to the explicit `[var(--token)]` form (valid in both v3 and v4); verified by asserting **zero** `color:--*` declarations in the compiled CSS. | HIGH | ✅ **Fixed (3.5.1b)** |
| **D8** | Smaller UX defects: next-badge banner `truncate`s its own description to nothing; badge tooltip clips off-screen on the first row; inline retry button wraps mid-line; DayCard shows its emoji twice; exam results nest a bordered card inside a bordered panel; PlanScreen uses brittle `km.autogen.*` testids. | LOW–MEDIUM | 3.5 |

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
- **Status:** runbook shipped in **sub-PR 2D** —
  [`DISASTER_RECOVERY_RUNBOOK.md`](../.claude/docs/DISASTER_RECOVERY_RUNBOOK.md) (PITR + daily
  backups enable steps, RPO ≤ 1h / RTO ≤ 4h targets, restore-to-new-DB procedure, and the
  required drill). **Enabling PITR/backups + running the drill are owner actions** (gcloud/
  console) → Appendix D.

### 2.6 — Staging env + non-zero minInstances (C6)
- **Task:** separate a staging backend from production; set `minInstances >= 1` on prod in
  `apphosting.yaml` to remove cold starts (cost trade-off noted).

### 2.7 — Promote rate limiter to enforcing (S1)
- **Task:** using 2.3 dashboards, tune thresholds (generous for shared classroom IPs;
  allowlist; IP+username keying) and flip the limiter from shadow to **enforcing** (429).
- **Test:** e2e — N+1 logins → 429; classroom-simulated shared IP within threshold not blocked.
- **Status:** enforcing **code** shipped in **sub-PR 2E** (staged, flag-gated **OFF**):
  `enforceRateLimit` + `rateLimitedResponse` + `rate_limits` `expiresAt` TTL field, wired on
  login (IP+username), progress POST (userId), and admin mutations (adminId). Fail-open
  preserved. Ships behaviourally identical to shadow until `RATE_LIMIT_ENFORCE=1` is set in
  `apphosting.yaml`. **The flip is the final owner action**, gated on: (1) dashboards confirm
  thresholds don't false-positive shared classroom IPs; (2) `TRUSTED_PROXY_HOPS` verified vs.
  real `X-Forwarded-For` logs (Appendix A); also add a **Firestore TTL policy on
  `rate_limits.expiresAt`** (console). Unit-tested at 100% incl. login/progress 429 integration;
  the e2e 429 case isn't feasible in CI (e2e mocks Firestore at the network layer + enforcement
  is flag-off there), so it's covered by the integration tests instead.

### Phase 2 Definition of Done
1. Errors tracked with PII scrubbed; admin actions audited.
2. Health check monitored; alerts on error-rate/latency live; dashboard exists.
3. Backups/PITR enabled with a tested restore runbook and documented RPO/RTO.
4. Load-test baseline recorded; limiter promoted to enforcing with tuned thresholds.
5. Staging separated; prod cold starts removed.

---

## Phase 3 — Account lifecycle, data export & governance  ·  Mode: MAX  ·  🚦 go/no-go given 2026-07-18

> **Scope changed at plan time (2026-07-18).** This phase was originally "Compliance & data
> governance" and was to ship **erasure**. Product decided the opposite model: **soft delete** —
> a reversible account lifecycle where the record is *retained*, not removed. True erasure is a
> destructive, org-scoped privilege that belongs to the super-admin role, which does not exist
> until the org model lands, so **C2b moves to Phase 4**. Finding **C2** is split accordingly:
> **C2a** (posture + export + retention) here, **C2b** (erasure) in Phase 4.
>
> **Consequence, stated plainly:** this phase closes **🟡 partially complete**. We will be able to
> export and deactivate, but **not** erase. `COMPLIANCE.md` must say exactly that and name Phase 4
> — a compliance doc that overclaims is worse at due diligence than one showing a dated roadmap.

**Objective:** Give accounts a real lifecycle (active / deactivated / deleted), ship admin-operated
data export, and lay the governance groundwork — without deleting anything irreversibly.
**Gate to start:** ✅ given. Phase 2 audit log + backups in place.

### 3.0 — Fix the full-document overwrite (S13) — *lands first, standalone*
- **Task:** switch `tx.set(ref, { ...snap.data(), … })` → `tx.update(ref, { …owned fields })` in
  `app/api/auth/logout-all/route.ts` and `app/api/admin/users/route.ts` PATCH. Both already guard
  `if (!snap.exists)`, so `update()`'s missing-doc failure mode is covered — **verify before changing**.
- **Why first:** without it, a concurrent "log out everywhere" can write back a stale snapshot and
  **silently resurrect** a soft-deleted account. It is a correctness fix that stands on its own merit
  independently of the rest of the phase.
- **Test:** deterministic stale-write replay — read snapshot → soft-delete → replay the stale write →
  assert `status` is still `"deleted"`.

### 3.1 — Account lifecycle model (single `status` field)
- **States** — one field, three values:

  | State | `status` |
  |---|---|
  | Active | `"active"` (or **absent**) |
  | Deactivated | `"deactivated"` |
  | Deleted | `"deleted"` |

- **Why one field, not two booleans** (decision 2026-07-18, after the fan-out review): `isActive` +
  `isDeleted` is **nine** states for three real ones, and the contradictory `isActive: true,
  isDeleted: true` is writable with nothing to prevent it. A single field makes the illegal state
  **unrepresentable**, cuts the test matrix from nine rows to three, and halves the exposure to the
  silent-`undefined` hazard (S17). Product behaviour is identical — only the storage differs.
- **Backward compatibility (critical):** every existing `users` doc has **no `status` field** and
  there is **no backfill**. Absent ⇒ **active**. Same additive pattern as `tokenVersion`, which
  `scripts/create-user.mjs` already relies on today (it writes no `tokenVersion` either).
- **Typed as a discriminated union**, exposed through one shared reader in
  `lib/auth/accountStatus.ts` — the absent-⇒-active rule must not drift between call sites, and this
  module (under `lib/`) is coverage-measured whereas `app/api/**` is not.
- **Revocation comes free:** a lifecycle transition also bumps `tokenVersion` in the **same
  transaction**, so Phase 1's existing S4 machinery kills every live session immediately. No new
  revocation mechanism.
- **Single enforcement point:** `lib/auth/session.server.ts` `verifySession()` already performs a
  version-check Firestore read; the lifecycle check rides that **same read** — one read, two checks,
  **zero added latency** — and thereby covers `/api/auth/me`, progress GET/POST, and every admin
  route at once.
- **Login (S2 must not regress):** `app/api/auth/login/route.ts` checks lifecycle **only after
  `bcrypt.compare` runs**, and returns a **byte-identical** generic 401. Short-circuiting earlier
  would restore the timing side-channel Phase 0 closed; a distinct "deactivated" message would leak
  account existence. A deactivated login is indistinguishable from a wrong password — test-enforced.
- **Progress is retained:** `DELETE` no longer cascade-deletes `user_progress/{id}`, otherwise
  restore is meaningless.
- **Usernames stay taken:** a deleted user's `usernameLower` remains reserved, so a restore can never
  collide with a newer account. ⚠️ Do **not** filter the admin list with `where("status","==","active")`
  — Firestore inequality filters **exclude documents missing the field**, i.e. every existing user,
  so that query returns **zero rows**. Filter in memory until C4 pagination lands.
- **UX:** confirmation **modal naming the child** ("Delete *dana*?"), stating the account can be
  restored *and* that the child is logged out immediately — mid-lesson. Deleted rows recessed, not
  merely labelled; reuse the existing `lockedBadge` visual language. RTL.
- **⚠️ No modal primitive exists** (Explore, 2026-07-18). `components/ui/` has `Alert`, `Card`,
  `CenteredPanel`, `Surface`, `PinInput` — **no Modal/Dialog**. The current delete flow is an
  *inline* two-button confirm (`components/screens/AdminUsersScreen.tsx:344-381`) which cannot name
  the child, and it hand-rolls local `confirmDeleteId` state instead of the catalogued
  `useArmedConfirm` hook (`lib/hooks/useArmedConfirm.ts`). So CLAUDE.md rule 4 ("reuse before
  building") is satisfiable only by **building the missing primitive**: a new
  `components/ui/ConfirmDialog.tsx` (focus trap, Esc/overlay dismiss, `aria-modal`, RTL), registered
  in `.claude/docs/UI_COMPONENTS.md` so the next destructive action reuses it rather than
  hand-rolling a third pattern. **As built:** `ConfirmDialog` is a controlled component and the screen keeps its existing local `confirmDeleteId` state; `useArmedConfirm` was not adopted, since it models an inline per-row armed state rather than a single modal.

### 3.1b — Client-side session teardown (S14, S18) — *added after the 2026-07-18 fan-out review*
> Nothing in the original 3.1 touched client code. Three reviewers independently landed here, so
> this is its own sub-PR, not an afterthought.
- **Local data is never cleared on revocation.** `lib/auth/context.tsx:118` gets a 401 from
  `/api/auth/me` and simply `return`s — it never calls the existing teardown/clear helpers. Today
  that window is bounded (the account really is gone); under soft delete it becomes the **permanent
  steady state**: a deleted child's full workbook, badges and exam state stay on the device and
  render to whoever opens the browser next. On a shared school or family device that is a privacy
  **regression** introduced by a privacy phase.
- **⚠️ The teardown trigger must be three-way, not a boolean** (Explore, 2026-07-18 — the finding
  that makes this sub-PR safe rather than destructive). The naive fix, "treat a 401 from `apiMe` as
  teardown", is **wrong**: `apiMe()` (`lib/auth/api.ts:62-69`) returns `null` for **three** distinct
  situations — an **anonymous** visitor who never logged in (the majority of traffic, and a
  first-class case once Phase 5 lands), a **revoked/401** session, and a **network error**
  (`catch { return null }`). Clearing on `null` would wipe every anonymous visitor's progress on page
  load and every logged-in child's work on a wifi blip: catastrophic data loss arrived at while
  *trying* to protect privacy.
  - **Fix:** mirror the existing `fetchUserProgressResult` precedent (`lib/user-data/api.ts:374`) —
    add `apiMeResult(): { status: "ok", user } | { status: "unauthorized" } | { status: "error" }`.
  - **Clear only when** `status === "unauthorized"` **and** `getLocalOwner()` is non-null (i.e. this
    device *was* signed in). Anonymous ⇒ never clear. Offline ⇒ never clear.
  - Teardown helpers already exist, so this needs no new storage code: `clearLocalProgress()`
    (`lib/user-data/api.ts:175`) and `clearLocalOwner()` (`:113`).
- **Work is lost silently after revocation.** `pushUserProgress` swallows the 401
  (`lib/user-data/api.ts:386-397`), `context.tsx:57` `.catch(() => {})`, `_primed` stays true and
  `scheduleSync` keeps re-arming into the void. The child keeps answering with **no UI signal** and
  nothing is saved. So "progress is retained" is true only up to the deletion instant — say so, and
  surface a signal.
- **Grade-B cookies must be cleared client-side, not server-side.** ⚠️ Corrected during Explore:
  `clearAllGradeBUnlockCookies(res, request)` (`lib/server/gradeUnlockCookies.ts:87`) writes
  `Set-Cookie` onto **the caller's own response** — which is how `logout` works. A soft delete is an
  **admin acting on someone else's account**, and the cookies live in *the child's* browser, which
  the admin's response cannot touch. Server-side clearing is therefore impossible here; it must
  happen on the child's device when the client detects revocation (below).
- **Restore must not trust the cut-off device:** the retained `user_progress` doc is frozen at the
  deletion instant while the abandoned device kept advancing. `mergeBundles` is whole-domain LWW for
  `badges`/`finalExam`/`gmat`/`streak`/`review` (`lib/user-data/merge.ts:99-105`), so a same-device
  restore can overwrite a final-exam result completed elsewhere. Force the **server-authoritative**
  (foreign-device) branch on restore.

### 3.1c — Guards the lifecycle needs to be real (S15, S16, S17, F2–F6)
- **Enforcement must be independent of `requireVersionCheck`.** `lib/auth/session.server.ts:33`
  early-returns before the Firestore read; `app/api/auth/logout-all/route.ts:18` deliberately calls
  `verifySession` with no options. Bolting the check onto the version-check branch leaves a
  soft-deleted user able to authenticate there and **write to their own doc**, bumping their own
  `tokenVersion` indefinitely. `tx.update()` does not close this.
- **Login must reject *identically*, including the lockout path** (S15): same body bytes
  (`attemptsRemaining` included), same headers, failures still recorded, check strictly **after**
  `bcrypt.compare` and **before** `clearLockout`.
- **Never express "active" as a Firestore query predicate.** Firestore **equality *and* inequality**
  filters exclude documents missing the field, so `where("status","==","active")` and
  `where("status","!=","deleted")` each match **zero** existing users. Filter in memory, like the
  existing `tokenVersion` read.
- **Username uniqueness:** three writers query `where("usernameLower","==",x).limit(1)` with **no
  `orderBy`**. If the duplicate check is ever relaxed to ignore deleted docs, two docs share a
  username and login's unordered `.limit(1)` may pick the deleted one arbitrarily. Decision of
  record: **names stay reserved**, so this stays closed — but any future change must fetch all
  matches and select the active one.
- **Admin PATCH needs a lifecycle guard** — reset and unlock currently succeed on a deleted doc
  (`exists` is still true), returning `{ ok: true }` and handing the account back.
- **Restore must be its own audited action** and re-affirm `role` explicitly; role is read from
  Firestore only at login, so restoring a deleted admin silently reinstates admin.
- **Self / last-admin guard** (S16) plus a documented recovery path.

### 3.2 — Admin-operated data export (C2a)
- **Decision:** export is **admin-operated**, not self-service. The account holder is a 6–8-year-old,
  and the only "parent" surface (`/admin/parent-dashboard`) is gated by a **client-side** PIN, which
  cannot gate a server endpoint. A guardian requests; the admin fulfils from `/admin/users`.
- **Task:** `GET /api/admin/users/export` — admin-gated (`requireVersionCheck: true`), rate-limited,
  zod-validated, audited. **Allow-list projection** (never a `delete` on a spread) so `passwordHash`
  and `tokenVersion` can never leak; export includes lifecycle state.
- **Test:** unit — exact key set asserted; no `passwordHash`/`tokenVersion`; 403 unauthenticated;
  audit row written.

### 3.3 — Retention selection (C2a) — *selector + dry run only, no automated job*
- **Task:** `lib/compliance/retention.ts` — a **pure** `selectExpiredAccounts(users, now, policy)`
  (no clock read, no I/O) plus a **read-only** `scripts/retention-dry-run.mjs` that reports what
  *would* be actioned. Selection targets **soft delete**, consistent with no hard delete this phase.
- **Deliberately not built:** an automated destructive cron. The delete path is left unimplemented so
  it cannot be wired up by accident; revisit once a real retention period is agreed and a dry run is
  reviewed.
- **Edge cases:** missing `createdAt`; boundary (`>=` vs `>` — pick and document); **admin accounts
  excluded**.

### 3.4 — Commit `firestore.rules` deny-all (S10)
- **Task:** commit an explicit `firestore.rules` denying all client access (defense-in-depth, since
  only the Admin SDK is used — which **bypasses rules entirely**, so this is inert for our traffic)
  + a threat-model note. Add a `firestore` block to `firebase.json`.
- **Deploy safety:** `deploy.yml:45` pins `--only "apphosting:kids-math-eu"`, so adding the block
  **cannot** widen the CI deploy — so the deploy pipeline now deploys the rules in a **dedicated step
  of its own**, after the app, keeping the live ruleset from drifting. Requires
  `roles/firebaserules.admin` on the deploy service account. Verify `/api/health` and a login after
  the first run.

### 3.5 — Compliance posture docs (C2a) — *engineering drafts, not legal advice*
- **Deliverable:** `SECURITY.md` + `COMPLIANCE.md` + a `DPA` template, each banner-marked
  **NOT LEGAL ADVICE — engineering posture only**: lawful basis, data-minimization audit (what we
  store vs. need), retention policy, sub-processor list, and an explicit statement of the **erasure
  gap** pointing at Phase 4.
- **Evidence worth citing:** `rate_limits` / `account_lockouts` doc ids are `sha256(...)` precisely so
  stored keys don't leak raw usernames or IPs — a pre-existing data-minimization control.
- **Split out, NOT built here:** guardian-**consent capture** is a product/UX flow, not a document.
  Tracked as its own task (see UX3 below).
- Hebrew privacy page (`app/privacy/page.tsx`) gains a data-rights + retention section — user-facing
  copy, so it takes the spoken-content/voice review (CLAUDE.md rule 12).

### 3.6 — Test infrastructure (prerequisite, not optional)
- **`tests/unit/app/api/fakeFirestore.ts` cannot currently test this phase.** Three surgical edits:
  (1) expose `.ref` on query snapshots (~4 lines) — login reaches the user via a `usernameLower`
  query and never holds a docRef, so query-then-update is impossible today;
  (2) add `update`/`delete` to the transaction `tx` and **buffer writes until `fn` resolves** — today
  `set` is fire-and-forget `void ref.set(data)`;
  (3) an opt-in `strictUpdate` flag so `update()` on a missing doc rejects like real Firestore
  `NOT_FOUND`. **No production code calls `.update()` today**, so the fake's existing `update` is
  unexercised dead code whose `?? {}` silently *creates* missing docs — it would green-light a 200
  where production 500s.
- **Race testing:** do **not** build a retry/contention model. Add a ~3-line `onTransactionRead` hook
  so a test can inject the soft-delete between the read and the commit — that reproduces S13 directly.
- **Coverage placement matters:** `vitest.config.ts` measures `lib/**` only — **`app/api/**` is not
  measured at all**. Put the status predicate in `lib/auth/accountStatus.ts`, not inline in the route,
  or it is both unmeasured and untestable without `NextRequest` plumbing.
- **Add a `lib/auth/**` coverage glob** alongside the existing MAX-risk domains. Auth is a CLAUDE.md
  MAX area yet currently falls to the global floor (branches **77**), which is loose enough to let an
  untested lifecycle branch ship. Pin at the measured post-implementation baseline; never lower an
  existing value to go green.
- **Login indistinguishability is assertable without timing** (whose flakiness the existing tests
  already concluded against): compare `await res.text()` **bytes** across the unknown-user and
  deactivated 401s; compare sorted header sets; assert exactly one `bcrypt.compare` on all four
  paths; assert it compares against the user's **real** hash (not the dummy); and assert invocation
  order proves the status check runs *after* bcrypt.

### Accepted residual risks (from the 2026-07-18 review fan-out)

Found by review, deliberately **not** fixed in this phase. Each is recorded so it is a decision
rather than an oversight.

| # | Risk | Why accepted |
|---|---|---|
| **S19** | **`attemptsRemaining` distinguishes active from non-active to someone who already knows the password.** A correct password on an active account calls `clearLockout` (counter resets); on a non-active account it falls into the failure branch and the counter decrements. | The threat model S2/S15 addresses is enumeration by an attacker **without** credentials, and that path is uniform (verified: identical bytes, identical bcrypt work). Closing this residual case means either clearing the lockout for accounts that cannot log in, or diverging the response — both trade a real property for a weaker one. |
| **S20** | **A deactivated user's session + grade-B cookies are never server-cleared.** `logout-all` now 401s for them, so the branch that clears those cookies is unreachable for exactly the users who need it. | Cosmetic: every version-checked route already rejects them, and the client tears down local data on the next load. The device simply keeps inert cookies until they expire. |
| **UI1** | **`ConfirmDialog` does not restore focus to its trigger on close, portal to `document.body`, or lock background scroll.** | Admin-only surface, single dialog, no nesting. Worth doing when the primitive gets its second consumer — noted in `UI_COMPONENTS.md`. |
| **C13** | **A `users` doc lacking `createdAt` is invisible to the admin list** (`orderBy` excludes docs missing the ordered field), so it could not be managed, exported, or restored. | No such doc can exist today — every creation path writes `createdAt`. Pinned by a regression test so the property cannot silently lapse; the real fix rides C4 pagination. |
| **C14** | **`scripts/retention-dry-run.mjs` duplicates `decide()`** because it is plain ESM and cannot import the TS module. | Dry-run only, nothing executes on it. Must be resolved (via `tsx` or a build step) **before** any executor is written. |

### Phase 3 Definition of Done
1. S13 fixed: no writer to `users` performs a full-document overwrite; stale-write replay test green.
2. Lifecycle live; **absent fields ⇒ active**; no backfill; `auth-backward-compat.spec.ts` green.
3. A lifecycle transition immediately kills every live session via `tokenVersion`.
4. A deactivated login is **byte-identical** to a wrong-password 401 (S2 preserved, test-enforced).
5. Confirmation modal names the child; restore works; progress survives and is recoverable.
6. Admin export ships — allow-listed, audited, no `passwordHash`.
7. Retention selector pure and unit-tested; dry-run script has **no delete path**.
8. `firestore.rules` deny-all committed and verified inert.
9. Docs state the erasure gap honestly; phase closes **🟡 partial**, C2b carried to Phase 4.
10. A revoked client tears down local data on the next 401 (S14/C12) — no deleted child's progress
    is left readable on a shared device — and grade-B cookies are cleared on soft delete.
11. `COMPLIANCE.md` describes soft delete as **account bookkeeping, not access removal** (S14).
12. Enforcement runs independently of `requireVersionCheck`; `logout-all` is covered (F2).
13. Self / last-admin deactivation guarded, with a documented recovery path (S16).
14. `fakeFirestore` extended (ref, buffered tx writes, `strictUpdate`, `onTransactionRead`); the
    status predicate lives in `lib/auth/` so it is coverage-measured; `lib/auth/**` threshold added.

---

## Phase 3.5 — Design system consolidation & desktop layout  ·  Mode: MAX  ·  ✅ desktop intent decided 2026-07-18

**Objective:** Close the ~60 design-QA findings (D1–D8): collapse the token drift, meet the
44px rule everywhere, finish the Tailwind v4 migration, de-duplicate components, and give the
five density screens a real desktop layout.

**Why this is next, ahead of Phases 4–5:** it is the only remaining phase with **no product
go/no-go outstanding** (Phases 4 and 5 both gate on one; Phase 3.5's single open question —
desktop intent — was answered 2026-07-18, see below). It touches **zero** auth, API, routing,
or `lib/*/storage.ts` surface, so it carries none of Phase 4's migration risk and can ship
continuously. It is also a prerequisite in practice: Phase 4's org-admin screens and Phase 5's
freemium gate both add UI, and adding it to a drifted design system multiplies the drift.

**Mode rationale:** MAX. Not for storage or security risk — there is none — but for blast
radius: `app/globals.css` is imported by the root layout, so the token pass touches ~40 `.tsx`
files across every screen, exercised by 33 E2E specs. Total diff far exceeds ULTRA's 300-line cap.

**Product decision on record (2026-07-18):** *"Use the wide space on busy screens only."*
Practice screens (Section, Day Overview, Final Exam, GMAT, legal) **keep** the narrow column —
a narrow measure is genuinely better for reading a prompt and typing an answer. The five
**density** screens get real desktop layouts. Rejected alternatives: keep everything narrow and
merely decorate the gutters (leaves D1's HIGH findings unfixed); make every screen responsive
(largest scope, spent mostly on screens the QA itself marked "fine at 720").

### Sequencing (five stacked PRs — each its own `/plan`, `/review`, `/verify`)

Ordered so that each PR is verifiable on a trustworthy baseline. **3.5.1 must land before
3.5.2** — restyling on top of an unswept v4 regression means tuning against a broken baseline.

### 3.5.1 — v4 safety sweep + token foundation (D4, D2 groundwork) — ✅ **COMPLETE** — *zero visual change*
- **v4 sweep → no-op.** All three hazards audited and clean; see the D4 row for the evidence.
  **No code changed for D4.** The audit was the deliverable; inventing edits to justify the PR
  would have been worse than reporting a clean result.
- **Tokens landed** in `:root` (not `@theme` — see the deviation note below): `--accent-strong` /
  `--accent-soft` / `--accent-hover` / `--accent-subtle`; `--radius-card: 20px` /
  `--radius-panel: 24px`; `--rail-width: 4px`; `--locked-surface` / `--locked-border` /
  `--locked-muted`. Every value is the **current shipping value, only named**, so 3.5.2's
  adoption is a rename with zero pixel change.
- **`.is-locked`** added: tints the surface and dims **decoration only** (`.locked-dim`), keeping
  text at full opacity — the opposite of today's whole-card `opacity-60`.
- **`tailwind.config.ts`**: `rounded-card` / `rounded-panel` / `border-s-rail` utilities, verified
  to actually generate via a standalone Tailwind CLI probe (a config key that silently fails to
  emit would have blocked all of 3.5.2).
- **⚠️ Deviation from plan — `:root`, not `@theme`.** The plan said "add `@theme` tokens", but
  `globals.css:3-6` records a deliberate decision to keep `tailwind.config.ts` authoritative via
  `@config` and treat the CSS-first `@theme` migration as its own follow-up. Honouring that
  decision beat following the plan; the `@theme` migration stays a separate task.
- **Verification:** `tsc` clean · lint clean · `check:testids` OK · **1472 unit tests pass** ·
  production build succeeds · tokens + `.is-locked` confirmed present in the compiled CSS.

### 3.5.2 — Token adoption sweep (D2, D6, D7) — *mechanical; pre-split 2a/2b*
- Replace the purple literals and `violet-900` titles with tokens; 10 radii → the 2-step scale;
  3 rail widths → 1; 16 `opacity-50/60` sites → the shared locked treatment; ParentDashboard
  `CorrectnessBar` → `--track`/`--accent`; admin `slate-*` → app tokens.
- **Split:** 2a = chrome + learner screens, 2b = admin + legal/system. Each stays under the cap.
- **Guard (from LEARNING_LOG:698):** locked cards must remain **inert `<div>`s, never `<Link>`s**.
  This PR restyles locked states and must not touch gating semantics — assert inertness in E2E.
- **Tests:** `npm run check:cards` clean; contrast ratios for the new locked treatment
  **computed**, not eyeballed; every screenshot baseline update individually reviewed.

### 3.5.3 — Touch targets (D3)
- TopBar `h-10`→`h-12` + login `min-h-[44px]`; Plan day-chips → 44px; Admin Users row actions →
  wrapped block or overflow menu at ≥44px each; login + admin inputs `min-h-[44px]`; GMAT
  bookmark button `min-h-[44px]`.
- **Tests:** one systemic `tests/e2e/touch-targets.spec.ts` sweeping every interactive element,
  rather than per-screen assertions — it prevents regression for free.

### 3.5.4 — Component consolidation (D5, D8)
- Grade Picker → the exported `<ActionCard>`; one shared day-card across Math/English/Science;
  `LockedGradeScreen` → `CenteredPanel`; one `LoadingPanel`; a `HeroHeader` size variant (retires
  Privacy's `!important`); flatten the exam-results nesting; collision-aware badge tooltip;
  next-badge `line-clamp-2`; retry button to its own row; drop DayCard's duplicate inline emoji.
- **Types:** new variant props are discriminated unions, not optional-everything. No `any`.
- **Testids stay frozen through 3.5.4.** The PlanScreen `km.autogen.*` → stable-id change (D8) is
  its own follow-up with matching spec updates.

### 3.5.5 — Desktop layout (D1) — *per the decision on record*
- **Widen:** Home weeks + DayOverview + SubjectHome → `lg:grid-cols-2`; Subject Picker →
  `lg:grid-cols-3` (kills the 2+1 orphan); Badge Gallery → `lg:grid-cols-3 xl:grid-cols-4`;
  Parent Dashboard → 2-column card grid; Admin Users → a real table at `lg`, stacked cards on mobile.
- **Keep narrow:** the practice column (cap ~560px for answering comfort), exams, legal.
- Align the TopBar inner row to the content column (it is currently full-bleed while content is
  centered; SiteFooter already does this correctly and is the reference).
- Raise/remove the 720 cap **per screen**, not globally.

### Phase 3.5 quality gates
Local: `tsc`, `npm run lint`, `check:testids`, `check:cards`, `test:unit`. **E2E and `test:qa`
run on the PR's CI, not locally** (standing preference). Plus MCP Playwright visual check on
every changed screen (MAX: always), a manual **RTL pass** after 3.5.2 and 3.5.4 (rail-width and
radius changes read differently under `border-s` in RTL), and a **320px** check on the Grade
Picker CTA wrap.

### Phase 3.5 Definition of Done
1. All ~60 findings fixed or explicitly closed as won't-fix **with a reason recorded here**.
2. `check:cards` reports zero drift: one accent ramp, one title token, two radii, one rail width,
   one locked treatment.
3. Every interactive element ≥44px, enforced by a systemic E2E spec (not spot checks).
4. No `data-testid` regressions; all 33 E2E specs green on CI.
5. Locked cards remain inert (no `<Link>`), test-enforced — the LEARNING_LOG:690 bug class does
   not regress while restyling locked states.
6. The five density screens use the available width at `lg`; practice screens stay narrow.
7. Contrast of the new locked/muted treatment computed and passing WCAG AA.
8. `UI_COMPONENTS.md` and `LEARNING_LOG.md` updated with the final token scale, so the standard
   this phase restores is the one future work is checked against.

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

### 4.5 — Permanent erasure (C2b, C10) — *moved here from Phase 3, 2026-07-18*
- **Why here:** erasure is irreversible and destructive, so it is a **privilege**, not a button.
  It belongs to the **super-admin** (spanning organizations), who may **delegate** it to an
  organization admin. That role only exists once 4.1 lands — hence the sequencing.
- **Task:** a permanent-erase action available **only on an already soft-deleted user** (Phase 3
  state `status: "deleted"`), gated on the super-admin permission, org-scoped, audited before the
  destructive act so a mid-erasure crash still leaves evidence.
- **Must close C10 — erasure targets registry** (an explicit registry, not a grep; collections hide
  behind module-level `COLLECTION` consts so a future collection would otherwise be silently missed):

  | Collection | Key | Action |
  |---|---|---|
  | `users` | doc id | delete |
  | `user_progress` | doc id | delete |
  | `account_lockouts` | `sha256(usernameLower)` | delete — reuse existing `clearLockout()` |
  | `audit_log` | query `targetId == userId` | **pseudonymize**, not delete (see below) |
  | ~~`rate_limits`~~ | ~~`sha256(key)`, key embeds client IP~~ | **excluded** — not derivable, 60s window + TTL |

- **Audit vs. erasure (the genuine tension):** buyers require an immutable admin trail (S9); privacy
  law requires erasure. Resolution: **pseudonymize** — keep the row, its `actorId`, `action` and
  timestamp; replace `targetId` with a tombstone. The trail stays complete; the erased user stops
  being identifiable. Record the rationale in `COMPLIANCE.md`.
- **Not one transaction:** spans multiple collections and needs a query, so implement as
  **sequential, idempotent and resumable**, returning per-collection status; a partial failure is
  retryable by re-invoking. Cap the `audit_log` query with `.limit()` and loop.
- **Test:** full purge; second call is a no-op; audit row survives with a tombstoned `targetId`; a
  non-super-admin is refused; an erase attempt on a *non*-soft-deleted user is refused.

### Phase 4 Definition of Done
1. Org model live; every query org-scoped; tenant-isolation e2e green.
2. Org-scoped roles (school-admin/teacher/parent/student) enforced.
3. Admin list paginated (C4/C11); progress-doc contention addressed per load-test evidence.
4. Existing users migrated into a default org with a tested rollback path.
5. Both regression anchors + new tenant-isolation spec green.
6. Permanent erasure live behind the super-admin privilege, registry-driven and idempotent —
   closing **C2b** and **C10**, and letting `COMPLIANCE.md` finally claim erasure honestly.

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
| Erasure contract rewritten by Phase 4 tenancy | MEDIUM | **Resolved by sequencing** — erasure now *lands in* Phase 4 alongside the org model, so there is no contract to rewrite. Phase 3 export is admin-scoped and org-neutral |
| Soft-deleted account keeps working sessions (delete means nothing) | CRITICAL | Lifecycle transition bumps `tokenVersion` in the same transaction; enforced at the single `verifySession` choke point; e2e asserts a live session dies on delete |
| Concurrent write resurrects a soft-deleted account (S13) | HIGH | `tx.update()` with owned fields only; ships **first**, standalone; deterministic stale-write replay test |
| Existing users read as inactive ⇒ mass lockout of every live account | CRITICAL | Absent ⇒ active; one shared reader; no backfill; `auth-backward-compat.spec.ts` is the anchor |
| Lifecycle check reintroduces the S2 login timing/enumeration leak | HIGH | Check strictly **after** bcrypt; byte-identical 401; test asserts deactivated and wrong-password responses are indistinguishable |
| `COMPLIANCE.md` overclaims erasure we cannot perform | HIGH | Doc states the gap explicitly and names Phase 4; phase closes 🟡 partial rather than ✅ |
| Compliance scope creep blocks eng | MEDIUM | Split legal vs eng; eng ships export/erasure/retention primitives regardless |
| No DR proof at due diligence | HIGH | Phase 2 PITR/backups + tested restore drill + RPO/RTO |
| Client-side daily cap trivially bypassed (clear storage / incognito) | MEDIUM | Frame as soft nudge; real metering needs server entitlement (accounts) — revisit post-Phase 1 |
| Freemium cap frustrates a legit shared/family device (multiple children) | MEDIUM | Generous "one day" scope; clear login CTA; a logged-in account removes the cap entirely |

## Sequencing rationale

- **0 → 1 → 2** are pure hardening, continuously shippable, low regression risk.
- **0.0 (proxy spike) precedes 0.1 (limiter)** because IP-keying depends on it.
- **Limiter ships shadow (0.1) and enforces later (2.7)** so thresholds are tuned on real data
  — this resolves the only open review concern (classroom false-positives).
- **3 (lifecycle/governance) and 4 (tenancy) each need a product go/no-go** and are the true
  "sellable" unlocks; 4 is last because it's the largest and most irreversible.
- **Erasure moved 3 → 4 (2026-07-18).** The original plan had Phase 3 ship erasure and merely
  *design* it org-aware. Product inverted this: Phase 3 ships reversible **soft delete**, and
  erasure lands in Phase 4 as a **super-admin privilege**. The reasoning is sound — permanent
  destruction of a child's record is a permission question, and the role that should hold it
  doesn't exist until the org model does. Building erasure first would have meant inventing a
  permission model for it, then rewriting that model in Phase 4. The cost is explicit and accepted:
  **between Phase 3 and Phase 4 we can export and deactivate but cannot erase**, and the compliance
  docs must say so.
- **S13 ships first inside Phase 3** because the soft-delete flags are only trustworthy once no
  writer performs a full-document overwrite.
- **3.5 (design system) inserted after 3, ahead of 4–5 (2026-07-18).** It is the only remaining
  phase with no product go/no-go outstanding, and it touches zero auth/API/routing/storage
  surface — so it ships continuously while Phases 4 and 5 wait on product decisions. It is also
  a practical prerequisite: both later phases *add UI* (org-admin screens, the freemium gate),
  and adding screens to a drifted design system multiplies the drift rather than inheriting a
  standard. The numbering is deliberate — this is design-quality work, not a step in the
  security/scale arc that Phases 0→4 encode, and renumbering 4→5 would break every existing
  reference.
- **Inside 3.5, the v4 sweep (3.5.1) precedes the token adoption (3.5.2)** for the same reason
  the limiter shipped shadow before enforcing: you tune against a baseline you trust. Restyling
  on top of an unswept `border`→`currentColor` regression would bake the regression in.

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
| 2 | Observability, DR & ops | ULTRA | Phase 0 | ✅ Done (ops 2026-07-17/18). 2.3 uptime check + alerts + error/shadow log-metrics **live**; 2.4 load-test baseline (Appendix C); 2.5 **PITR + daily backups + TTL policies enabled, restore drill passed** (RTO ≈ 11.5 min, Appendix D); 2.7 **limiter enforcing** (`RATE_LIMIT_ENFORCE=1`, verified) after `TRUSTED_PROXY_HOPS` fix (#80); minInstances=3 (raised from 1 during the C9 relocation). **Deferred/follow-up:** staging (2.6); app-region relocation (finding **C9**). |
| 3 | **Account lifecycle, data export & governance** | MAX | ✅ go/no-go given 2026-07-18 | 📋 **Planned** — scope revised (soft delete, not erasure). Will close **🟡 partial**: C2a only; **C2b → Phase 4** |
| **3.5** | **Design system consolidation & desktop layout** | MAX | ✅ desktop intent decided 2026-07-18 | 📋 **Planned — NEXT UP.** D1–D8; 5 stacked PRs. No product gate outstanding; zero auth/storage/routing surface |
| 4 | Multi-tenancy & scale **+ permanent erasure** | MAX | 🚦 go/no-go + Phases 1–3 | ⬜ Not started — now also owns **C2b** (erasure, super-admin privilege) + **C10** |
| 5 | Freemium access gating (logged-out daily limit) | ULTRA | 🚦 go/no-go | ⬜ Not started |

---

## Appendices (filled in as phases execute)

- **Appendix A — Proxy trust / client-IP contract** (Phase 0.0):
  - **Contract (implemented in `lib/security/clientIp.ts`):** the client IP is read from
    `X-Forwarded-For` counting from the **right**, because on Firebase App Hosting (Google Front
    End / Cloud Run) the trusted proxy *appends* the IP it observed to the right of the chain, while
    a malicious client can only *prepend*. `getClientIp` therefore takes the entry at
    `TRUSTED_PROXY_HOPS`, ignoring any client-prepended spoof, and falls back to `x-real-ip` then
    the sentinel `"unknown"`.
  - **✅ VERIFIED (2026-07-15):** a live request via a temporary `/api/diag/ip` probe returned
    `X-Forwarded-For: 85.64.144.21, 35.219.200.210, 192.178.13.101` — i.e.
    `<client>, <google-internal>, <google-front-end>`. Google appends **2** hops, so the real
    client is **2 from the right**; the right-most entry is a *shared Google Front End IP*. The
    original default `TRUSTED_PROXY_HOPS = 0` would have keyed the limiter on that shared GFE IP —
    rate-limiting the whole user base collectively. Corrected to **`TRUSTED_PROXY_HOPS = 2`** (the
    verify-before-enforce gate did its job). The probe route was removed after recording this.
  - **`x-forwarded-proto`:** used only to set the cookie `secure` flag (login + grade-unlock). Trusted
    as set by the front end; unchanged.
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
- **Appendix C — Load-test baseline** (Phase 2.4):
  - **Run:** 2026-07-17, against **production** (`kids-math--kids-learing-hub.us-east4.hosted.app`),
    controlled: 20 distinct seeded users (one classroom), `PUSH_VUS=20 BURST_RATE=3 DURATION=60s`,
    from an Israeli client. Test users cleaned up after.
  - **Login:** 98% success (71/72), latency **p95 ≈ 16.4s / median ≈ 12s under burst**, ~1.5s
    single/warm. Dominated by cold starts + cross-region Firestore (see finding **C9**).
  - **Rate limiter (the flip gate):** only **2** over-threshold events, both on a *single* key
    (`login:85.64.144.21:kmload7`, count 11–12 / limit 10) — the load's random picker hammered one
    user. **No cross-user false-positives**: 20 users behind one NAT (`85.64.144.21`) did not
    collectively trip the limiter. Confirmed correct keying (real client IP, not the shared GFE IP)
    and validated thresholds ⇒ enforcement flipped on (`RATE_LIMIT_ENFORCE=1`, 2026-07-17).
  - **Progress push:** N/A this run — the k6 payload sent a minimal `{bundleVersion}` bundle that
    `mergeBundles` 500s on (test artifact, not an app bug); the push still exercised the `progress`
    limiter before the merge. Use a fuller bundle to measure push latency / the C5 contention knee.
- **Appendix D — Backup/restore drill results, RPO/RTO** (Phase 2.5): runbook
  ([`DISASTER_RECOVERY_RUNBOOK.md`](../.claude/docs/DISASTER_RECOVERY_RUNBOOK.md), sub-PR 2D).
  Targets: **RPO ≤ 1h** (PITR, 7-day window) / **RTO ≤ 4h**.
  - **✅ Drill performed 2026-07-18.** Restored the daily backup `ee951212…` (snapshot
    **2026-07-17 06:43 UTC**) into a new `recovery-drill` database (europe-west1), per the runbook's
    restore-to-new-DB path — prod never touched.
  - **RTO measured ≈ 11.5 min** (restore op 02:59:38 → 03:11:17 UTC) — **well within the ≤4h target.**
  - **Validation:** `recovery-drill/users` doc count matched prod exactly (incl. an admin account);
    `user_progress` present; `audit_log` empty (expected — no admin mutations before the snapshot).
  - **Teardown:** `recovery-drill` deleted after validation. **Re-drill** quarterly and after any
    schema/migration change (per the runbook).

---

## How to extend this roadmap

- Add new findings to the **Findings register** with a stable `S#`/`C#` id and a target phase.
- When a phase completes, flip its **Progress tracker** row to ✅, fill its appendix, and add a
  `LEARNING_LOG.md` entry.
- Keep this file the single source of truth for the hardening effort; per-phase `/plan` runs
  reference it rather than duplicating it.
