# Code Review Findings — Full-Codebase Audit (2026-07-25)

> Read-only audit. Deliverable is this report; **no source was changed.** Fixes are a
> separate, item-by-item follow-up for the user to approve (MAX per `CLAUDE.md`).

**Scope:** whole codebase, 7 risk-first tranches — auth/session, data/sync,
access/unlock, assessment, progress/metrics, content/TTS/pedagogy, cross-cutting/ops.
**Method:** repo-wide static sweeps → targeted deep-read of each tranche's core files
→ test-coverage cross-reference (217 test files) → reconciliation against
`roadmap/PRODUCTION_HARDENING_ROADMAP.md`.

**Headline:** this is an unusually disciplined codebase. No `any`/`@ts-ignore` in
source, no `TODO/FIXME`, no `console.*` outside the logger, no `dangerouslySetInnerHTML`/
`eval`, transactional Firestore writes, tolerant-reader merge layer, timing-safe login,
last-admin race guards. The findings below are subtle logic/robustness/gap items, not a
pile of nitpicks — the one that matters is **F1 (real cross-device data loss).**

---

## Summary (most-severe first)

| # | Sev | Category | Area | One line | New? |
|---|-----|----------|------|----------|------|
| **F1** | **MEDIUM** | bug / data-loss | data-sync | English & Science **Level ב׳** final-exam results are excluded from sync and wiped by the login clear/hydrate cycle | **NEW** |
| F2 | LOW | robustness | data-sync | `clampFutureTimestamps` 500s on an envelope-valid bundle missing `grades`, defeating the merge layer's explicit "must not throw" guard | **NEW** |
| F3 | LOW | bug | metrics/badges | `calendar-streak` badge buckets by **UTC** date while the rest of the app uses **local** date → mis-counts near local midnight | **NEW** |
| F4 | LOW | privacy/isolation | analytics | Per-device analytics events are not cleared on user switch → one child's behavioral events persist into the next child's session on a shared device | **NEW** |
| F5 | GAP | process | content | Pedagogy accuracy (word-problem semantics, distractor plausibility, MoE syllabus fit) has no CI gate; deterministic backstop only catches clean arithmetic contradictions — **✅ warn-level `content-accuracy` CI job added** | partial |
| F6 | INFO | security-posture | ops | Staged protections still non-enforcing by default: CSP report-only w/ `unsafe-inline`, HSTS `max-age=86400`, rate-limiter & body-cap in shadow mode | KNOWN |
| F7 | INFO | security-by-design | access | Grade-B unlock/lock routes are intentionally unauthenticated (content gate, not data) | KNOWN (S7) |

---

## F1 — Level ב׳ English/Science final-exam results are lost across devices (MEDIUM)

**Files:** `lib/user-data/api.ts:60-74` (`buildEnglishData`/`buildScienceData`),
`lib/user-data/types.ts:19-34` (`EnglishProgressData`/`ScienceProgressData.finalExam` is
singular), `lib/user-data/api.ts:239-263` (hydrate writes only level-`a` key),
`lib/user-data/api.ts:152-165` (clear wipes **both** level-`a` and level-`b` keys).

**Verified chain:**
- `SubjectFinalExamScreen.tsx:71,78,103` calls `exam.loadState(level)` / `exam.saveState(next, level)`
  with the actual level, so Level ב׳ state **is** persisted to
  `kids_math.english.final_exam.v1.level.b` / `kids_math.science.final_exam.v1.level.b`.
- `completion/subjectGrade.ts:44,50` and `ParentDashboardScreen.tsx:78-79` read those
  level-`b` keys — so the data is real and consumed.
- But `buildEnglishData()`/`buildScienceData()` call `loadEnglishFinalExamState()` /
  `loadScienceFinalExamState()` **with no `level` arg → default `"a"`**, and the bundle type
  only has a single `finalExam` slot. Hydrate writes back only the level-`a` key.
- `progressStorageKeys()` (the clear allow-list) **does** include
  `englishFinalExamStorageKey("b")` and `scienceFinalExamStorageKey("b")`.

**Failure scenario:** child passes the Science שָׁלָב ב׳ final exam on device A → sync bundle
is pushed **without** the level-ב exam → on any later `replaceLocalStorageFromBundle`
(new-device login, user switch, or a server-truth pull on device A itself) `clearLocalProgress()`
removes `...final_exam.v1.level.b`, hydrate restores only level-`a` → the passed Level ב׳
exam is **permanently gone**; the child must retake it and any level-ב completion/gate that
keyed on it resets.

