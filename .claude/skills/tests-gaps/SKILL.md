---
name: tests-gaps
description: >-
  Research the kids_math codebase to find GAPS in automated test coverage, then
  produce a ranked, verified gap report (and, on approval, author the missing
  tests — mostly E2E). Use this whenever the user asks to "find test gaps", "find
  coverage gaps", "what isn't tested", "improve test coverage", "add regression
  tests", "audit the tests", "plan test coverage", "which features lack E2E", or
  otherwise wants to discover where automated testing is missing rather than fix a
  named bug. Trigger it even when the user names one subsystem ("what's untested in
  auth/sync/exam") — the same method applies scoped to that area. This finds and
  ranks gaps first; authoring the specs is an explicit, approved follow-up.
---

# Tests-Gaps — find gaps in automated testing

You are hunting for **missing automated test coverage** in kids_math and turning it
into a ranked, verified gap report. Gaps — not source bugs — are the deliverable
(for bugs, use `system-check`). The primary output is a coverage-gap report;
authoring the tests is a separate step the user approves, using the repo playbook
below so the specs actually pass first time.

## Why this skill exists

kids_math already has heavy coverage (33+ E2E specs, 180+ unit files, coverage
thresholds). So the gaps that remain are **specific and subtle**: a user-facing
screen that is only unit-tested, a feature covered for the happy path but not its
negatives/edges, a known bug with no regression test, a `test.skip` that never
runs, or a test whose title over-claims what it asserts. Finding these needs a
systematic surface-vs-coverage sweep and hard verification, not a vibe. A gap you
can't tie to a named untested surface is noise.

## Operating principles (what makes a gap report trustworthy)

- **A gap needs evidence.** "No test for X" is only credible when you name the
  untested route/function/branch AND show the existing tests don't cover it
  (grep the spec dir, read the closest spec). Never assert a gap from a hunch.
- **Distinguish "unit-only" from "untested".** Much logic is deliberately unit-
  tested (grading, pickers, merge, streak engine) — that's correct, not a gap.
  The gap is when a **user-observable** surface (a screen, a flow, a gate) has no
  E2E, or when a negative/edge path is missing at any level.
- **Verify "known bugs" against live code before proposing a regression.** The
  roadmap findings doc goes stale. In this session, 3 of 4 listed findings (F1/F2/
  F3) were **already fixed** with tests present — only F4 was open. Read the code,
  don't trust the doc.
- **Respect the test pyramid.** E2E asserts *wiring* (the feature is reachable and
  behaves); unit asserts *logic* (the math is right). Proposing a slow E2E that
  duplicates unit-covered pure logic is a false gap — say so.
- **Find-and-report first.** Rank the gaps, then let the user pick what to author.
  Don't silently balloon into writing 20 specs before agreement.
- **Scope control.** If the user named a subsystem, sweep only that area. A full
  content/pedagogy-accuracy pass is a separate large effort — flag, don't absorb.

## Method

Work in order; use a task list so no tranche is dropped.

### Phase 0 — Inventory the surface AND the existing coverage
- **Routes:** `find app -name page.tsx` — every one is a user-facing surface.
- **Domains:** `ls lib/*/` — auth, user-data (sync), access, final-exam, gmat,
  badges, streak, review, english, science, progress, analytics, security, tts.
- **Cross-cutting features:** gates/unlock, cookie consent, TTS, RTL, touch a11y.
- **Existing E2E:** `ls tests/e2e/*.spec.ts` + `grep -rhE '\btest\(' tests/e2e`.
- **Existing unit:** `find tests/unit -name '*.test.*'`.
- If `docs/TEST_COVERAGE_MATRIX.md` exists, start from it — it maps route→spec and
  is the living home for gaps. `npm run check:coverage-matrix` flags routes with no row.

### Phase 1 — Enumerate candidate gaps (the research)
Sweep for each gap class and collect concrete instances:
1. **Unit-only user surfaces** — a screen/flow with unit tests but no `tests/e2e`
   spec (streak, badges gallery, plan screen, exercise-kind interaction, storage
   resilience were all unit-only before this session).
2. **Missing negatives/edges** — a feature with only a happy-path test. Look for:
   empty/whitespace submit, wrong-then-retry, boundary scores, timezone/midnight,
   corrupt/oversized/missing storage, invalid route params (404), locked-gate
   redirects with `next=`, second-user-on-shared-device isolation.
3. **Known bugs without a regression** — read `roadmap/CODE_REVIEW_FINDINGS_*.md`
   and `roadmap/PRODUCTION_HARDENING_ROADMAP.md`; for each open item, grep tests
   for a guard. **Verify the bug still exists in code first.**
4. **Skipped / hollow tests** — `grep -rn 'test.skip\|fixme' tests/e2e`; a spec
   that always skips is a gap. Also tests whose **title/comment over-claims** what
   they assert (read the assertions, not just the name).
5. **Routes with no spec at all** — cross the route list against spec references.

### Phase 2 — Rank by risk (which gaps matter)
Highest blast radius first:
1. **Data-loss / sync / storage** (`lib/user-data/**`, `lib/*/storage.ts`) — cross-
   device merge/hydrate, per-user isolation, corrupt-data tolerance.
2. **Gates** — middleware, grade-B unlock (per subject), auth/session revocation, admin PIN.
3. **Assessment correctness** — final-exam pass/fail boundary, unlock chain, gmat lock.
4. **Progress/metrics** — streak increment/reset, badges, adaptive weak-spots.
5. **Cross-cutting UX** — RTL/overflow, touch targets, cookie consent, TTS wiring.
6. **Cosmetic** last.

### Phase 3 — Verify each gap is real
For every reported gap: name the untested surface, show the nearest existing spec
doesn't cover it, and state the concrete case that would catch a regression. Drop
anything that's actually covered or is pure logic already unit-tested.

### Phase 4 — Report
Produce a ranked table: **Gap | Surface (route/fn) | Risk | Why it matters | Proposed spec + case(s)**. Separate "author now" from "unit-only is fine". Offer to
author the top gaps. If a coverage matrix exists, note which rows are thin.

## Repo playbook — authoring E2E that passes first time

When the user approves authoring, use this — it is the hard-won part.

**Harness (reuse, never reinvent):**
- `tests/e2e/testUtils.ts` — `seedProgressState`, `createCompletedDayProgressState`,
  `createFullyAnsweredDayProgressState`, `createFinalExamState`, `seedBadgeState`,
  `seedStreakState`, `seedAnalyticsEvents`, `seedSubjectGradeBUnlockCookie`,
  `mockAuthApi`, `readLocalStorage`, `STORAGE_KEYS`.
- `tests/e2e/answering.ts` — `answerExerciseCorrectly/Wrongly`, `answerDayCorrectly`.
  Drive answers from the **content model** (`getWorkbookDaysById(grade)`), never hardcode.
- Selectors: **always** `lib/testIds.ts` (`testIds.*`, `childTid`). Never CSS/text-only.

**Gating you must respect:**
- Warmup section = `day.sections[0]` — always reachable. Other sections lock until
  warmup is complete; the last section until all others are.
- Later **days** lock sequentially. To reach one without completing predecessors,
  pass `{ previewAll: true }` to a `routes.*` builder (QA bypass) or seed completion.
- Grade-B subtrees are gated by per-subject cookies (`seedSubjectGradeBUnlockCookie`);
  the subject-picker CTA-vs-hint is driven by client **completion**, not the cookie.
- Admin screens are PIN-gated (correct PIN `2109` in tests); seed the admin session
  key or enter the PIN.

**Flake avoidance (these bit this session):**
- Assert **durable state** (localStorage via `readLocalStorage`) over transient UI.
  The streak milestone chip auto-dismisses (~4s) — don't assert it under load.
- Prefer asserting a link's `href` over performing a real `.click()` navigation.
- Dismiss star/trophy overlays before navigating (`dismissStarRewardIfVisible`,
  `dismissDayCompletionCelebration`) — they intercept pointer events.
- Corrupt-storage tests must write **raw** strings via `page.evaluate`
  (`seedLocalStorage` JSON-stringifies, so it can't produce invalid JSON).
- RTL invariant: `html[dir=rtl]` + no horizontal overflow
  (`documentElement.scrollWidth - clientWidth <= 1`) at 375px width.

**Environment:** run E2E with the pre-installed browser via
`PLAYWRIGHT_CHROMIUM_EXECUTABLE=/opt/pw-browsers/chromium-*/chrome-linux/chrome`
when the downloaded build mismatches. `request`-only tests (health) need no browser.

**Guardrails to keep coverage from rotting:**
- `tests/unit/lib/user-data/seedKeyContract.test.ts` — fails if harness seed
  prefixes drift from real `lib/*/storage.ts` keys.
- `scripts/check-coverage-matrix.mjs` + `docs/TEST_COVERAGE_MATRIX.md` — every new
  route needs a matrix row (advisory→blocking in CI).
- `@smoke` tag lane (`npm run test:e2e:smoke`) runs one happy path per feature; the
  CI `e2e-smoke` job gates the sharded full run.

**Verify before declaring done:** run each new spec (repeat-each under load to catch
flake), then `npm run test:unit`, `tsc --noEmit`, `npm run lint`, `check:coverage-matrix`.

## Scope arguments
`/tests-gaps <area>` → sweep only that subsystem (auth, sync, exam, badges, …).
`/tests-gaps report-only` → produce the ranked report, do not offer to author.
No args → full surface sweep, then offer to author the top-ranked gaps.
