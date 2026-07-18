# Learning Log (kids_math)

Append-only record of what we learned while working on this repo.

## Unreleased

- (Add new entries here. Prefer short, concrete notes.)

### 2026-07-15 (Phase 2 sub-PR 2E — rate limiter shadow → staged enforce, MAX)
- **Trigger:** Roadmap Phase 2.7 / S1. Promote the shadow limiter to enforcing without risking a
  self-inflicted lockout of a shared classroom NAT.
- **What changed / where:** `lib/security/rateLimit.ts` — added `enforceRateLimit` (records always,
  blocks only when enforcing), `isRateLimitEnforced` (`RATE_LIMIT_ENFORCE` flag), `rateLimitedResponse`
  (shared 429 + `Retry-After`), `retryAfterMs`, and an `expiresAt` TTL field on the `rate_limits` doc.
  Wired on `app/api/auth/login`, `app/api/user/progress`, `app/api/admin/users` (×3). `apphosting.yaml`
  documents the flag (off).
- **What we learned:**
  - **Staged behind an env flag = safe MAX change.** Same pattern as `PROGRESS_BODY_CAP_ENFORCE` /
    CSP report-only / staged HSTS: the enforcing code ships **behaviourally identical to shadow**
    until an owner flips `RATE_LIMIT_ENFORCE=1` after verifying thresholds + `TRUSTED_PROXY_HOPS`.
    This let a blocked, verification-gated task land safely with zero production behavior change.
  - **Keep shadow↔enforce parity exact:** the block decision is `!allowed` (i.e. `count > limit`),
    identical to the shadow `allowed = count <= limit`, so flipping the flag can't shift the boundary.
  - **Fail-open must survive enforcement:** a Firestore outage still resolves to `allowed`/not-blocked
    even with the flag on — unit-tested — so the limiter can never take the site down.
  - **Testing enforce at the route level:** seed the `rate_limits/{sha256(key)}` doc at the threshold
    in `FakeFirestore`, set `RATE_LIMIT_ENFORCE=1`, and assert 429 (the e2e 429 case isn't feasible —
    e2e mocks Firestore at the network layer and enforcement is flag-off in CI). See the health-test
    learning: real Firestore-touching behavior belongs in unit/integration, not CI e2e.
- **How to reuse next time:** for any "turn on a guard that could reject live traffic," ship it
  flag-off + shadow-logged first, prove safety on dashboards, then flip via env — never enable
  inline in the same change.

### 2026-07-15 (Phase 2 sub-PR 2A — observability foundation: logger + audit log + health)
- **Trigger:** Production Hardening Roadmap Phase 2 (C3/S9/C7). First sub-PR of the phase; ULTRA.
- **What changed / where:** new `lib/observability/{logger,errorReporting,auditLog}.ts`; new
  `app/api/health/route.ts`; swapped the two `console.error` in `app/api/user/progress/route.ts`
  for `captureError`; audit rows on the 3 admin mutations in `app/api/admin/users/route.ts`;
  `captureError` in `components/ui/StorageErrorBoundary.componentDidCatch`. Tests alongside.
- **What we learned:**
  - **Log-based GCP Error Reporting needs no SDK/dependency.** On Cloud Run, an ERROR-severity
    structured log line carrying a `stack` is auto-ingested by Error Reporting — so 2.1 shipped
    with zero new deps and no `instrumentation.ts`/`next.config` change. `errorReporting.captureError`
    is the single swap seam to Sentry later.
  - **PII redaction is a hard gate for children's data.** `logger.redactFields` deny-lists
    `password/passwordhash/token/jwt/secret/cookie/authorization/username` (case-insensitive,
    bounded-depth recursion) before anything reaches the sink.
  - **Audit log is best-effort/fail-safe** (mirrors `accountLockout.ts`): `writeAuditLog` swallows
    all errors so an audit-write failure can never break the primary admin mutation. `audit_log`
    is a Firestore collection, NOT a `lib/*/storage.ts` domain — so no MAX-on-storage escalation.
- **Worktree gotchas (cost real time — check first next time):**
  - A fresh `.claude/worktrees/*` checkout can have a near-empty `node_modules`; `tsc`/build resolve
    `zod` etc. against the *incomplete local* folder and fail, while `vitest` accidentally works by
    walking up to the parent repo's `node_modules`. Fix: run `npm ci` in the worktree first.
  - `npm run lint` fails in a nested worktree with `Plugin "@next/next" was conflicted … ../../../.eslintrc.json`
    because the worktree `.eslintrc.json` has no `"root": true`, so ESLint walks up into the parent
    repo's config. It's environmental (CI checks out standalone). To lint locally, temporarily add
    `"root": true`, run `npx eslint <files>`, then `git checkout -- .eslintrc.json`.
- **How to reuse next time:** route all server logging through `lib/observability/logger`; never
  `console.*` directly (add the sanctioned `eslint-disable` only inside the logger). Add an audit row
  for every new admin mutation. First command in any worktree: `npm ci`.

### 2026-07-11 (Phase 0 security quick wins — shipped as one PR, everything staged)
- **Trigger:** Production Hardening Roadmap Phase 0 (S1/S2/S3/S5/S6/S11) — cheapest, highest-severity,
  reversible security fixes. Done together on `claude/roadmap-quick-wins-vdg7z7`.
- **What changed / where:**
  - New `lib/security/`: `clientIp.ts` (trusted right-most XFF read, S11), `rateLimit.ts`
    (Firestore-backed fixed-window limiter, **shadow/record-only + fail-open**, S1), `bodyLimit.ts`
    (413 caps, S5). Wired into `app/api/auth/login`, `app/api/user/progress`, `app/api/admin/users`.
  - `app/api/auth/login/route.ts`: constant-time — always `bcrypt.compare` (dummy **cost-12** hash on
    unknown user) so timing can't enumerate accounts (S2).
  - `next.config.mjs`: `headers()` — **staged HSTS**, **CSP Report-Only**, X-Frame-Options, nosniff,
    Referrer-Policy, Permissions-Policy (S3).
  - CI: `.github/dependabot.yml` + `security-scan` job (`npm audit` non-blocking first, `gitleaks`
    blocking) (S6). No configs weakened.