**Status:** documented as a known limitation in the `ScienceProgressData` type comment
("`finalExam` carries Level א׳'s exam, mirroring how the English bundle currently syncs only
Level A's exam"), but it is still real data loss and is **untested** — `englishSync.test.ts`
only exercises `englishFinalExamStorageKey()` (no-arg/level-a).

**Fix direction (MAX — storage schema):** carry per-level final-exam maps for english/science
in the bundle (e.g. `finalExamByLevel: Record<GradeId, …>`) behind a `bundleVersion` bump;
read all levels in `build*Data`, write all levels in hydrate, and merge per-level (whole-domain
LWW per level). Keep the singular field readable for backward-compat. Add a sync round-trip test
that seeds a level-ב exam and asserts it survives push→pull.

---

## F2 — `clampFutureTimestamps` throws on a `grades`-less bundle (LOW)

**Files:** `app/api/user/progress/route.ts:69`, `lib/user-data/merge.ts:226-240`,
`lib/security/schemas.ts:77-81`.

`progressEnvelopeSchema` validates only `bundleVersion ∈ {1..4}` + passthrough (deliberately —
backward-compat). The route runs `clampFutureTimestamps(parsed.data, new Date())` **before**
`mergeBundles`, and `clampFutureTimestamps` dereferences `bundle.grades.a` / `.b` unguarded →
`TypeError` → caught → **500**.

**Reproduction:** authenticated `POST /api/user/progress` with body `{"bundleVersion":1}` → 500
instead of a clean 400/accept.

**Why it matters (low but real):** `mergeBundles` goes out of its way to guard
`existing.grades ?? incoming.grades` "so it must not throw," but the clamp that runs *first*
has no such guard — so the defensive intent is partly moot. Self-inflicted (authenticated; the
client always builds full bundles), hence LOW.

**Fix direction:** guard `grades` in `clampFutureTimestamps` (treat missing as `{}`), or add the
two required keys to the envelope schema, or clamp after merge.

---

## F3 — `calendar-streak` badge mixes UTC and local date bases (LOW)

**File:** `lib/badges/engine.ts:164-184` vs `:141` (`getHours`, local), `:152` (`getDay`,
local), and `lib/streak/engine.ts:4-7` (`getTodayDate`, local Y/M/D).

`calendar-streak-3/7` buckets completions via `d.completedAt!.substring(0,10)` — the **UTC**
date of the ISO timestamp — then counts consecutive `86_400_000 ms` gaps. Every other date-aware
rule in the app uses **local** components. In Israel (UTC+2/+3) a completion near local midnight
lands on a different UTC calendar day, so consecutive-day counting can over- or under-credit the
badge.

**Failure scenario:** finish day A at 23:00 local Mon (21:00 UTC Mon) and day B at 01:00 local Wed
(23:00 UTC Tue) → local gap > 1 day, but UTC dates Mon→Tue look consecutive → badge wrongly
credited; the mirror case wrongly denies it. Cosmetic (a reward badge); never affects progress or
data.

**Fix direction:** derive the date bucket from local components (reuse `getTodayDate`'s approach)
so all streak/date logic shares one basis. Add a fixed-timezone test.

---

## F4 — Analytics events not cleared on identity switch (LOW, privacy/isolation)

**File:** `lib/analytics/events.ts` (key `kids_math.analytics_events.v1`), excluded from
`clearLocalProgress()`'s allow-list by design (device-scoped prefs survive).

On a shared device, logout/login does not clear analytics, so child A's `answer_submitted`,
`day_viewed`, etc. (carrying `dayId`, `exerciseId`, `subject`, `gradeId`, and free-form
`payload`) remain and commingle with child B's. Local-only (never synced to the server per the
bundle audit) and capped at 1000, so blast radius is one device — hence LOW.

**Fix direction:** decide intent. If analytics are per-child, clear or owner-namespace the key at
the identity boundary (alongside `clearReconcileGuards`). If truly device analytics, document that
they are device-scoped and must not carry answer content.

---

## F5 — No CI gate for pedagogy/content accuracy (GAP, process)

**File:** `lib/content/engine/validate.ts` (`validateExerciseArithmetic`).

The deterministic backstop is conservative by design: it only flags contradictions in clean
`number (op number)+ = number|?` prompts and **skips** word problems, place-value, ranges, and
distractor quality. Per `CLAUDE.md` rule 11 an AI content-accuracy audit is required for content
changes, but it is a manual/scripted pass, not a gate — so ~9,760 LOC of content
(`lib/content/**`) has no automated defense for word-problem semantics, distractor plausibility,
or MoE syllabus fit. My spot-check (`grade-a/day-01.ts`) was internally consistent
(2+1=3; "1→5, one step each = 4 steps"; circle), so this is a coverage gap, not a known defect.

**Fix direction:** out of scope for a code audit — a full pedagogy pass is a separate large
effort. Minimum: wire `scripts/audit-content-accuracy.mjs` (or the in-session audit) into
`test:qa` as a warn-level gate so new/edited days are always checked.

**✅ Resolved (2026-07-25, warn-level CI gate).** Added a `content-accuracy` CI job
(`scripts/check-content-accuracy.mjs`) that runs the AI audit on the learner-content day files a
PR changes (`lib/content/{grade-a,grade-b,english,science}/**`). Chosen over the literal
"into `test:qa`" because `test:qa` gates deploy and runs locally for every dev — a paid,
non-deterministic Anthropic call there would strand key-less runs and could stall a deploy.
Instead it mirrors the `check:coverage-matrix` advisory: job-level `continue-on-error` (neutral,
never fails `workflow_run.conclusion`, so it can't block `deploy.yml`) and a fail-open script
(exits 0 with no PR base, no `ANTHROPIC_API_KEY` — local runs and fork PRs — or no changed
content; per-file API errors downgrade to a notice). Cheap model (`claude-haiku-4-5`) for the
bulk pass; the human CLI keeps its Opus default. **Still advisory, not a hard gate** — a human
triages findings (AGENTS.md → Educational Content Changes); the full pedagogy sweep remains
future work.

---

## F6 — Staged protections still non-enforcing by default (INFO, known)

All documented/intentional staging in the roadmap, listed so they aren't forgotten at go-live:
- **CSP** is `Content-Security-Policy-Report-Only` with `script-src 'unsafe-inline'`
  (`next.config.mjs:8-27`) — XSS is **not** blocked yet, only reported.
- **HSTS** `max-age=86400`, no `includeSubDomains`/`preload` (`next.config.mjs:26`).
- **Rate limiter** and **progress body-cap** record-only unless `RATE_LIMIT_ENFORCE=1` /
  `PROGRESS_BODY_CAP_ENFORCE=1` (`app/api/auth/login/route.ts:53`,
  `app/api/user/progress/route.ts:18-57`) — brute-force / oversized-body protection is nominal in
  the default config.

**Action:** none code-wise; add these three flips to a go-live checklist and confirm the shadow
logs are clean before enforcing.

---

## F7 — Grade-B unlock/lock routes are unauthenticated by design (INFO)

`lib/server/gradeUnlockCookies.ts` + the four route shims set/clear a **content-gate** cookie
only (never data), and the anonymous Grade-A→B reconcile flow (`completion/reconcile.ts`) depends
on it. Input is zod-validated (`subjectSchema`). Roadmap S7 accepted this; noting it because it is
the one endpoint that looks like an auth bypass until you read the rationale. Real per-account
entitlement waits for the account model.

---

## Coverage-gap notes (cross-referenced with `LEARNING_LOG.md`)

- **F1 is untested** — no sync test seeds a level-ב english/science exam.
- `LEARNING_LOG.md` already flags `lib/badges` (~77% stmts) and `lib/gmat-challenge`
  (~73% stmts / 57% branches) as genuinely thin under vitest v4. F3 sits inside the badges gap —
  a fixed-timezone `calendar-streak` test would close both at once.

## What was checked and found clean

Auth core (`jwt.server`, `session.server`, login timing side-channel, `verifySession` status +
version check), admin route (transactional last-admin guard, field-masked password reset, audit
log), `firestore.rules` deny-all, exam graders (`gradeExam`, `gradeFinalExam`), Leitner engine
(`review/engine`), streak engine (DST-safe `Math.round`), number-line generator (invariants hold
by construction), TTS engine (manifest-first + synthesis fallback, idle-cancel guard), merge LWW +
future-clamp, per-student isolation (`serverSync` epoch/primed/active guards), middleware grade-B
gate.