- **What we learned / reuse next time:**
  1. **Backward compatibility is not just storage.** A deploy can strand old-client/old-session users
     via HTTP contracts too. Patterns that made Phase 0 safe: **shadow mode** (limiter records, never
     blocks; fail-open), **CSP Report-Only** (can't break cached clients/TTS/RTL), **staged HSTS**
     (short max-age, no preload — self-heals), and a **flag-gated body cap** (`PROGRESS_BODY_CAP_ENFORCE`)
     set just under Firestore's ~1 MiB ceiling so no accumulated bundle is ever 413'd. Generalized this
     into mandatory rule **§6** (`AGENTS.md` + `agent-guidelines.mdc`).
  2. **Firestore doc caps double as a safe body-cap bound:** since Firestore rejects >~1 MiB docs, any
     bundle that ever synced is already under it — pick the HTTP cap from that, not a guess.
  3. **Read the enforce flag per-request, not at module load,** so it's unit-testable and ops-togglable
     without a redeploy.
  4. **Client-IP trust is a verify-before-enforce contract** — see roadmap Appendix A; confirm the XFF
     hop count on App Hosting before the limiter goes enforcing (Phase 2.7).

### 2026-07-10 (Coverage thresholds: Vitest v8, ratcheted, scoped to lib/ risk areas)
- **Trigger:** 183 unit + 29 E2E specs but **zero coverage visibility** — no way to know
  which branches of the highest-risk code (`lib/*/storage.ts`, exam grading, grade-unlock)
  the tests actually exercise. Wanted a gate that blocks new *uncovered* code in those areas
  without adding an external service (explicitly **no Codecov**).
- **What changed / where:**
  - Added `@vitest/coverage-v8` (version-matched to vitest `^2.1.x`) + `test:coverage` script
    (`vitest run --coverage`). CI `lint-and-unit` job now runs `test:coverage` instead of
    `test:unit` (E2E job unchanged). `test:unit` stays bare for fast local runs.
  - `vitest.config.ts` `coverage` block: provider `v8`, reporters `text/json-summary/html`,
    `include: ['lib/**']`. **Excludes:** `lib/server/**`, `lib/firestore/**` (Node/Admin-SDK
    surfaces jsdom can't exercise), types/barrels/`.d.ts` (no executable lines).
  - **Thresholds = a ratchet**, pinned just below the 2026-07-10 baseline (global 90.95 lines /
    84.44 branches / 70.52 funcs). Global functions floor is low on purpose: several `lib/hooks`
    React hooks are E2E-only, out of scope here. **Per-directory globs give the teeth** on the
    CLAUDE.md MAX areas: `lib/exam/**` and `lib/gradeUnlock.ts` pinned at **100** (fully covered
    today — keep it); `progress`, `final-exam`, `gmat-challenge`, `completion`, `review`,
    `badges`, `streak`, `user-data` pinned ~1–2 pts below their measured baseline.
- **What we learned / reuse next time:**
  1. **Vitest glob thresholds are AGGREGATE, not per-file** (verified in
     `@vitest/coverage-v8` `resolveThresholds`): each glob key merges its matching files into
     one coverage map and checks the summary; global applies to *all* included files. `perFile`
     (default off) flips both to per-file. So `lib/progress/**` gates the directory as a whole —
     a well-covered `engine.ts` can mask a weak `storage.ts` within the same glob. If you want
     to protect a single file, glob it explicitly (matches one file → aggregate == that file).
  2. **Measure baseline FIRST, pin below it.** Never hardcode aspirational numbers — a red build
     on unrelated PRs erodes trust in the gate. Ratchet up as coverage improves; never lower to
     make a build pass (add the test instead — same rule as "never weaken configs").
  3. **An unenforced threshold is worse than none** (false green). Always sanity-fail: bump one
     threshold above baseline, confirm `vitest run --coverage` exits **1**, then revert. Verified.
  4. **Limitation:** this is *directory-level* gating, not true *per-PR diff* coverage. Adding
     uncovered lines to a risk dir drops its % and fails CI, but a line-level "your changed lines
     must be tested" gate would need Codecov or a diff-cover script (deliberately out of scope).

### 2026-07-10 (Per-student progress isolation: server-authoritative login, wipe-on-logout)
- **Trigger:** Progress leaked across identities — logging in as a second user (or on a second device) showed the wrong student's progress, because the app always treated `localStorage` as the source of truth and **merged local up into whichever account was authenticated** at the login/restore boundary (`pushThenPull`), contaminating the server doc.
- **What changed / where:**
  - **Owner marker** `kids_math.auth.owner.v1` (`lib/user-data/api.ts`) records which userId owns local progress. Login/restore branches on it: **same-user** → push-then-pull (preserves offline work); **foreign/anon** → `clearLocalProgress()` then hydrate the incoming user's server truth (never push local up). `lib/auth/context.tsx` `reconcileForUser`.
  - **`clearLocalProgress()`** is an explicit allow-list of progress keys — **including legacy/level-keyed variants** (`workbook_progress.v1*`, `english.final_exam.v1` base) because `loadProgressState` / `migrateLegacyExamToLevelA` RE-MIGRATE legacy keys into the current key when it's absent → a clear that skips them **resurrects** the prior student's data. Never a `kids_math.*` prefix wipe (device prefs/TTS/consent survive).
  - **`syncPrimed` gate** (`lib/auth/serverSync.ts`): never push local until it's been reconciled with the server for this identity. Default domain state stamps `updatedAt: now` (`createInitialBadgeState`), so an empty push wins whole-domain LWW and would **clobber real server data**. `fetchUserProgressResult` distinguishes `ok`/`empty`/`error` so a network error clears-for-confidentiality but stays UNPRIMED (self-heals on next pull) instead of clobbering.
  - **`authEpoch`** bumped on every login/logout; async reconciles/pulls capture it and skip their hydrate/setUser if it changed → an in-flight pull can't repaint the next student after a logout/switch.
  - **`isSyncActive()`** (callback registered) gates `flushThenPull`/beacon, and logout now **clears local synchronously before** `await apiLogout()` — together they close a race where a stray focus/pageshow pull re-hydrated the just-cleared device during the logout network call (caught in code review).
  - **Grade-B unlock reset on logout:** `clearAllGradeBUnlockCookies` (server, `lib/server/gradeUnlockCookies.ts`) on the logout route + `clearReconcileGuards()` (client) so the next student re-earns Grade B from their OWN hydrated completion (the never-revoke reconcile rule is untouched).
  - Removed the pre-login `sessionStorage` snapshot mechanism (it never saved on the cookie-restore path → the original logout leak).
  - Tests: `tests/unit/lib/user-data/isolation.test.ts`, rewritten `contextOrdering.test.tsx`, extended `serverSync`/`reconcile` units, `tests/unit/app/api/authLogout.test.ts`, and `tests/e2e/multi-user-isolation.spec.ts` (per-user mock server proves A→logout→zero→B-sees-only-B, follow-me, and no cross-contamination).
- **What we learned / reuse next time:**
  1. **A per-identity source-of-truth needs an identity stamp in local storage.** Without the owner marker you can't tell "this same user's offline work" from "a different student's leftovers" — merging is only safe within one identity.
  2. **Clearing progress must cover legacy/migration keys**, or loaders silently re-hydrate the old data. Treat migration source keys as part of the clear contract.
  3. **Never push default-initialized local state up** — defaults stamp `updatedAt: now` and win LWW. Gate pushes on a "primed" flag set only after a confirmed server read; distinguish `empty` (200+null) from `error` (500/throw).
  4. **Guard cross-identity async with an epoch + an "active" flag**, and do destructive local writes synchronously before any `await`, so a logout can't be undone by an in-flight pull.

### 2026-07-01 (Component tests: extended to EVERY component — 88/88)
- **Trigger:** after the shared UI library was covered, extended component tests to all
  remaining 64 components (leaf, exercises, providers, layout, auth, teaching-primer,
  timed-exam, review, and all screens). Unit suite now **868 tests / 137 files**.
- **Patterns that worked (reusable for future component tests):**
  - **Config-wrapper screens** (English/Science → subject screens): mock the delegate
    subject screen and assert it was called with the right `config` + props — a clean
    contract test with no content/routing setup.
  - **Shared subject screens**: render with the real `englishScreenConfig` and drive them
    to a **gated state** — not-found (bogus dayId/sectionId), locked exam (no progress),
    loading — which renders a stable root without needing full curriculum data.
  - **Gated/PIN screens** (AdminHub, AdminProgress, AdminUsers, ParentDashboard): mock the
    gate hook (`useAdminSession` / `useAuth` / `useRouter`) to the locked/loading branch.
  - **Content-heavy screens** (Home, Plan, BadgeGallery): they hydrate synchronously under
    RTL's effect flush and render fully with real content + real `useBadges` — just assert
    the hydrated `root(grade)` testid.
  - **`useRouter`**: `vi.mock("next/navigation", ...)`. **`useProgress`/`useDayAnswers`/
    `useExerciseFocus`/`useSectionReset`/`useDayUnlockStatus`**: mock to permissive defaults.
  - **Gotcha:** `AdminProgressScreen` calls `useAdminTtsEnabled` (AdminTtsProvider) *before*
    its PIN gate, so even the locked-state test must mock that provider hook.
- **Deliberate depth choice:** heavy screens are smoke-tested at their gated/loading roots
  (mount-without-crash + correct branch) rather than fully exercised — the full user
  journeys stay owned by the E2E suite; these units catch import/render/wiring regressions
  fast.

### 2026-07-01 (Component tests: full coverage of the shared UI library + Testing Library)
- **Trigger:** the vitest `include` was `**/*.test.ts` only, so a `*.test.tsx` file would be
  **silently skipped** (pass with 0 tests = false green). Component coverage was also just 3
  primitives (Card/SectionHeader/Tile), rendered via `renderToStaticMarkup` string assertions.
- **What changed / where:**
  - Widened `vitest.config.ts` include to `**/*.test.{ts,tsx}` (the footgun fix).
  - Added `@testing-library/react` + `user-event` + `jest-dom` (+ `dom`); `vitest.setup.ts`
    now imports `@testing-library/jest-dom/vitest` and calls `cleanup()` after each test.
  - **Full coverage of all 24 `components/ui/` primitives** — one `*.test.tsx` per component
    (67 tests). Interaction (Button/PinInput/StudentTtsToggle), effects + fake timers
    (StreakBadge/MetacognitionToast auto-dismiss), error boundary (throw → recovery UI, and
    Next control-flow digests re-thrown), and TTS via `vi.mock("@/lib/tts/engine")`.
- **Scope decision:** "full coverage" = the shared UI library only. The ~64 screen/exercise/
  timed-exam components are wired to routing/storage/context — unit-testing them needs heavy
  mocking for low marginal value and they're already covered by E2E. Component **unit** tests
  are for the reusable primitives; screens stay E2E.
- **Takeaways:** (1) real `next/link` renders a plain `<a href>` in jsdom — no router mock
  needed for href/class assertions. (2) jsdom has no `window.speechSynthesis`, so
  `SpeakerButton`/TTS components must mock `@/lib/tts/engine` (Hebrew hides when unsupported;
  English stays visible-but-disabled). (3) `npm ci` in CI installs devDeps, so Testing Library
  is available in the `lint-and-unit` job; `deploy.yml`'s `--omit=dev` is unaffected (no tests).

### 2026-07-01 (CI: parallelize + shard E2E; push logic down the test pyramid)
- **Trigger:** CI took ~7 min. Per-step timing showed **E2E = 308s (~74%)** in a single
  serial job; everything else (lint 5s, testids 2s, build 35s, unit 17s, pw-install 14s)
  was minor. One test — `all-days-completion.spec.ts` — was a single `test()` looping every
  day for grades A **and** B under an 8-min timeout, so no sharding could break it up.
- **What changed / where:**
  - `.github/workflows/ci.yml` split into two parallel jobs: `lint-and-unit` (fast gate)
    and `e2e` as a **3-way shard matrix** (`--shard=i/3`, `fail-fast: false`).
  - **Deliberate deviation from the plan's "build once + artifact" idea:** a shared build
    would *serialize* build→e2e (critical path ≈ 220s). Instead each shard builds itself in
    parallel — 3 parallel builds cost the same wall-clock as one, and the shared `.next/cache`
    keeps them incremental. Faster wall-clock (~3 min) at the cost of more CPU-minutes.
  - Split the mega-test into **per-day tests** (56 tests) so Playwright distributes them —
    shards now balance at **61/61/61**. Coverage is identical (each day still seeds all prior
    days complete, then completes that day).
  - `deploy.yml` unchanged and still safe: it gates on `workflow_run` **"CI"** `conclusion==success`,
    which is only true when *all* jobs (both matrix shards included) pass.
- **Added fast unit tests (pull logic down from slow E2E):** storage round-trip / backward-compat
  for the previously-untested learner-data stores (`streak`, `badges`, `science/final-exam`,
  `english/final-exam` incl. its legacy→level-A migration); route-builder branches
  (Science/grade/admin builders, `preserveKeys`, `previewAll` carry/clear); answer-grading
  edge cases (numbers-only rule, whitespace/format normalization); and a **test-only** exercise
  of the grade-B unlock gate in `middleware.ts` (redirect vs passthrough — no middleware edits).
- **Takeaway:** for GH Actions, parallel self-contained shards beat a shared build artifact on
  wall-clock, because artifacts add a serial job dependency. Balance shards by making sure no
  single `test()` hoards work.

### 2026-06-29 (DRY refactor: shared UI/hook/util library + canonical Card tokens + subject screen config)
- **Trigger:** Repeated, near-identical markup and logic across screens (card containers,
  back links, LTR numerals, status banners, PIN panels, admin unlock, exam scoring,
  English vs Science screens). Goal: one shared library, zero behavior/visual change.
- **What changed / where (docs phase):** catalogued the library in
  `.claude/docs/UI_COMPONENTS.md` and added an advisory scanner `scripts/check-cards.mjs`
  (`npm run check:cards` — **always exits 0**, NOT in the blocking `test:qa` chain).
  Earlier phases (already committed on `refactor/shared-components-dry`) added:
  - **UI:** `components/ui/Card.tsx` (`Card` + `ActionCard`), `Tile`, `SectionHeader`,
    `Ltr`, `BackLink`, `PinInput`, `Field`, `Alert` (atop pre-existing `Surface`,
    `Button`, `Chip`, `CenteredPanel`, `LoadingPanel`, `HeroHeader`, `ProgressBar`).
  - **Hooks:** `lib/hooks/useAdminSession`, `useStatusMessage`, `useArmedConfirm`.
  - **Utils:** `lib/utils/format`, `sanitize`, `guards`, and the pure scorer
    `lib/exam/gradeExam.ts`.
  - **Subject system:** `lib/subjects/subjectScreenConfig.ts` + `components/screens/subject/*`
    unify **English** and **Science** behind one subject-blind screen set driven by a
    per-subject `SubjectScreenConfig`.
- **Canonical Card tokens (now the standard):** radius `20px`; padding `sm/md/lg` =
  `p-4/p-5/p-6` (default `md`); card body rhythm `space-y-2`; `ActionCard` CTA gap `mt-5`;
  CTA full-width, `min-h-[44px]`. Build cards via `<Card bodyClassName="space-y-2">` /
  `<ActionCard>` rather than re-deriving these.
- **Gotcha — Surface swallows layout classNames:** `Surface` puts its `className` on the
  outer wrapper (padding works) but renders children inside an un-classed inner `<div>`,
  so `space-y-*` / `flex` / `grid` / `gap-*` passed to `<Surface>` are silently ignored.
  Fix: use `<Card bodyClassName=…>` (Card owns a body wrapper) or add your own inner
  wrapper. `Card` exists precisely to make this predictable.
- **gradeExam / threshold preservation:** `gradeExam` centralizes only the arithmetic
  (`scorePercent = total>0 ? round(correct/total*100) : 0`; `passed = total>0 &&
  scorePercent >= passPercent`). **The policy never moved into the shared code** — each
  subject still passes its OWN `*_PASS_PERCENT` and its own total source. The shared
  subject screens never branch on subject and never touch a threshold or storage key;
  they forward through config callbacks, keeping per-subject storage/grading isolated.
- **How to reuse next time:** extract by reproducing existing markup byte-for-byte
  (adoption stays a no-op), forward `data-testid` via `childTid`, and keep *policy*
  (thresholds, storage keys) in per-call-site config, not in the shared helper. Add new
  shared components to `.claude/docs/UI_COMPONENTS.md` and run `npm run check:cards`.

### 2026-06-27 (English: align reading demand to reading instruction — Level A)
- **Trigger:** A true beginner (Hebrew only, cannot read English) was being asked to
  *read* English to answer in the listening-first phase. The alphabet is taught on
  Days 8–11 and CVC decoding on Days 12–14, yet Days 1–7 already required reading:
  English-text `multiple_choice` options (no audio — `RandomizedChoiceButtons` is
  text-only), `true_false` prompts embedding English (voiced by the *Hebrew* TTS),
  audio-less `match_pairs` (`leftLang:"en"` with no `audioByLeft`), and `letter_tiles`
  spelling whole words from audio before any letter was taught.
- **Principle (reading-readiness ladder):** never require reading/encoding English
  ahead of instruction. Phase 0 (Days 1–7) = audio-only, answers in Hebrew/digits;
  Phase 1 (8–11) = single letters readable; Phase 2 (12–14) = short *taught* CVC words,
  each heard the same day first.
- **What changed / where:** content-only, IDs preserved (no storage migration). Days 1–7
  `multiple_choice`/`true_false`/`letter_tiles` → `listen_choose` (English `audioText`
  via the English voice → Hebrew/digit options); every English-word `match_pairs` tile
  (`lib/content/english/day-01..07,12,13,14.ts`) gained `audioByLeft` so it is
  tap-to-hear. Day 14 (Level-A review) got Phase-0 treatment for its vocab-recall items;
  Days 8–11 unchanged (already letter-based). Guards added:
  `tests/unit/lib/english/readingReadiness.test.ts` (per-phase rules) and
  `idStability.test.ts` (snapshot of day/section/exercise IDs — proves no progress
  orphaned).
- **Gotcha:** flipping productive "how do you say X?" `multiple_choice` into receptive
  `listen_choose` duplicates adjacent items within a review section. Fix is to retarget
  to another same-day word with same-category distractors (de-dup within a section only;
  cross-section repetition is fine for review days). The deterministic checker won't
  catch this — it needs the AI content audit.

### 2026-06-27 (English curriculum → parity with Math: two CEFR levels, like grades)
- **Trigger:** Finish English to parity with Math — full beginner program (alphabet,
  phonics, decoding/reading, grammar, reading comprehension), CEFR-aligned, non-frustrating,
  presented as two levels "like כיתות".
- **What changed / where:**
  - Content: authored `lib/content/english/day-08..28.ts` (21 new days; ~420 exercises) —
    alphabet A–Z, initial sounds, CVC reading, word families, sight words, a/an, plurals,
    this/that, pronouns + to be, can/can't, I like, prepositions, numbers 11–20, adjectives,
    sentence reading. **No new exercise kinds** — all map onto `listen_choose`/`letter_tiles`/
    `match_pairs`/`multiple_choice`/`true_false` (tap-only). Docs: `docs/ENGLISH_CURRICULUM.md`.
  - Structure (grade-style, like Math): `/english` is a **level picker**; `/english/[level]`
    homes; `/english/[level]/exam`; **Level B gated behind Level A's exam** (client-side, via
    `lib/english/levels.ts`). Reuses the `GradeId` axis ("a"=Pre-A1, "b"=A1).
  - **Single progress store kept** (`kids_math.english.workbook_progress.v1`): levels use
    disjoint day IDs (A=day-1..14, B=day-15..28), so per-level progress falls out for free —
    **no sync-bundle / admin / subjects changes needed.** Only the **exam** state is level-keyed
    (`...final_exam.v1.level.{a|b}`); `loadEnglishFinalExamState(level="a")` migrates the legacy
    single key → Level A and keeps sync/admin call sites working unchanged.
  - Content split: `getEnglishDays(level)` / `getEnglishDaysById(level)` + `getAllEnglishDays()`
    (track/admin/lookups). `routes.englishLevelPicker()` + level-keyed `englishHome/Day/Section/Exam`.
- **How to reuse:** A "level/grade" UX without storage rework — keep one store + **disjoint day
  IDs per level**, scope only the things that truly differ (here: the exam) by level, and gate
  client-side. Mirror Math's grade-picker pattern for the screens/routes.

### 2026-06-13 (AI migration: structured math render + TTS manifest + accuracy backstop)
- **Trigger:** Plan to "migrate AI" for better voice, more-accurate questions, and better question rendering (docs/AI_MIGRATION_PLAN.md, MAX, INV-FALLBACK = degrade to today's behavior on any issue).
- **What changed / where:**
  - Render: `mathExpression?` added to `BaseExercise` (`lib/types/curriculum.ts`); `resolvePromptParts` in `lib/utils/mathText.ts` prefers it over the regex `splitMathExpression`; one-line swap in `components/ExerciseBox.tsx`. Absent/malformed field → identical to today (proven by `it.each`).
  - Voice: `lib/tts/audioManifest.ts` (+ empty `audioManifest.data.json`); `lib/tts/engine.ts` `speakUtterance` now tries a pre-generated audio file first and falls back to `speechSynthesis` on any miss/error; `stopSpeech`/cancel also stop manifest audio. `scripts/generate-audio.mjs` is the human-run generator.
  - Accuracy: `validateExerciseArithmetic` in `lib/content/engine/validate.ts` (uses new `evaluateMathExpression` with × ÷ precedence), wired into `content-validity.test.ts` + seeded-bad-answer test. `scripts/audit-content-accuracy.mjs` (read-only, tmp/ only) + `scripts/author-content.mjs`.
- **What we learned:**
  - The arithmetic backstop must be **kind-aware and conservative**: `true_false` deliberately states wrong equations (answer encodes correctness), and `number_input` "fix the mistake" prompts embed wrong equations on purpose — so only flag (a) `= ?` where the numeric answer ≠ computed, and (b) `true_false` where the boolean disagrees with the equation. It immediately caught a real bug: day-14 `true_false` "45 + 10 - 5 = 55" answer `true` (correct is 50).
  - `edge-and-a11y.spec.ts` `math-token-row.png` remains env-flaky on this machine — verified it fails identically on clean `origin/main` (stash + rerun), so a diff there is not a regression. Render path is provably unchanged until content backfills `mathExpression`.
- **How to reuse next time:** runtime AI stays build/authoring-time; new paths must fall back to the legacy path and prove it with a fault-injection/`it.each` test. Confirm Claude model/pricing via the `claude-api` skill before wiring the authoring scripts.

### 2026-06-13 (Admin: English track in progress manager)

- **Trigger:** Admin progress screen managed Math only (grades א׳/ב׳); needed to also view/complete/reset the English (Pre-A1) learner track.
- **What changed / where:** `components/screens/AdminProgressScreen.tsx` — grade `<select>` became a 3-option **track** selector (א׳ / ב׳ / אנגלית) backed by `selectedSubject` + a derived `LearningTrack`; data/load/save now route through `lib/track.ts` (`getTrackDays`/`loadTrackProgress`/`saveTrackProgress`). `lib/admin/resetDayProgress.ts` — new `resetAdminEnglishDayProgress` (cascade over `getEnglishDays()`, **zero** final-exam/GMAT/grade-B side effects). `app/admin/progress/page.tsx` — parses optional `?subject=english`. Tests: `tests/unit/lib/admin/resetDayProgress.test.ts`, `tests/e2e/admin-progress.spec.ts`.
- **What we learned:**
  - The `adminProgress.*` testid helpers type their first arg as `grade: string`, so passing a **`trackKey`** (`"a"|"b"|"english"`) needs **no testid signature change** and keeps all existing Math tests valid. This is the cheapest way to add a track dimension to an existing grade-keyed screen.
  - English reuses `WorkbookProgressState` and shares the day id `"day-1"` with Math — safe **only** because the UI keys rows by `trackKey` and saves go through `saveTrackProgress` (isolated store `kids_math.english.workbook_progress.v1`). Never call `saveProgressState`/`resetAdminDayProgress` on the English path.
  - English has no final exam → hide (don't stub) the force-final-exam control via `!isEnglish`.
- **How to reuse next time — add a new subject/track to the admin screen:**
  1. Extend `Subject`/`LearningTrack` in `lib/subjects.ts` and the resolver in `lib/track.ts`.
  2. Add a `<select>` option + derive `trackKey` (subject token when no grade axis); pass `trackKey` into every `adminProgress.*` testid.
  3. If the track has no unlock/exam chain, add a side-effect-free `resetAdmin<Subject>DayProgress` helper and branch `handleReset` on it — keep the Math path byte-for-byte unchanged.
- **How to reuse next time — storage-isolation E2E guard (reusable recipe):** after a multi-store admin action, assert the **target** key changed AND the **sibling** keys are still `null`/untouched, and `page.route("**/api/lock-grade-b", …)` with a boolean flag to prove no cross-store side effect fired.
- **Backlog idea (deferred):** a `lib/track.ts` `ALL_TRACKS` registry so the admin selector (and future screens) iterate tracks instead of hardcoding `<option>`s.

### 2026-04-03 (Admin: per-section mark complete + reset)

- **Trigger:** Admin needed to force-complete or reset one workbook section at a time; full day completes when all exercises reach the completion gate (100% in engine).
- **What changed / where:** `lib/progress/engine.ts` — `forceMarkSectionComplete` merges correct answers/attempts for one section, mirrors `setAnswerForDay` completion semantics; `components/screens/AdminProgressScreen.tsx` — section rows with סמן מקטע / אפס מקטע (two-step confirm); `lib/testIds.ts` — `sectionRow`, `markSectionComplete`, `resetSection*` per section; `tests/unit/lib/progress/engine.test.ts`, `tests/e2e/admin-progress.spec.ts`.
- **What we learned:** Reuse existing `resetSectionProgress` for admin section reset (no cascade, unlike `resetAdminDayProgress`). Keep day-level vs section-level “armed reset” mutually exclusive to avoid ambiguous confirms. `check:testids` requires `data-testid` on nested `div`/`span` in new section cards (use `childTid` for header/title).
- **How to reuse next time:** For partial-day admin fills, always pass full-day `totalExercises` when calling `resetSectionProgress` / percent math, same as `SectionScreen`.

### 2026-04-01 (Day Hub: section-card navigation layer)

- **Trigger:** Add section-card hub between day list and exercises so users navigate section → exercise instead of directly to exercises.
- **What changed / where:**
  - `components/screens/DayScreen.tsx` — reduced to a thin router (~15 lines): routes to `FinalExamScreen` or `DayOverviewScreen`
  - `components/screens/DayOverviewScreen.tsx` (NEW) — section-card hub; derives section states from `correctAnswers`
  - `components/screens/SectionScreen.tsx` (NEW) — per-section exercises screen; `allExercisesCount` = full-day total (not section count) so `percentDone` is accurate
  - `app/grade/[grade]/day/[id]/section/[sectionId]/page.tsx` (NEW) — route page
  - `lib/utils/parseSectionId.ts` (NEW) — URL param validator for section IDs
  - `lib/routes.ts` — added `gradeSection` route builder
  - `lib/testIds.ts` — added `dayOverview` and `section` testId namespaces
  - `lib/hooks/useProgress.ts` — exposed `correctAnswers` in the hook return value
  - `lib/content/engine/day-builder.ts` — expanded `defaultSections` exercise counts + post-processing cap
- **Section unlock rules (critical):**
  - Section 0 (warmup): always open
  - Middle sections (1 to N-2): open once warmup is complete
  - Last section (N-1): open **only when ALL other sections are complete**
  - This logic lives in `getSectionCardState()` in `DayOverviewScreen` AND in the gate at the top of `SectionScreen`
- **Exercise count constraints:**
  - Non-last sections: 4–8 exercises (min 4, max 8)
  - Last section: 6–10 exercises (min 6, max 10)
  - Enforced two ways: (1) `defaultSections` definition now meets minimums; (2) post-processing cap in `buildDayFromConcepts` trims any section exceeding the max (fixes days 8-14 expanded sections)
- **`allExercisesCount` is sacred:** In `SectionScreen`, always pass the full day's exercise count to `useProgress`, not the current section's count. Otherwise `percentDone` only reflects the section rather than the whole day.
- **`check:testids` strictness:** Every intrinsic HTML element (div, span, p, main, header, button) needs `data-testid`. Use `childTid(parentTestId, "subkey")` for nested elements.
- **How to reuse next time:** When adding a new navigation layer (hub → sub-screen), always: (a) keep `allExercisesCount` = full day total in the sub-screen; (b) put gate logic in BOTH the hub (for card state) and the sub-screen (for direct URL access); (c) use `parseSectionId` for URL param validation.

### 2026-03-29 (Faster deployment: CI caches + deploy policy)
- **Trigger:** Plan to speed CI/deploy without duplicating quality gates (Playwright + Next cache, concurrency, quick vs upload-only policy).
- **What changed / where:** `.github/workflows/ci.yml` (`.next/cache`, `.playwright-browsers` caches, `PLAYWRIGHT_BROWSERS_PATH`, concurrency), `deploy.sh` (`--skip-build` with `--skip-tests`), `package.json` (`deploy:firebase:upload-only`), `firebase.json` (ignore `.next`, `.playwright-browsers`, `coverage`), `docs/DEPLOYMENT.md`.
- **What we learned:** Lockfile-keyed Playwright cache avoids stale cross-major reuse; Next cache keys include `next.config.mjs`. **`--skip-build`** is gated to `--skip-tests` and documented as same-SHA-green + Node parity with App Hosting.
- **How to reuse next time:** Keep one deploy “authority” (GitHub vs CLI); measure E2E duration before adding Playwright sharding + blob merge.

### 2026-03-29 (Grade home / plan: reload progress on resume)
- **Trigger:** Day completed (100%, הושלם) but grade home day cards did not show completion until hard refresh.
- **What changed / where:** `lib/progress/storage.ts` (`workbookProgressStorageKey`), `lib/client/loadGradeScreenState.ts`, `lib/hooks/useReloadOnStorageResume.ts`, `components/screens/HomeScreen.tsx`, `components/screens/PlanScreen.tsx`, `tests/e2e/grade-a-lifecycle.spec.ts`.
- **What we learned:** `loadProgressState` ran only on mount / grade change. BFCache, browser back, and cross-tab writes can show **stale React state** while `localStorage` is already updated. Re-read workbook progress (and the same bundle as home: final exam, events, `previewAll`) on `pageshow` when `persisted`, on `storage` for the grade key, and debounced `visibilitychange`.
- **How to reuse next time:** Any screen that mirrors `localStorage` in React state and must stay in sync after navigation or tab switches should subscribe to the same resume pattern, not only `useEffect([deps])` on first paint.

### 2026-03-29 (Per-day record time + `bestTimeMs`)
- **Trigger:** Plan to measure session length from first answer to first 100% gate, show PB on home, live timer in day header; unify speed-run writes with `useProgress`.
- **What changed / where:** `lib/progress/engine.ts` (`computeElapsedMsForCompletedDay`, `applyBestTimeMsIfImproved`; `markDayComplete` uses `completedAt` − `attempts[0]`; no `wrongCount` after sticky `isComplete`), `lib/hooks/useProgress.ts` (`improveBestTime`, `completedAt`/`firstAttemptedAt`/`bestTimeMs`), `components/DayHeader.tsx`, `components/screens/DayScreen.tsx`, `components/screens/HomeScreen.tsx`, `lib/utils/formatMs.ts`, `lib/testIds.ts`.
- **What we learned:**
  - Persisted PB updates for speed-run should go through **`applyBestTimeMsIfImproved` + `useProgress`** so a single `saveProgressState` path avoids races with direct storage writes.
  - Post-complete practice should not increment **`wrongCount`** or the 10-wrong auto-reset can wipe sticky completion.
- **How to reuse next time:** Elapsed display = `computeElapsedMsForCompletedDay` or live `Date.now() − firstAttempt` until `percentDone === 100`, then freeze using `completedAt`.
- **Follow-up:** `mergeBestTimeMs` in `lib/progress/engine.ts` centralizes PB min logic for `markDayComplete` + `applyBestTimeMsIfImproved`. E2E `edge-and-a11y.spec.ts` covers “sticky completion + 10 wrongs” does not show reset notice.


### 2026-03-27 (Firebase App Hosting + `NODE_ENV=production` installs)
- **Trigger:** Cloud Build for App Hosting failed: missing `tailwindcss`, bogus `@/` resolutions, then local prod simulation failed on ESLint + `vitest.config.ts` typecheck.
- **What changed / where:** `package.json` (move `tailwindcss`, `postcss`, `typescript`, `@types/*` to `dependencies`), `next.config.mjs` (`eslint.ignoreDuringBuilds`), `tsconfig.json` exclude `tests`/Vitest/Playwright configs from app typecheck.
- **What we learned:**
  - App Hosting runs `npm ci` with **`NODE_ENV=production`**, so **`devDependencies` are not installed**; anything `next build` needs (Tailwind, PostCSS, TS) must live in **`dependencies`** (or the build must install devDeps—nonstandard).
  - Next’s build-time ESLint expects `eslint` installed unless **`eslint.ignoreDuringBuilds`**; keep `npm run lint` in CI/deploy scripts.
  - Root **`vitest.config.ts`** was inside `include`; excluding test-only configs avoids production typecheck needing Vitest.
- **How to reuse next time:** After dependency moves, verify with `rm -rf node_modules .next && NODE_ENV=production npm ci && npm run build`.

### 2026-03-27 (Firebase App Hosting requires Blaze)
- **Trigger:** Deploy `kids_math` to Firebase project `kids-learing-hub` via existing `deploy.sh` / `apphosting:kids-math`.
- **What changed / where:** `.firebaserc` (default project), `package.json` scripts `deploy:firebase` / `deploy:firebase:quick`.
- **What we learned:**
  - `firebase deploy --only apphosting:<backendId>` fails on Spark: project must upgrade to **Blaze** before API `firebaseapphosting.googleapis.com` can be enabled. Console link is printed in the CLI error (Usage & billing for the project).
  - Repo was already configured (`firebase.json` apphosting + `apphosting.yaml`); **ymt**-style classic Hosting (`public` + static `dist`) is the wrong model for this Next.js app (middleware + `/api/*` route handlers).
- **Why it matters:** Avoids assuming App Hosting works on the free tier; sets correct expectations for deploy troubleshooting.
- **How to reuse next time:** After Blaze upgrade, run `npm run deploy:firebase` (full QA) or `npm run deploy:firebase:quick` (build + deploy only), then smoke the live App Hosting URL from the deploy output.

### 2026-03-27 (Timed exam-session + optional GMAT-style challenge)
- **Trigger:** Optional post-final-exam challenge with GMAT Focus–inspired rules and reusable architecture.
- **What changed / where:** `lib/exam-session/*`, `lib/gmat-challenge/*`, `components/timed-exam/*`, `components/screens/GmatChallengeScreen.tsx`, `app/grade/[grade]/gmat-challenge/page.tsx`, entry CTAs on `FinalExamScreen` / `HomeScreen`, `global-e2e.d.ts`, analytics events, `tests/unit/**`, `tests/e2e/gmat-challenge.spec.ts`, `.cursor/rules/timed-exam-session.mdc`.
- **What we learned:**
  - Separate generic session policy (`exam-session`) from product pickers/storage (`gmat-challenge`) so future timed exams do not duplicate timer/review math.
  - GMAT-like “up to three answer changes per section” maps cleanly to “max divergent exercises vs end-of-section snapshot” using `normalizeAnswerValue`.
  - Playwright E2E for timed flows: set `window.__KIDS_MATH_E2E_SHORT_GMAT__` in `addInitScript` to cap section/break durations without shipping test hooks in production UI beyond a harmless global flag.
- **Why it matters:** Keeps optional assessments maintainable, testable, and obviously non-gating for unlock logic.
- **How to reuse next time:** Follow `timed-exam-session.mdc`; add a new `lib/<exam>/` adapter + compose existing timed-exam components.


### 2026-03-27 (Cursor rules: speed + accuracy scaling)
- **Trigger:** בקשה לבצע מחקר עומק ולהאיץ את תהליך הפיתוח דרך עדכוני `.cursor`.
- **What changed / where:** `.cursor/rules/multi-agent-playbook.mdc`, `.cursor/rules/agent-definer.mdc`, `.cursor/rules/quality-gates.mdc`, `.cursor/rules/testids.mdc`, `.cursor/rules/agent-guidelines.mdc`, `.cursor/rules/add-grade.mdc`, `.cursor/rules/build-school-year.mdc`.
- **What we learned:**
  - חובה להימנע משכפול חוזים בין כללים; עדיף מקור קנוני אחד ל־handoff ול־quality gates והפניות מכל כלל אחר.
  - workflow קבוע "תמיד full multi-role" מאט משימות פשוטות; מודל scaled לפי סיכון (small/medium/high-risk) שומר על דיוק ומקצר זמן ריצה.
  - יישור gates מקומיים ל־CI (`check:testids`) מפחית הפתעות ב־PR ומקטין סבבי תיקון.
  - מדיניות `data-testid` אפקטיבית יותר כשאוכפים קשיחות על אלמנטים אינטראקטיביים/עוגני בדיקה ולא על כל `div/span` מצגתי.
- **Why it matters:** משפר יחס signal/noise לכללים, מצמצם overhead של הסוכן, ושומר על כיסוי חכם באזורים מסוכנים (gates/storage/routing).
- **How to reuse next time:** בכל שינוי כללים רחב, להתחיל במקור קנוני אחד, להוסיף מטריצת בדיקות מבוססת סיכון, ולהגדיר precedence ברור כשכללים מתנגשים.

### 2026-03-27 (Admin route + search params in App Router)
- **Trigger:** הוספת מסך אדמין לעריכת התקדמות ימים (complete/reset) עם PIN.
- **What changed / where:** `app/admin/progress/page.tsx`, `components/screens/AdminProgressScreen.tsx`, `lib/admin/session.ts`, `lib/routes.ts`, `lib/progress/engine.ts`, בדיקות unit/e2e.
- **What we learned:**
  - שימוש ב־`useSearchParams` בתוך עמוד שמרונדר סטטית יכול להפיל build אם לא עוטפים ב־`Suspense`; עדיף לפרסר `searchParams` ב־`page.tsx` (server) ולהעביר `initialGrade` לקומפוננטת client.
  - למסכי כלי/אדמין שמבוססים על localStorage, עדיף גבול נקי: route server פשוט + מסך client-only + מודול session נפרד (`lib/admin/session.ts`).
  - לשינויי unlock/gating, בדיקת e2e חייבת לכלול גם relock (reset) ולא רק unlock.
- **Why it matters:** מונע כשלי build ב־Next.js ושומר על ארכיטקטורה יציבה למסכים client-heavy.
- **How to reuse next time:** בכל route חדש שצריך query params + localStorage — פרסו query בשרת, העבירו props לקליינט, והוסיפו e2e דו-כיווני (enable + disable behavior).

### 2026-03-27 (Admin bulk completion flows)
- **Trigger:** בקשה להוסיף לאדמין גם סימון גורף לכל הימים וגם סימון מבחן מסכם כהושלם.
- **What changed / where:** `components/screens/AdminProgressScreen.tsx`, `lib/testIds.ts`, `tests/e2e/admin-progress.spec.ts`.
- **What we learned:**
  - בסימון מבחן מסכם אדמיני, עדיף לייצר state תקין דרך `createInitialFinalExamState` ואז להוסיף `submittedAt/scorePercent/passed`, במקום לכתוב shape ידנית.
  - כדי למנוע עקיפה לא רצויה של gate, כפתור “סמן מבחן מסכם כהושלם” צריך להיות מושבת עד שכל ימי הלימוד הרגילים (ללא `day-29`) מסומנים כהושלמו.
  - כיתה א׳ דורשת side-effect נוסף (קריאה ל־`/api/unlock-grade-b`) כשמסמנים מבחן מסכם כעובר.
- **Why it matters:** שומר על חוזי unlock עקביים בין זרימה רגילה לאדמין, ומונע state חלקי/לא תקין.
- **How to reuse next time:** לכל action אדמיני שמשפיע על gating, לאכוף תנאי-קדם ב־UI ולהוסיף e2e שמכסה גם disabled->enabled->effect.

### 2026-03-27 (All-days QA: unlock race + verbal numeric answers)
- **Trigger:** בקשת QA מלאה לסיים את כל הימים בכיתה א׳ וב׳, למצוא תקלות, לתקן ולהריץ שוב.
- **What changed / where:** `tests/e2e/day-smoke.spec.ts`, `tests/e2e/all-days-completion.spec.ts`, `tests/e2e/answering.ts`, `lib/utils/exercise.ts`, `components/screens/FinalExamScreen.tsx`, `lib/testIds.ts`, `tests/unit/lib/utils/exercise.test.ts`.
- **What we learned:**
  - ב־`verbal_input` תשובה מספרית כמו `"2"` נורמלת לערך מספרי ועלולה להיפסל למרות שהתשובה הנכונה היא מחרוזת `"2"`; צריך להשוות טקסט מנורמל על בסיס `String(normalized)`.
  - בזרימת מבחן מסכם כיתה א׳, כפתור ״להתחיל כיתה ב׳״ יכול להילחץ לפני שסיום `POST /api/unlock-grade-b` הושלם; צריך לנעול את ה־CTA בזמן פתיחת הכיתה.
  - `data-testid` לבחירות עם טקסט עברי חייב fallback דטרמיניסטי ייחודי (ולא `"x"` אחיד) כדי להימנע מהתנגשויות selector.
- **Why it matters:** מונע חסימות מעבר לא מוצדקות, מפחית flaky ב־E2E, ומאפשר כיסוי אמין של כל ימי הלימוד.
- **How to reuse next time:** בכל שינוי לוגיקת תשובות/מבחן — להריץ `day-smoke` + `all-days-completion` + lifecycle, ולוודא ש־CTA תלויי-API לא ניתנים ללחיצה לפני שהפעולה הסתיימה.

### 2026-03-27 (Randomized choice order with stable selectors)
- **Trigger:** בקשה שהמיקום של תשובה נכונה בתרגילי בחירה לא יהיה קבוע, ושיהיה רנדומלי בכל כניסה למסך.
- **What changed / where:** `components/exercises/RandomizedChoiceButtons.tsx`, `components/exercises/ExerciseRenderer.tsx`, `lib/utils/choiceOptions.ts`, בדיקות e2e/unit קשורות.
- **What we learned:**
  - רנדומיזציה צריכה להיות ברמת קומפוננטת תצוגה, לא ברמת תוכן/בדיקת נכונות, כדי לשמור על חוזה בדיקה ו־grading יציבים.
  - שימוש ב־`data-testid` מבוסס ערך (`choice(exerciseId, optionKey)`) שומר על עמידות בדיקות גם כשהסדר אקראי.
  - כדי למנוע קפיצות UI בזמן אינטראקציה, חשוב לייצב את סדר האפשרויות פעם אחת ב־mount של הקומפוננטה.
- **Why it matters:** משפר חוויית למידה (פחות pattern memorization) בלי לשבור התמדה/בדיקות/אימות תשובות.
- **How to reuse next time:** לכל exercise בחירה חדש, לבנות אפשרויות דרך `getChoiceOptionsForExercise` ולהציג דרך `RandomizedChoiceButtons`.

### 2026-03-27 (Render performance via shared exercise wrapper)
- **Trigger:** דיווח על האטה כללית וקפיצות בזמן עבודה במסכי תרגול.
- **What changed / where:** נוספה קומפוננטה משותפת `components/exercises/ExerciseItem.tsx`; מסכי `DayScreen` ו־`FinalExamScreen` עברו להשתמש בה עם callbacks מיוצבים (`useCallback`) ו־state refs.
- **What we learned:**
  - כשהורה מרנדר רשימת תרגילים עם closures inline לכל פריט, שינוי בתרגיל אחד גורר עבודה מיותרת על כל העץ.
  - מעטפת תרגיל ממואמת עם חוזה callbacks משותף מאפשרת לשמור גישת template-first וגם להפחית churn ברינדור.
  - ייצוב סביבה (שרת dev יחיד + `dev:clean`) חייב לבוא לפני אופטימיזציה בקוד, אחרת מתקבלות תוצאות מטעות.
- **Why it matters:** מפחית תחושת jank במסכי יום/מבחן בלי לפצל לוגיקה ל-one-off fixes.
- **How to reuse next time:** בכל רשימת exercises חדשה, לרנדר דרך `ExerciseItem` (או מעטפת דומה), ולהימנע מהעברת handlers inline לכל פריט.

### 2026-03-27 (Next dev missing chunk recovery)
- **Trigger:** Incognito first-load crashed with `Cannot find module './682.js'` from `.next/server/webpack-runtime.js`.
- **What changed / where:** stabilized dev runtime (single `next dev` process + `.next` cleanup), added `dev:clean` in `package.json`.
- **What we learned:**
  - Running multiple `next dev` processes on the same repo can corrupt/desync hot-update chunks and cause missing module errors.
  - The fastest deterministic recovery is: keep one dev server, clear `.next`, restart once, then retest route.
  - Only debug app runtime errors (hooks/client-server boundaries) after build-state corruption is eliminated.
- **Why it matters:** prevents chasing false code-level bugs caused by stale bundler artifacts.
- **How to reuse next time:** if chunk/module errors appear in dev, run `npm run dev:clean` and ensure only one local dev server is active.

### 2026-03-26 (ExerciseRenderer + focus contract)
- **Trigger:** בקשה לאחד את קומפוננטת התרגילים כדי להימנע משכפול וטעויות בהטמעה רוחבית.
- **What changed / where:** `components/exercises/ExerciseRenderer.tsx` (חדש), `components/ExerciseBox.tsx`, `components/VerbalQuestion.tsx`, `components/screens/DayScreen.tsx`, `components/screens/FinalExamScreen.tsx`.
- **What we learned:**
  - פיצול נכון הוא `ExerciseBox` ככרטיס (prompt/feedback/actions) ו־`ExerciseRenderer` כלוגיקת UI לפי `exercise.kind`.
  - כדי ש־`focusNextInput` יעבוד גם לתרגילי בחירה, צריך חוזה אחיד של `data-exercise-focus="true"` במקום `querySelector("input")`.
  - שמירה על `testIds.component.exerciseBox.*` ללא שינוי מאפשרת רפקטור פנימי בלי לשבור E2E.
- **Why it matters:** מצמצם drift בין מסכי יום/מבחן מסכם ומקטין רגרסיות בניווט מקלדת ובבדיקות אוטומטיות.
- **How to reuse next time:** בכל הוספת `Exercise.kind` חדש, להוסיף branch אחד ב־`ExerciseRenderer` עם focus target יחיד ו־test ids יציבים.

### 2026-03-26 (תיקוף תרגילים רוחבי + number_line_jump)
- **Trigger:** בקשה לעבור על כל הימים/כיתות ולוודא תקינות מתמטית ותצוגת תרגילים.
- **What changed / where:** `lib/content/days.ts`, `lib/content/days-grade-b.ts`, `lib/utils/mathText.ts`, `tests/unit/lib/content/content-validity.test.ts`, `tests/unit/lib/utils/mathText.test.ts`, `tests/e2e/day-smoke.spec.ts`.
- **What we learned:**
  - באגים ב־`number_line_jump` יכולים להיווצר בקלות כש־`prompt`/`step`/`answer` מתעדכנים בנפרד בתנאים טרנריים.
  - בדיקת יחידה רוחבית על כל התוכן (`getWorkbookDays`) תופסת מהר חוסר עקביות מתמטי שהיה חומק בבדיקות נקודתיות.
  - פיצול מתמטיקה מטקסט (`splitMathExpression`) צריך להימנע מ־`replace` לא־אינדקסי כדי לא להסיר מופע שגוי.
- **Why it matters:** מונע תרגילים לא תקינים במסך (גם אם הבדיקה הידנית לא מגיעה בדיוק ליום/תרגיל הבעייתי).
- **How to reuse next time:** בכל שינוי תוכן/גנרטור להריץ קודם `test:unit` עם `content-validity` לפני E2E מלא.

### 2026-03-26 (Cursor rule — בניית שנת חינוך)
- **Trigger:** בקשה להשוות שיטות הוראה בין מדינות ולהטמיע תהליך קבוע ל״בניית שנת לימוד״ במוצר.
- **What changed / where:** כלל חדש `.cursor/rules/build-school-year.mdc`.
- **What we learned:**
  - כדאי לקבע workflow קבוע: Plan → Benchmark → Map → Implement → Measure → Iterate.
  - במוצר הזה נקודות ההטמעה המרכזיות הן: `lib/content/days.ts` (sequencing/variation), `lib/utils/exercise.ts` (hints/feedback), `lib/progress/engine.ts` (gates), ו־UI במסכי היום.
- **Why it matters:** מונע “המלצות כלליות” בלי תרגום למוצר, ושומר על עקביות בין ריצות/שנים/כיתות.
- **How to reuse next time:** כשמוסיפים כיתה/שנת לימוד — להתחיל מהכלל `build-school-year.mdc` ולצאת ממנו לתכנון, הטמעה ובדיקות.

### 2026-03-26 (Playwright — localStorage clearing pitfall)
- **Trigger:** הוספת בדיקות E2E לזרימות התקדמות/רענון (persist אחרי reload).
- **What changed / where:** בדיקות Playwright חדשות תחת `tests/e2e/**`.
- **What we learned:**
  - `page.addInitScript(() => localStorage.clear())` רץ בכל ניווט מחדש, כולל `page.reload()`, ולכן “שובר” בדיקות התמדה (הוא מוחק את ה־localStorage לפני שהאפליקציה נטענת מחדש).
  - עדיף לנקות אחסון חד־פעמית בתחילת טסט ע״י `page.goto("/")` ואז `page.evaluate(() => localStorage.clear())`.
- **Why it matters:** מאפשר לבדוק התמדה אמיתית (mid-progress / after-completion) בלי flaky failures.
- **How to reuse next time:** בבדיקות שכוללות reload — לא להשתמש ב־`addInitScript` לניקוי localStorage.

### 2026-03-25 (multi-agent playbook — שמירת דפוסים)
- **Trigger:** הרחבת ההנחיה גם ל־`multi-agent-playbook.mdc`.
- **What changed / where:** תוספת ל־Implementer, לרשימת ביקורת סקירה, ול־Handoff `Learning update` — קישור ל־`learning-loop.mdc` ולעדכון `.cursor/rules` לדפוסים יציבים.

### 2026-03-25 (כלל — תיעוד דפוסים בזמן פיתוח)
- **Trigger:** בקשה שסוכנים יעדכנו `.cursor` כשהם מזהים דפוסים חוזרים בפרויקט.
- **What changed / where:** סעיף "While developing: capture patterns" ב־`.cursor/rules/learning-loop.mdc`; סעיף "Evolving Cursor rules" ב־`agent-guidelines.mdc`.
- **What we learned:** לוג קצר ב־`LEARNING_LOG.md` לגילויים חד־פעמיים; עדכון או קובץ `.mdc` כשהדפוס יציב וצריך לאגד כל סוכן.
- **How to reuse next time:** אחרי רפקטור/פיצ׳ר — לשאול אם יש כאן convention שכדאי לקבע בכללים.


### 2026-03-25 (Cursor rule — הוספת כיתה)
- **Trigger:** בקשה לאפיין זרימה ורשימת ביקורת להוספת כיתה חדשה בעתיד.
- **What changed / where:** `.cursor/rules/add-grade.mdc` (ארכיטקטורה A מול B, mermaid, רשימת משימות, סיכונים); ציטוט קצר ב־`agent-definer.mdc` / `agent-guidelines.mdc`.
- **What we learned:** נקודת הכניסה לסוכן היא איחוד `GradeId` + `workbook.ts` + `curriculum-plan` + אחסון v2 לפי כיתה + מבחן `day-29` + שער כיתה ב׳ דרך עוגייה אחרי עוברים מבחן בא׳.
- **How to reuse next time:** לפני PR להוספת כיתה — לעבור על `add-grade.mdc` ולהרחיב בדיקות e2e אם יש שער נתיבים חדש.

### 2026-03-25 (כיתה ב׳ — חוברת נפרדת + מבחן מסכם)
- **Trigger:** מימוש כיתה ב׳ עם אותו מודל ימים/יום 29 כמו א׳.
- **What changed / where:** `lib/content/days-grade-b.ts` + `buildDayFromConcepts(..., simpleSections)` ב־`lib/content/days.ts`; `lib/content/workbook.ts` בוחר חוברה לפי `grade`; `getMinistryStrandsForGrade` / `getTotalCurriculumDaysForGrade` ב־`curriculum-plan.ts`; `DayScreen` / `HomeScreen` / `FinalExamScreen` תומכים במבחן לכיתה ב׳; נעילת `unlock-grade-b` רק אחרי מבחן עובר **בכיתה א׳**.
- **What we learned:** אפשר לשתף את בנאי הימים עם `simpleSections: true` לכיתה ב׳ (בלי בלוקי התרחבות ימים 1–14 של א׳) ולהשאיר `day-29` כמזהה מבחן משותף.
- **How to reuse next time:** תגיות `SkillTag` חדשות לכיתה ב׳ — להרחיב גם את `warmupExerciseForTag` ב־`days.ts`.

### 2026-03-25 (כיתה ב׳ — זרימת יום כמו א׳ אחרי חימום)
- **Trigger:** לבנות יום שמתחיל בחימום ספירלה ואז מקטע «מושג היום» מדורג לחומר אותו יום (בלי תרגילי כיתה א׳ לפי `dayNumber`).
- **What changed / where:** `buildProgressiveConceptFocusSection` + `BuildDaySectionOptions.progressiveConceptFocus` ב־`lib/content/days.ts`; `days-grade-b.ts` מפעיל לימים 1–28.
- **What we learned:** אפשר לשכפל את רצף המקטעים (חימום → מושג מורחב → שפה → בדיקה → אתגר) עם תוכן שנגזר רק מ־`DayConcept`, בלי להפעיל `buildExpandedExercisesForEarlyDays` שמקושר לימי א׳.

### 2026-03-25 (אחסון התקדמות כיתה ב׳ — v2 כמו א׳)
- **Trigger:** ליישר פונקציונליות/לוגיקת שמירה עם כיתה א׳; חומר הלימוד נשאר נפרד (`days-grade-b`).
- **What changed / where:** `kids_math.workbook_progress.v2.grade.b` (במקום `v1.grade.b`); מיגרציה חד־פעמית מ־`v1.grade.b` ב־`lib/progress/storage.ts`; `clearProgressState` מוחק גם את מפתח ה־v1 הישן.
- **What we learned:** מקטעי «expanded» לימים 1–14 ב־`days.ts` קשורים לנרטיב כיתה א׳ לפי `dayNumber` — לא ניתן להפעיל אותם על חוברת ב׳ בלי לשבור את הפרדת החומר.

### 2026-03-25 (כיתה א' — 29 ימים, מיגרציה)
- **Trigger:** סיום רפקטור ימי תוכן + מבחן סיום; תיקון שבירת תחביר ושערי איכות.
- **What changed / where:** `lib/content/days.ts` (סגירת אובייקט יום 29); אימות `npm run lint` / `build` / `test:unit` / `test:e2e`.
- **What we learned:**
  - שורה כפולה אחרי `geometryAnswer` בתוך מערך `concepts` שברה parse והפילה ESLint/TypeScript.
  - `playwright.config.ts` בוחר `next start` כש־`CI` מוגדר — צריך `npm run build` לפני E2E (כמו ב־GitHub Actions); מקומית בלי בנייה מלאה עדיף `CI=` או dev בלבד.
  - אם `next build` נכשל על `next-font-manifest.json` חסר, ניקוי `.next` ואז build מחדש פותר בדרך כלל.
- **Why it matters:** תוכן + מיגרציית התקדמות תלויים במערך תקין ובסדר הרצת בדיקות.
- **How to reuse next time:** אחרי עריכות גדולות ל־`days.ts`, להריץ lint מיד; לפני E2E מקומי עם `CI=true`, לוודא שיש `BUILD_ID` תחת `.next`.

### 2026-03-25 (נתיב יום בתוך כיתה + 404)
- **Trigger:** דפדפן הראה 404 ל־`/grade/a/day/day-2` בעוד שהבנייה מחזירה 200 לנתיב זה.
- **What we learned:** אם `next dev` רץ מתוך תיקייה ישנה בלי `app/grade/[grade]/day/[id]/page.tsx`, או אחרי שינויי ניתוב בלי ריסטארט/`rm -rf .next`, אפשר לקבל 404. בנוסף, `parseDayId` קיבל חיזוקים (trim, מקף יוניקוד, `day-01`, רישיות).
- **Files:** `lib/utils/parseDayId.ts`, `lib/grades.ts`, `tests/unit/lib/utils/parseDayId.test.ts`

## 2026-03-25

- Initial learning-log scaffolding for consistent future agent behavior.


### 2026-04-03 (Hebrew TTS + admin toggle)
- **Trigger:** Tap-to-play vocal instructions with admin on/off (per browser).
- **What changed / where:** `lib/tts/engine.ts`, `lib/admin/prefs.ts`, `lib/hooks/useAdminTtsEnabled.ts`, `components/ui/TapToPlayTtsButton.tsx`, `components/ExerciseBox.tsx`, `components/screens/AdminProgressScreen.tsx`, `lib/testIds.ts`.
- **What we learned:** Prefer `localStorage` + `CustomEvent` for same-tab pref sync; `storage` event only fires cross-tab. E2E should wrap native `speechSynthesis.speak` after navigation (init scripts can lose to Next hydration).
- **How to reuse next time:** Add `data-testid` on new layout wrappers early — `check:testids` flags bare `<div>` rows.

- **Follow-up (2026-04-03):** TTS string now uses `buildExercisePromptSpeakText` (`lib/utils/exercisePromptSpeakText.ts`) so audio follows visible text + math line; admin TTS state moved to `AdminTtsProvider` in root layout (`AppProviders`) so listeners are not duplicated per `ExerciseBox`.

### 2026-04-03 (Day Hub: teaching primer + TTS)

- **Trigger:** Plan to add “learn first” copy on the day overview before section cards, with optional Hebrew TTS, aligned with international CPA-style pedagogy.
- **What changed / where:**
  - `lib/types/curriculum.ts` — optional `teachingSummary` / `teachingSteps` on `WorkbookDay`
  - `lib/content/engine/exercise-factories.ts` — optional fields on `DayConcept`
  - `lib/content/engine/day-builder.ts` — maps concept fields onto `WorkbookDay`
  - `lib/content/buildDayPrimerSpeakText.ts` — `hasDayTeachingPrimer`, `buildDayPrimerSpeakText`, collapse threshold constant
  - `components/DayTeachingPrimer.tsx` — Surface panel under header; collapse when long; `TapToPlayTtsButton`; testIds
  - `components/screens/DayOverviewScreen.tsx` — renders `DayTeachingPrimer`
  - `components/DayHeader.tsx` — helper-based testIds when `rootTestId` is set (weekBadge, title, emoji, objective)
  - `lib/testIds.ts` — `teachingPrimer`, `teachingPrimerTts`, `teachingPrimerExpand`
  - Pilot content: `lib/content/grade-a/day-01.ts`, `day-02.ts`, `day-08.ts`
  - Tests: `content-validity.test.ts`, `buildDayPrimerSpeakText.test.ts`, `day-smoke.spec.ts`
- **How to reuse:** Author optional primer on `DayConcept`; keep copy consistent with section `WorkedExample`; run `check:testids` on any new DOM in the primer subtree.

### 2026-04-03 (Teaching primer: full Grade A rollout + subcomponents)
- **What changed:** All `lib/content/grade-a/day-*.ts` concepts now include optional `teachingSummary` / `teachingSteps` where missing; UI split into `components/teaching-primer/` (`TeachingPrimerExpandedContent`, `TeachingPrimerExpandToggle`, `DayTeachingPrimer`) with `components/DayTeachingPrimer.tsx` re-export.
- **E2E:** "no primer" scenario uses **Grade B** `day-1` (no authored primer) + unlock cookie.

### 2026-05-17 (Teaching primer: catalog, child TTS, Grade B primers)
- **Trigger:** Grade-fit Hebrew copy + slower chunked primer TTS app-wide.
- **What changed / where:** `lib/content/teachingPrimerCatalog.ts` (58 days); `teachingPrimerFromCatalog` in `day-builder` with `grade` option; `lib/tts/constants.ts` + child default in `lib/tts/engine.ts` (`speakHebrewChunks`); `TapToPlayTtsButton` `chunks` prop; `docs/TEACHING_PRIMER_GUIDELINES.md`; `teaching-primer-content.test.ts`.
- **How to reuse:** Edit catalog per grade/day; run primer content + TTS unit tests and `day-smoke` / `grade-b-lifecycle` E2E.

### 2026-06-13 (English learning layer — Phase 0/1: audio-first Hebrew→English)
- **Trigger:** Add a second subject (English, taught from Hebrew) alongside Math, same warm-up → teaching → final-exam shape, built on researched young-EFL best practice (listening-first, comprehensible input, no free text).
- **What changed / where (Phase 0 rails + Phase 1 Day 1):**
  - `lib/subjects.ts` — `Subject` + `LearningTrack` model (math is grade-keyed, english is single subject-keyed track)
  - `lib/track.ts` — resolver mapping `{subject,grade}` → day source + (isolated) progress store; keeps `lib/progress/storage.ts` untouched
  - `lib/english/storage.ts` — isolated `kids_math.english.workbook_progress.v1` store (reuses `WorkbookProgressState` + `sanitizeState`)
  - `lib/types/curriculum.ts` — new `listen_choose` / `letter_tiles` exercise kinds (audio + tap-to-spell, no keyboard)
  - Handled new kinds in `lib/utils/exercise.ts` (grading+hint), `lib/progress/engine.ts` (answer lookup), `lib/utils/choiceOptions.ts`, `lib/content/engine/exercise-factories.ts`
  - `components/exercises/AudioButton.tsx` (English TTS + graceful no-voice fallback), `LetterTiles.tsx`; wired into `ExerciseRenderer.tsx`
  - `lib/tts/engine.ts` — parameterized lang; `speakEnglish` + `pickEnglishVoice` + `isEnglishVoiceAvailable`
  - English screens `components/screens/english/*` + pages `app/english/**`; English entry card on `app/page.tsx`; `routes.ts` builders
  - Hooks `useProgress` / `useDayAnswers` take optional `subject` (default math → byte-identical)
  - Content: `lib/content/english/day-01.ts` (Greetings & Colors), `english-workbook.ts`
  - Tests: `tests/unit/lib/english/storage.test.ts`, `exercise-english-kinds.test.ts`, `tests/e2e/english-day-smoke.spec.ts`
- **What we learned:**
  1. `ExerciseRenderer` was **non-exhaustive** — a trailing `else` silently rendered any unknown kind as a number-line. Adding kinds requires fixing this to a real `never` check, plus 3 other exhaustive switches the compiler flags (`exercise.ts` ×2, `progress/engine.ts`).
  2. `tid()`/`childTid()` **lowercase every segment** — a camelCase E2E selector (`letterTiles`) won't match the DOM (`lettertiles`). Always build selectors via the testId helpers, never hand-concatenate.
  3. `tests/e2e/edge-and-a11y.spec.ts` `math-token-row.png` screenshot is **environment-flaky** (fails on a clean tree on this machine) — not a code regression.
- **How to reuse next time:** New subject → add to `Subject`, give it its own `lib/<subject>/storage.ts` (never edit math's), resolve via `lib/track.ts`, thread `subject` through hooks (default-preserve math), and build thin dedicated screens reusing `ExerciseItem`/`SectionBlock`/`useProgress`/`useDayAnswers`. Deferred for Phase 2: `match_pairs` kind, English final exam, sync-bundle v2 (English keys), `/`→Subject-Picker relocation, full Pre-A1 curriculum.

### 2026-06-13 (Subject-first IA: `/` = subject picker, grades under Math)
- **Trigger:** Make the main screen show "Math" and "English"; grades live inside Math.
- **What changed / where:**
  - `app/page.tsx` — now the **Subject Picker** (`testIds.screen.subjectPicker.*`)
  - `app/math/page.tsx` (new) — the Math grade picker (keeps `testIds.screen.gradePicker.*`) + "back to subjects" nav (`gradePicker.navBack`)
  - `lib/routes.ts` — `gradePicker()` now aliases **`/math`** (so all existing "back to grade selection" links auto-correct with no per-file edits)
  - `lib/testIds.ts` — added `subjectPicker.*`, moved `englishCard*` there, added `gradePicker.navBack`
  - Tests: `routes.test.ts` (IA path map), `subject-picker.spec.ts` (new nav E2E); updated `admin-progress`/`auth-backward-compat`/`grade-b-lifecycle`/`english-day-smoke`
  - `docs/NAVIGATION_IA.md` (new) — route map + How-tos
- **What we learned:**
  1. **Aliasing the old route builder is cheaper than repointing call sites.** `routes.gradePicker()` → `/math` auto-migrated 8 "back to grade selection" links; only assertions that pin URL/landing identity needed edits (3 lines).
  2. The E2E `goto("/")` calls are overwhelmingly **load-and-clear anchors**, not grade-card interactions — so changing what renders at `/` was low-risk. Verify this distinction before any home-route change.
- **How to add a new subject / grade / exercise kind:** see `docs/NAVIGATION_IA.md` (step-by-step How-to sections).
- **DX improvement added:** `docs/NAVIGATION_IA.md` route map + How-to guides; `routes.test.ts` now guards the IA path mapping from silent drift.

### 2026-06-13 (כיתה ב׳ — שער ברירת הכיתה, לא רק middleware)
- **Trigger:** "כיתה ב׳ should open only after grade A is done, not before." Bug: the כיתה ב׳ card was enterable before passing grade A's final exam.
- **Root cause:** Two-layer gate, only one layer enforced. `middleware.ts` correctly redirects `/grade/b/*` to `/grade/b/locked` without the unlock cookie — but `app/math/page.tsx` rendered the grade B card as an **always-active `<Link>`**. The page already loaded `gradeAFinalPassed` (via `loadFinalExamState("a")`) but used it only to decorate grade A's badge, never to gate grade B. Net: the card *looked* open and bounced the child through a redirect.
- **What changed / where:**
  - `app/math/page.tsx` — `gradeBLocked = !gradeAFinalPassed && !previewAll`; when locked, render an **inert** card (`<div>`, not `<Link>`, `opacity-60`, 🔒 warning chip, locked hint, **no** `gradeCardCta`); active `<Link>` only when unlocked. `previewAll` bypasses (QA).
  - `tests/e2e/subject-picker.spec.ts` — locked-before (inert, no CTA, click stays on `/math`), `?previewAll=1` unlock, and full valid passed-state unlock.
  - `docs/NAVIGATION_IA.md` — "How to add a grade" now states the picker-card gating rule.
- **What we learned:**
  1. `loadFinalExamState` **rejects** any state whose `selectedExerciseIds.length !== FINAL_EXAM_QUESTION_COUNT` (30) — seeding a bare `{passed:true}` returns `null`. E2E must seed a full valid state or use `previewAll`.
  2. Picker reads localStorage (`passed`); middleware reads the cookie. Admin-forced cookie-unlock without a passed exam leaves the card locked — accepted edge (the picker reflects the learner's own result).
- **How to reuse next time:** When a route is gated in `middleware.ts`, also gate its **entry card** in the picker on the same unlock signal — a passing E2E redirect can still leave a misleadingly-open card. Make the locked card inert (no CTA), not a `<Link>` to a redirect.

### 2026-06-13 (English Phase 2: match_pairs, final exam, full curriculum, sync v2)
- **Trigger:** Complete the English layer — all deferred Phase 2 items.
- **What changed / where:**
  - **2.1 match_pairs kind:** `curriculum.ts` (kind+interface), `exercise.ts` (`isMatchPairsCorrect` via early-return on raw JSON), `progress/engine.ts`, `exercise-factories.ts` (`matchPairs`), `components/exercises/MatchPairs.tsx`, renderer wiring, testIds, unit + E2E.
  - **2.2 English final exam:** `lib/english/final-exam/{config,types,picker,grading,storage}.ts` (adaptive count, key `kids_math.english.final_exam.v1`), `components/screens/english/EnglishFinalExamScreen.tsx`, `app/english/exam/page.tsx`, exam card on English home (unlock when all days complete; previewAll bypass), unit + E2E.
  - **2.3 curriculum:** English days 2–7 (`lib/content/english/day-0{2..7}.ts`) — numbers, family, animals, food, body, classroom; `english-content-validity.test.ts` (29 checks).
  - **2.4 sync v2:** `UserProgressBundle` bumped to `bundleVersion: 1|2` with optional `english`; `buildBundleFromLocalStorage`/`hydrateLocalStorageFromBundle` include English; `/api/user/progress` accepts v1 **and** v2; round-trip + backward-compat unit test.
- **What we learned:**
  1. **match_pairs needs the raw answer, not the normalized one** — `normalizeAnswerValue` strips JSON punctuation. Handle it via an early `if (exercise.kind === "match_pairs")` return *before* normalization (which also keeps the other switches' `never` exhaustiveness intact).
  2. **Sync bundle versioning:** make new subject data an **optional** field + accept both versions on the server. Old v1 payloads hydrate (skip english); v2 degrades gracefully. The `snapshot/restore` path already covers `kids_math.*` keys generically — only the structured bundle needed changes.
  3. **`next build` is fragile under concurrent activity** — a running `next dev` (or another agent) writing `.next` mid-build yields misleading `PageNotFoundError`/`ENOENT` (`_document`, `_not-found`, `*.nft.json`). These are environment races, not code errors; confirm via an isolated `rm -rf .next && npm run build` with no other Next process running.
- **How to add an exam for a new subject:** mirror `lib/english/final-exam/*` — config (target/min/pass), picker (seeded shuffle over `buildXExamBank()`, cap at bank size), grading (`gradeXFinalExam` → scorePercent/passed/canFinish), storage (`kids_math.<subject>.final_exam.v1`), a screen using `ExerciseItem` with `showCheckButton=false` + bulk grade on finish, a `/…/exam` page, an unlock-gated card on the subject home, then add its key to the sync bundle.
- **DX improvement added:** `english-content-validity.test.ts` (guards every authored day: ids, counts, answer-in-options, self-grading) — copy it per subject. `NAVIGATION_IA.md` "How to add an exercise kind / subject" extended.

### 2026-06-27 (Spiral review: personalized warm-up from first-attempt-wrong, cross-device)
- **Trigger:** Weave personalized review into each day's warm-up section ("חִימּוּם וַחֲזָרַת סְפִּירָלָה") that resurfaces a learner's own past mistakes and syncs across devices.
- **What changed / where:**
  - `lib/review/{types,engine,select,storage}.ts` (new domain) — pure `selectReviewItems`, Leitner `recordReview`/`isDue`, per-track store `kids_math.review.v1.grade.${grade}` + `kids_math.english.review.v1` (copied from `badges/storage.ts`).
  - `lib/hooks/useSpiralReview.ts` + `components/review/SpiralReviewBlock.tsx` — ephemeral block at top of warmup (`SectionScreen.tsx`, guarded `sectionIdx === 0`); grades locally, never `useDayAnswers.setAnswer`.
  - Sync bundle **v3**: `review` nested in `GradeProgressData`/`EnglishProgressData` (`lib/user-data/{types,api}.ts`), server accepts v1/2/3 (`app/api/user/progress/route.ts`).
  - Tests: `tests/unit/lib/review/*` (38), `tests/unit/lib/user-data/reviewSync.test.ts`, `tests/e2e/spiral-review.spec.ts`.
- **What we learned:**
  1. **The review signal must be first-attempt-wrong from `attempts[]`, not `correctAnswers===false`.** Retry-until-correct makes `correctAnswers` near-always `true`, so the pre-existing `getWeakExercises` (`lib/utils/adaptiveSuggestions.ts`) yields a near-empty deck. `attempts[]` preserves the immutable first-try miss; a Leitner overlay handles retirement since the historical signal never changes.
  2. **Personalization can't live in the content engine.** `buildSpiralWarmupExercises`/`day-builder` are pure + server-side (no `localStorage`); the per-learner block must be injected client-side at render and kept OUT of `allExercisesCount`/`percentDone` (ephemeral, separate local grade callback) to preserve the day-total invariant.
  3. **Comparator pitfall:** ranking by `effectiveDueMs(a) - effectiveDueMs(b)` returns `NaN` when both are `-Infinity` (never-reviewed — the common case), silently killing tiebreaks. Compare the values (`if (aDue !== bDue)`) instead of their delta so equal infinities fall through. (Caught by the unit-test agent.)
  4. **Per-learner stores ride the per-grade bundle block** (like badges/finalExam/gmat), not a top-level optional — additive + backward-compatible; bump `bundleVersion` and accept old versions on the server.
- **How to reuse next time:** New per-learner derived feature → mine `attempts[]` (not `correctAnswers`), add a sibling `lib/<domain>/storage.ts` (copy `badges/storage.ts`), inject client-side without touching progress accounting, and nest its state in `GradeProgressData`/`EnglishProgressData` with a `bundleVersion` bump.
- **Caveat:** E2E (`spiral-review.spec.ts`) compiles/typechecks/discovers but couldn't execute in-sandbox — Playwright browser-revision mismatch (sandbox `chromium-1194` vs project Playwright `-1208`). Run in a browser-enabled env.

### 2026-06-27 (Full-system regression plan + tests, monkey testing, RTL 404 fixes)
- **Trigger:** Build a full regression test plan (manual + automated) and run free-style monkey/fuzz testing to find bugs, then fix them.
- **What was added / where:**
  - `docs/REGRESSION_TEST_PLAN.md` — 174 cases (95 +, 79 −) across all 19 feature areas, with a coverage matrix and a traceability appendix mapping existing specs → plan IDs.
  - `docs/REGRESSION_FINDINGS.md` — findings from a seeded monkey/fuzz + live-browser exploratory session (run ad-hoc; not committed as a spec).
  - Unit: `tests/unit/lib/streak/engine.test.ts`, `tests/unit/lib/badges/engine.test.ts` (the two engines had **no** unit coverage).
  - E2E: `tests/e2e/grade-b-gate.spec.ts`, `exercise-negative.spec.ts`, `visual-smoke.spec.ts`.
  - `.mcp.json` — registered the Playwright MCP server (`@playwright/mcp`, headless chromium). Kept portable: no machine-specific `--executable-path`/`PLAYWRIGHT_BROWSERS_PATH` (those are sandbox-only) so it works on any clone.
- **Bugs found by monkey testing & fixed:**
  1. **No custom 404** — `notFound()` fell back to Next's English/LTR default 404. Added `app/not-found.tsx` (RTL Hebrew, reuses `CenteredPanel`/`ButtonLink`) + `screen.notFound` test id.
  2. **`StorageErrorBoundary` swallowed `notFound()`** — a class error boundary's `getDerivedStateFromError` caught Next's `NEXT_NOT_FOUND`/`NEXT_REDIRECT` control-flow errors, so bad day/section URLs under a valid grade showed "error loading progress" instead of a 404. Fix: re-throw errors whose `digest` is `NEXT_NOT_FOUND` or starts with `NEXT_REDIRECT`.
- **What we learned:**
  1. **Custom error boundaries must re-throw Next control-flow errors.** Any `Component` error boundary wrapping route children has to let `notFound()`/`redirect()` (identified by `error.digest`) bubble, or it silently breaks those APIs for everything beneath it.
  2. **Dev-mode not-found rendering is misleading.** `next dev` serves `notFound()` through an `<html id="__next_error__">` shell with no `dir`/CSS over the no-JS HTML (content hydrates client-side). Verify 404/redirect behavior against a **production build** and/or a real browser (`document.documentElement.dir`), not `curl` against dev.
  3. **Monkey noise vs signal:** `Failed to fetch RSC payload` console errors are **dev-only** prefetch artifacts (gone under `npm run build && start`); `401 /api/auth/me` is expected when logged out. Filter these before triaging.
  4. **Robustness confirmed:** corrupt `localStorage`, adversarial numeric input, and the grade-B gate all held with no crashes.
- **How to reuse next time:** run a seeded monkey/fuzz pass (ad-hoc) against a **prod** server; treat `StorageErrorBoundary` as an acceptable graceful state; verify any `notFound()`/`redirect()` change in a real browser, never dev-curl. (Randomized fuzz is kept out of the committed/CI suite to avoid flakiness; the deterministic specs lock in what it found.)

### 2026-06-28 (Parent Dashboard: read-only cross-subject view behind the admin gate)
- **Trigger:** A read-only parent-facing dashboard aggregating all six tracks (Math/English/Science × a/b) — snapshot, weak skills, review backlog, encourage — derived only from data already in `localStorage`. Built in ULTRA from a design proposal (`/admin` two-card hub → `/admin/parent-dashboard`).
- **What changed / where:**
  - `lib/parent/metrics.ts` (new) — pure derive layer (no IO): first-attempt accuracy, days/sections, idle-clamped time-on-task, weak-skill ranking, Leitner review buckets, exam results. `lib/parent/skillLabels.ts` (new) — static `SkillTag`→Hebrew map.
  - `components/screens/AdminHubScreen.tsx` + `app/admin/page.tsx` (new) — PIN-gated two-card hub reusing `lib/admin/session.ts`. `ParentDashboardScreen.tsx` + `app/admin/parent-dashboard/page.tsx` (new) — read-only view; redirects to the hub when `!isAdminUnlocked()`.
  - `lib/routes.ts` (+`adminHub`/`parentDashboard`), `lib/testIds.ts` (+namespaces), admin CTAs in `app/page.tsx` + `app/math/page.tsx` repointed to the hub.
  - Tests: `tests/unit/lib/parent/metrics.test.ts` (19), `tests/e2e/parent-dashboard.spec.ts` (4, incl. a read-only byte-identical-localStorage proof).
- **What we learned:**
  1. **Accuracy must derive from `attempts[]` first-try, never `correctAnswers`** — retry-until-correct inflates `correctAnswers` to ~100%. Same lesson as spiral-review; the unit suite pins it with an explicit inflation-guard fixture.
  2. **English/Science persist BOTH levels in one progress store.** A track is identified by its *day-set* (level a vs b), not a store. Every attempt-reading metric must scope to `track.days` (`progress.days[day.id]`), or shared-store subjects **double-count**. Caught in self-review before fan-out.
  3. **Read-only is enforceable by test:** an E2E that asserts `JSON.stringify(localStorage)` is byte-identical before/after a visit guards the contract. Pre-seed cookie-consent so the banner doesn't write during measurement; avoid seeding legacy keys that trigger migration writes in `load*`.
  4. **The admin hub clears its session on `pagehide`** — so navigating hub→dashboard needs the session re-seeded from a neutral page in tests, not while still on the hub.
- **Screenshot-baseline flake — fixed properly (not masked):** `edge-and-a11y.spec.ts` "boxed math tokens" used `toHaveScreenshot("math-token-row.png")` and hard-failed on a **4px width drift** (`620px`→`616px`) from Rubik font metrics across Chromium/OS environments — `maxDiffPixelRatio` can't absorb a *dimension* mismatch. Replaced the pixel snapshot with **font-metric-independent layout assertions** (every token a visible non-zero box; single-row via container-height < 1.8× token height; LTR x-ordering) and deleted the orphaned baseline PNG. Test now runs on all platforms, not just darwin.
- **How to reuse next time:** new read-only derived view → put pure derive funcs in `lib/<domain>/metrics.ts` (data in as params, view-models out), scope per-track reads by day-set, and lock the no-write contract with a localStorage-identity E2E. For visual coverage, prefer structural/layout assertions over `toHaveScreenshot` unless a stable single-environment baseline is guaranteed.

### 2026-07-01 (Misconception-aware feedback: heuristic + authored, at the feedback chokepoint)
- **Trigger:** Turn generic "try again" into specific, fix-focused Hebrew feedback keyed to the child's actual mistake (e.g. answered 8−3 with 11 → "you added instead of subtracting").
- **What changed / where:**
  - `lib/utils/misconceptions.ts` (new) — pure `detectMisconception` (binary `a op b` only; reuses `resolvePromptParts`/`tokenizeMathExpression` from `mathText.ts`, mirrors `validate.ts`'s "skip rather than false-flag" discipline) + `matchAuthoredMisconception`.
  - `lib/utils/exercise.ts` — wired both into `getRetryFeedbackText` after the empty-answer check, before near-miss (authored ▸ heuristic ▸ near-miss ▸ generic). Single chokepoint → also lights up the spiral-review block.
  - `lib/types/curriculum.ts` — additive optional `misconceptions?: MisconceptionRule[]` on `BaseExercise`; `exercise-factories.ts` threads an optional trailing param; `content-validity.test.ts` guards authored entries (`match !== correct answer`, non-empty feedback).
  - Tests: `misconceptions.test.ts` (23), content-validity guards, `exercise.test.ts` precedence.
- **What we learned:**
  1. **`meta.misconceptionTarget` was vestigial** — declared, accepted by `meta()`, but never populated by any factory/content and unmapped to a specific wrong answer. Don't "just read it": deliver via a conservative code heuristic (zero authoring) + opt-in authored overrides.
  2. **Precedence collision caught by the full suite:** `2+3` answered `6` is BOTH a ±1 near-miss AND exactly `2×3`; the specific misconception must outrank near-miss. Fixed honestly — re-pointed the near-miss test to a non-colliding value and added a precedence test, rather than reordering to hide it.
  3. **Safe function-level import cycle** `exercise.ts ↔ misconceptions.ts` (all cross-refs at call-time).
- **How to reuse:** answer-specific feedback belongs at the `getRetryFeedbackText` chokepoint; keep detectors pure + exact-match-only (reuse `mathText`), and always run the full unit suite — precedence collisions only surface against existing feedback tests.

### 2026-07-06 (Science curriculum expansion: 9 topics → 11 new lessons, both levels)
- **Trigger:** Expand the Hebrew Science subject to the full 9-topic scope (עולם החי/הצומח, גוף האדם, כדור הארץ, חומרים, כוחות, טכנולוגיה, גיאוגרפיה, שימור הסביבה) × 3 difficulty bands, closed-answer only ("never give open questions").
- **What changed / where:**
  - `lib/content/science/day-06..10.ts` (Level א׳, 🟢🟡) + `day-12..17.ts` (Level ב׳, 🟡🔴) — 11 new day modules, ~15 exercises each. Wired append-only into `lib/content/science/index.ts` (א׳ = days 1–10, ב׳ = days 11–17; IDs contiguous & disjoint per level → zero learner-progress orphaning).
  - `lib/science/levels.ts` — enriched `scienceLevelSubtitle` to reflect the fuller topic list.
  - `tests/unit/lib/science/content.test.ts` — added a per-level day-count + ID-order assertion (א׳=10, ב׳=7) that locks the arrays the parent dashboard/admin progress read via `getScienceDays(level)`.
  - Authored via **6 fan-out subagents** (each mimicking `day-11.ts`), then a central per-day content/voice audit.
- **What we learned:**
  1. **The 100%-Hebrew content test IS the "no open questions" guarantee** — it hard-blocks any kind except `multiple_choice`/`true_false`/`match_pairs` and any Latin letter. So the product rule "never open questions" is a compile/test-time invariant here, not a review-time hope. The one spec item that *was* an open question (topic 9 "what can you do?") was converted to MC.
  2. **Parent control needs ZERO screen edits** — both `ParentDashboardScreen` and `AdminProgressScreen` source days via `getScienceDays(level)`, and metrics scope per-track by `track.days`, so appended days auto-flow into completion %, accuracy, time-on-task, and exam status. Locked with a day-count unit assertion.
  3. **Science weak-skill attribution is a known gap** — science exercises use `skillTags: []` (the `SkillTag` union is math-only), so science never ranks in the parent weak-skills panel. Descoped deliberately; adding it means extending the shared `SkillTag` union (cross-cutting, own MAX).
  4. **Fan-out authoring works when each agent gets: the invariant list, a reference file to mimic (`day-11.ts`), factory signatures, and specific correct facts + distractor guidance.** Central audit still caught one conceptually-wrong framing (day-10: "what keeps order in the country? → flag & emblem"), reframed to "what are Israel's symbols?". Lesson: subagent self-checks catch invariants (kinds/Latin/niqqud/answer∈options) reliably but NOT pedagogical framing — the human/central audit is where "answers can't be stupid" is actually enforced.
- **How to reuse:** to grow a subject, append day modules into the level arrays (never renumber existing IDs), rely on the content test for the Hebrew/closed-answer invariants, and add a per-level count assertion so a miswired index.ts is caught. Fan out authoring but always do a central factual/framing audit before merge.

### 2026-07-10 (Invert navigation to Grade → Subject → Day + subject-based grade unlock) — MAX
- **Trigger:** Users found Subject → Grade → Day confusing. Flip the top two levels to **Grade → Subject → Day**; gate the next grade per-subject (finish a subject in Grade A → that subject unlocks in Grade B; Grade B opens once *any* subject is done in A).
- **What changed / where:**
  - **Single completion truth** `lib/completion/subjectGrade.ts` (`isSubjectGradeComplete`/`isSubjectUnlockedInGrade`/`isGradeUnlocked`); `english/levels.ts` + `science/levels.ts` now delegate to it. `lib/subjects.ts` gained a `SUBJECTS` array.
  - **Server gate** `middleware.ts` extended to `/grade/b`, `/english/b`, `/science/b`, `/subjects/b`; per-subject cookies `kids_math.unlocked.b.<subject>` (+ legacy math alias), set via subject-aware `/api/grade-b-unlock|lock` (old `/api/unlock|lock-grade-b` kept as math shims). Unlock fired on exam pass (`FinalExamScreen`, shared `SubjectFinalExamScreen`), revoked on admin reset (generalized `resetDayProgress` for english/science).
  - **Screens** `/` = `GradePickerScreen`, new `/subjects/[grade]` = `SubjectPickerScreen`; `/math`,`/english`,`/science` → redirects; shared `LockedGradeScreen` for 4 locked pages; ~8 back-links repointed to `subjectsForGrade(grade)`.
  - **Admin** grade-first selectors + per-subject unlock/revoke. **Parent dashboard** per-grade rollup (`deriveDaysAndSectionsByGrade`) + grade-first exam ordering. **Analytics** `subject?`/`gradeId?` + `subject_selected`.
- **What we learned:**
  1. **httpOnly cookies can't be read client-side, so reconcile must be POST-only + idempotent.** `reconcileGradeUnlockCookies()` self-heals a *lost* cookie by re-POSTing unlock for completed subjects (sessionStorage-guarded), but is **unlock-only**: never auto-revokes. Auto-lock on a live strict check would strip Grade-B access from existing users whenever curriculum grows (a subject that was "done" reads incomplete until the new Grade-A lessons are done — and Science *just* expanded). Revocation is admin-reset-only.
  2. **"Strict completion (all days AND exam)" is a product decision with a data-safety edge** — chose strict for the live gate but decoupled it from cookie revocation (point 1) so the deploy never resets earned access. The unlock cookie persists; the client card may re-lock cosmetically after content growth, but the server never revokes.
  3. **Back-compat is cheap and worth it:** keeping the legacy cookie name + old API routes as thin shims means cached tabs and returning math-B users keep working with zero migration. No `localStorage` key / day ID / content changed → all learner data loads unchanged.
  4. **Reuse fell out of existing testId namespaces** — `gradePicker.*` (was at `/math`) moved to `/`, `subjectPicker.*` (was at `/`) moved to `/subjects/[grade]`; only `lockedHint`/`gradeLockedHint`/`lockedGrade.*` were new.
- **How to reuse:** for cross-grade gating put the completion truth in ONE edge-*unsafe* client module and have all gates delegate; keep `middleware.ts` importing only edge-safe cookie-name/preview helpers; when a server gate is cookie-backed, add a POST-only reconcile that heals lost-cookie but never revokes (curriculum grows). See [`NAVIGATION_IA.md`](NAVIGATION_IA.md).

### 2026-07-15 (Phase 1: revocable sessions + account lockout + zod + kids-gaming login UX) — MAX
- **Trigger:** Roadmap Phase 1 (S4/S7/S8/S12) — make sessions revocable and the auth surface robust, plus a kids-gaming PM UX pass on login.
- **What changed / where:** `lib/auth/{jwt.server,session.server,types,api,context}.ts`, `app/api/auth/{login,me,logout-all}`, `app/api/admin/users`, `app/api/user/progress`, `lib/security/{schemas,passwordPolicy,accountLockout}.ts`, `lib/server/gradeUnlockCookies.ts`, `components/auth/{LoginModal,UserAvatar}.tsx`, `components/screens/AdminUsersScreen.tsx`, plus unit/component/e2e tests.
- **What we learned:**
  1. **Additive `tokenVersion` = absent ⇒ 0 on BOTH sides** (token claim + user doc). A live 30-day token (no claim = 0) still matches an untouched user (no field = 0), so revocation ships with zero backfill and no lockout of existing sessions. `verifyToken` stays pure-JWT; `verifySession({requireVersionCheck})` does the one Firestore read, used on data/admin routes + `/me`.
  2. **`FakeFirestore.update` is a shallow spread → it can't honor `FieldValue.increment`.** Bump `tokenVersion` inside a `runTransaction` (read→+1→set) so the increment stays testable on the existing fake (and correct under concurrent resets).
  3. **Progress bundle must be validated ENVELOPE-ONLY** (`bundleVersion ∈ {1..4}` + passthrough). A deep zod schema over `UserProgressBundle` would risk rejecting years of accumulated learner data — the merge layer stays the tolerant reader.
  4. **Lockout that counts UNKNOWN usernames too, with a uniform 429, preserves the S2 anti-enumeration win** — a fast "locked" path reveals lock state, not account existence. Keep it fail-OPEN (Firestore error ⇒ not locked) so a store outage never locks the whole app out.
  5. **S7 grade-unlock routes must stay unauthenticated:** `lib/completion/reconcile.ts` POSTs `/api/grade-b-unlock` for anonymous learners, so a session requirement breaks the anonymous Grade-A→B heal. Hardened input (zod) but kept them open; documented in the file.
  6. **Kids-gaming login UX halves the new lockout's blast radius:** a show-password toggle cuts the mistyped-password failures that feed lockout; a non-punitive, TTS-voiced countdown (not a red alert) + "one more try" nudge keep a 6-year-old from feeling punished. "Log out everywhere" is an adult concept → admin-only, hidden from a child's avatar menu.
- **How to reuse:** for any revocable-credential change, make the version additive (absent⇒0) and enforce it only where it protects data (not on cheap identity reads unless you want clean logout, which we chose for `/me`); when adding an enforcing limiter, fail-open + count unknowns for anti-enumeration; validate large persisted payloads at the envelope only. Deferred UX: avatar+PIN login (UX1) + playful avatars (UX2) in the roadmap backlog.

### 2026-07-17 (CI: skip build/unit/e2e on docs & .claude-only diffs) — ULTRA
- **Trigger:** Full test suite (lint + unit + build + 3 e2e shards) ran on every push/PR, including doc-only and agent-config changes that no test can validate.
- **What changed / where:** `.github/workflows/ci.yml` gained a `changes` job that computes `docs_only` via the **GitHub API + a regex** (not a glob-filter action); it gates `lint-and-unit` and `e2e` with `if: needs.changes.outputs.docs_only == 'false'`. Non-code = `*.md` anywhere, `docs/`, `roadmap/`, `.claude/**`, top-level `LICENSE`. `security-scan` deliberately left ungated. Documented in `AGENTS.md` Quality Gates. PR #85; skip-path proven on docs-only demo PR #86.
- **What we learned:**
  1. **"Docs-only" is an `every-file` predicate, and `dorny/paths-filter` can't express it — don't force it.** dorny answers "did **any** changed file match this filter?"; the two knobs both fooled me: `['**','!**/*.md']` is **always true** (dorny OR's patterns per file, so the bare `**` matches everything and the `!` lines subtract nothing — CI logged `Filter code = true` for a docs-only diff), and `predicate-quantifier: every` means "a file must match **every** pattern (AND)", i.e. one file under `docs/` AND `roadmap/` AND `LICENSE` simultaneously — impossible, so it was **always false** (`Matching files: none`). Both failed SAFE (over-ran the suite; never wrongly skipped). The working fix is an explicit `gh api …/files` (PR) or `…/compare` (push) list piped through `grep -vE '(\.md$|^docs/|^roadmap/|^\.claude/|^LICENSE$)'`: docs_only=true iff there are files and none are non-doc. Any unrecognized/new path is treated as code → runs → fails safe.
  2. **Verify path-filtering on a real CI run, not with local picomatch.** My local `picomatch([...])` test passed the whole array to one matcher (which honors `!` negation) — a wrong model of dorny's per-pattern OR. It "passed 15/15" while the real action did the opposite. Only the CI job log (`Filter … = true/false`, `Matching files`) told the truth.
  3. **On a `pull_request` event, the diff is the WHOLE PR vs its base, not the latest commit.** So a docs-only follow-up commit can't demonstrate the skip on a PR that already contains a code change (its cumulative diff still has code). Proving the skip needs a PR whose *entire* diff is non-code — demo PR #86 was based off the #85 branch so its only diff is one Markdown file. The `.claude/` exclusion covers rules/docs/commands/plans/settings.json/launch.json — confirmed nothing CI runs reads `.claude/` (not in tsconfig/next.config, not imported; only a console.log string + a Markdown link reference it).
  4. **The secret scan must stay unconditional AND inside the CI workflow.** No `needs`/`if`, so it runs even on docs-only diffs (a credential can't slip in through Markdown). Keeping it in `ci.yml` (not a separate workflow) is also what lets it keep gating `deploy.yml` via `workflow_run` — splitting it out would silently drop the deploy-time secret gate.
  5. **Trade-off accepted:** docs/`.claude`-only pushes to `main` still trigger `deploy.yml` (CI succeeds → `workflow_run`), redeploying byte-identical output. Cheap and safe; not worth a deploy-side code guard. `main` is unprotected, so skipped jobs don't wedge a required check.
- **How to reuse:** for "run unless the diff is entirely <class>", prefer an explicit `gh api` file list + `grep` over a glob-filter action — the logic is auditable and you control the fail-safe direction (unrecognized path ⇒ treat as code ⇒ run). Positively identify the *skippable* class (docs), never the code class (a new top-level code dir must not silently skip). Gate expensive jobs on the computed flag, keep always-must-run jobs (secret scan) ungated, and **prove it on a clean single-class PR** before trusting it.

### 2026-07-18 (Dependency batch: 6 bumps merged, Tailwind 4 deferred) — PRO
- **Trigger:** Seven open Dependabot PRs (#90–#96). Five green, two red majors (vitest 2→4, tailwindcss 3→4).
- **What changed / where:** Merged #90 (setup-node 6→7), #91 (setup-gcloud 2→3), #92 (firebase-admin 14.0→14.2), #94 (postcss 8.5.8→8.5.19), #96 (jsdom 25→29) as-is. #95 (vitest 4) needed three companion fixes in `package.json` + `vitest.config.ts`. #93 (Tailwind 4) deferred with a migration diagnosis on the PR.
- **What we learned:**
  1. **A "bump one version line" PR can be unmergeable for reasons Dependabot structurally cannot see.** `vitest` and `@vitest/coverage-v8` are version-locked by an exact peer range, so bumping only `vitest` failed `npm ci` with `ERESOLVE` before a single job ran — every check was red for an install error, not a test failure. When a dep PR shows *all* checks failing in seconds, read the install step first; it's usually a peer-lock sibling that must move in the same commit.
  2. **Vitest 4 ships Vite 8, which transforms with oxc instead of esbuild — so `esbuild: { jsx: "automatic" }` became a silently-ignored config key.** 80 of 172 test files died with `Unexpected JSX expression`. The fix is `oxc: { jsx: { runtime: "automatic" } }`. The dangerous shape here is that the old key is not an error — it's inert. After any major bump of a build tool, grep your config for keys named after the *previous* engine.
  3. **`@vitest/coverage-v8` v4 made AST-aware remapping unconditional and removed the opt-out, which moves measured coverage ~16pts without a line of source changing** (91.26%→75.47% statements, 85.26%→74.45% branches on an identical tree). Do not accept or reject that at face value: the only way to tell a methodology shift from a real regression is to **run both providers against the same commit**, which is a ~5-minute `git worktree` + `npm ci` on `main`. Doing that turned "someone deleted a lot of tests" into "the ruler changed" — and produced the numbers that justify the re-baseline in the PR record.
  4. **The stricter measurement is a feature, not just an obstacle.** `lib/exam/**` and `lib/gradeUnlock.ts` still hold at **100%** under v4 — the MAX-area gates were never inflated. The drops concentrate in `lib/badges` (77% stmts) and `lib/gmat-challenge` (73% stmts / 57% branches), i.e. v2 had been crediting non-executable lines and masking genuinely thin tests there. Re-baselining unblocks CI; **closing those two gaps is real follow-up work**, not bookkeeping.
  5. **Re-baselining a ratchet is a quality-gate change and needs explicit human sign-off + an in-file paper trail.** `vitest.config.ts` now carries the v2-vs-v4 before/after and the reason, so a future reader cannot mistake the lower numbers for someone quietly weakening the gate to get a build green. Every threshold was re-derived from measured v4 values (pinned 1–2pts under), not rounded down to whatever passed.
  6. **Long-running dep work races the branch it targets.** Mid-task, #97 merged to `main` *and* Dependabot force-rebased its own branch, so the first `git push --force-with-lease` was correctly rejected as stale. Rebase onto the **remote dependabot tip** (`--onto origin/<dependabot-branch>`), then re-run `npm ci` + the gates before re-pushing — the lockfile is a merge-conflict magnet and a stale one passes locally while failing CI.
  7. **Tailwind 3→4 is not a dependency bump, it's a migration.** The PostCSS plugin moved to `@tailwindcss/postcss`, the JS config gives way to CSS-first `@theme`, and utilities were renamed/removed — which for this Hebrew-RTL app means re-verifying logical-property utilities and the whole shared card/button/input library plus a visual pass. Correctly scoped out of the batch and left open as the tracking PR.
- **How to reuse:** triage dep PRs by *where* CI dies — install-step failures mean a peer-locked sibling (fix in-PR); build/transform failures after a major bump mean a config key named after the old engine; threshold failures mean measure both sides before touching a number. Never lower a gate without (a) proving the underlying code didn't regress and (b) getting sign-off with the evidence recorded in the file itself.
