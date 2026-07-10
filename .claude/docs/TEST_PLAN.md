# TEST_PLAN.md — Comprehensive Test Strategy (kids_math)

> Single-source map of **what the app does** → **how each behavior is verified**, across
> every layer (unit / component / API / E2E) and every axis (positive / negative / edge /
> localization / session). Use this to spot regressions before they ship and to decide
> where a new change needs new coverage.
>
> Companion to `AGENTS.md` → [Testing Strategy] and the Mandatory Test Targeting table.
> This document describes the *strategy and coverage map*; `AGENTS.md` remains authoritative
> for the *workflow* (which gates run in which mode).

---

## How to use this document

1. **Before changing a feature** — find its row in the [Feature → Coverage Matrix](#feature--coverage-matrix).
   Run the listed specs/tests locally (fast gates) and let CI run the full E2E set.
2. **When adding a feature** — add a row here, then add coverage at the lowest layer that
   can prove correctness (prefer unit > component > API > E2E; E2E only for real user flows).
3. **When a regression escapes** — add the missing case to the matrix and to the suite in the
   same PR; note it under [Gap Log](#gap-log) so the hole is visible until closed.
4. **Localization / RTL / session** rows are first-class, not afterthoughts — see the
   [Cross-cutting axes](#cross-cutting-axes) section.

### Test layers at a glance

| Layer | Tool | Location | Runs in CI | Flake risk | Use for |
|-------|------|----------|-----------|-----------|---------|
| Unit | Vitest (jsdom) | `tests/unit/lib/**` | ✅ | very low | pure logic: engines, storage, merge, grading, pickers, utils |
| Component | Vitest + Testing Library | `tests/unit/components/**` | ✅ | low | render + interaction of a single component/screen in isolation |
| API (handler) | Vitest + mocked Firestore/JWT | `tests/unit/app/api/**` | ✅ | very low | route handlers: status codes, auth gating, cookie flags, validation |
| E2E | Playwright (Chromium) | `tests/e2e/**` | ✅ | medium | real multi-screen user journeys, gates, persistence across reload |

> **Local vs CI policy** (see `feedback_prefer_ci_for_tests`): run fast gates locally
> (`lint`, `check:testids`, `test:unit`); run the full `test:qa` (build + E2E) **on the PR's CI**,
> not locally — it is faster and cheaper there and avoids dev-server `.next` clobbering.

---

## Feature → Coverage Matrix

Legend: ✅ covered · ⚠️ partial · ❌ gap (see [Gap Log](#gap-log)). "Layer" columns list the
authoritative spec/test file(s).

### 1. Authentication & Session

| Behavior | Unit / API | Component | E2E | Neg / Edge covered |
|----------|-----------|-----------|-----|--------------------|
| Login handler (valid creds → 200 + session cookie) | `app/api/authLogin.test.ts` ✅ | `auth/LoginModal.test.tsx` | `auth.spec.ts` | bad body→400, wrong creds→401, empty→401, firestore-down→500, secure cookie on https/x-forwarded-proto ✅ |
| `GET /api/auth/me` (token → user; no/invalid token → 401) | `app/api/authSession.test.ts` ✅ | — | `auth.spec.ts` | missing cookie, tampered token, wrong-secret token ✅ |
| `POST /api/auth/logout` (clears session + all Grade-B cookies) | `app/api/authLogout.test.ts` ✅ | `auth/UserAvatar.test.tsx` | `auth.spec.ts` | per-student isolation: resets every subject unlock ✅ |
| JWT sign/verify round-trip & rejection | `app/api/authSession.test.ts` ✅ (via handlers) | — | — | wrong-secret/garbage token → null ✅ |
| Auth context ordering / hydration | `lib/auth/contextOrdering.test.tsx` | — | `auth.spec.ts` | provider order, no flash ✅ |
| Cross-device sync scheduling | `lib/auth/serverSync.test.ts` | — | `admin-progress-sync.spec.ts` | debounce, suspend/resume, no-callback no-op ✅ |
| Storage backward-compat on login | `lib/auth/storageBackwardCompat.test.ts` | — | `auth-backward-compat.spec.ts` | old localStorage shapes still hydrate ✅ |

### 2. Admin (user management + progress view)

| Behavior | Unit / API | Component | E2E | Neg / Edge covered |
|----------|-----------|-----------|-----|--------------------|
| `GET /api/admin/users` (list, strips passwordHash) | `app/api/adminUsers.test.ts` ✅ | `AdminUsersScreen.test.tsx` | `admin-users.spec.ts` | non-admin→403, no token→403, firestore-down→500 ✅ |
| `POST` create user (dup→409, bad body→400, role default) | `app/api/adminUsers.test.ts` ✅ | `AdminUsersScreen.test.tsx` | `admin-users.spec.ts` | duplicate username, missing fields, admin vs user role ✅ |
| `PATCH` reset password (404 when missing) | `app/api/adminUsers.test.ts` ✅ | — | `admin-users.spec.ts` | user-not-found, bad body ✅ |
| `DELETE` user (cannot delete self; cascades progress) | `app/api/adminUsers.test.ts` ✅ | — | `admin-users.spec.ts` | self-delete→400, missing progress doc tolerated ✅ |
| Admin progress dashboard render | `AdminProgressScreen.test.tsx` | ✅ | `admin-progress.spec.ts` | empty state, per-user rollup ✅ |
| Admin prefs / forced final exam | `lib/admin/prefs.test.ts`, `lib/admin/forcedFinalExam.test.ts`, `lib/admin/resetDayProgress.test.ts` | — | — | reset day progress, forced exam toggle ✅ |

### 3. Progress engine & storage (workbook)

| Behavior | Unit | Component | E2E | Neg / Edge |
|----------|------|-----------|-----|-----------|
| Progress compute (`percentDone`, section/day complete) | `lib/progress/engine.test.ts` | `ProgressBar.test.tsx`, `ProgressHeader.test.tsx` | `grade-a-lifecycle.spec.ts` | full-day count contract, partial sections ✅ |
| Progress storage (versioned, fail-safe parse) | `lib/progress/storage.test.ts`, `lib/progress/updatedAt.test.ts` | — | `all-days-completion.spec.ts` | corrupt payload → defaults, updatedAt LWW ✅ |
| Reconcile / completion rollup | `lib/completion/reconcile.test.ts`, `lib/completion/subjectGrade.test.ts` | — | — | partial vs full completion ✅ |
| Merge across devices | `lib/user-data/merge.test.ts` | — | `admin-progress-sync.spec.ts` | per-day/per-domain merge, future-clock clamp ✅ |
| Progress sync API push/pull | `app/api/userProgress.test.ts` ✅ | — | `admin-progress-sync.spec.ts` | bundleVersion 1–4 accept, junk→400, no-token→401, txn merge, future-ts clamp, firestore-down→500 ✅ |

### 4. Navigation, routing & unlock gates

| Behavior | Unit | Component | E2E | Neg / Edge |
|----------|------|-----------|-----|-----------|
| Route builders | `lib/routes.test.ts` | — | (all) | query-state preservation ✅ |
| Middleware Grade B gate | `middleware.test.ts` | — | `grade-b-gate.spec.ts`, `grade-b.spec.ts` | cookie present/absent, legacy cookie ✅ |
| Grade B unlock API + cookie | `app/api/gradeBUnlock.test.ts` | — | `grade-b-lifecycle.spec.ts` | per-subject vs legacy lock-step, secure flag ✅ |
| Grade→Subject→Day flow | — | `SubjectPickerScreen.test.tsx`, `GradePickerScreen.test.tsx` | `grade-subject-flow.spec.ts`, `subject-picker.spec.ts` | locked grade, subject-based unlock ✅ |
| Section unlock rules | `lib/utils/sectionNav.test.ts`, `parseSectionId.test.ts` | `SectionScreen.test.tsx`, `DayOverviewScreen.test.tsx` | `day-smoke.spec.ts` | warmup-open, last-section-gated, direct-URL guard ✅ |
| Locked grade screen | — | `LockedGradeScreen.test.tsx` | `grade-b-gate.spec.ts` | gated CTA ✅ |

### 5. Final exam & GMAT challenge

| Behavior | Unit | Component | E2E | Neg / Edge |
|----------|------|-----------|-----|-----------|
| Final exam picker / grading / storage | `lib/final-exam/{picker,grading,storage}.test.ts` | `FinalExamScreen.test.tsx` | `grade-a-lifecycle.spec.ts`, `grade-b-lifecycle.spec.ts` | 10-wrong reset, pass→unlock ✅ |
| Generic exam grading | `lib/exam/gradeExam.test.ts`, `lib/exam-session/reviewPolicy.test.ts` | — | — | boundary scores, review policy ✅ |
| GMAT classifier / picker / grading / storage | `lib/gmat-challenge/*.test.ts` | `GmatChallengeScreen.test.tsx` | `gmat-challenge.spec.ts` | classification edges, storage ✅ |

### 6. Content, exercises & pedagogy

| Behavior | Unit | Component | E2E | Neg / Edge |
|----------|------|-----------|-----|-----------|
| Exercise arithmetic validity | `lib/content/content-validity.test.ts` | — | `day-smoke.spec.ts` | `=?` mismatch, true/false contradiction ✅ |
| Day builders & concepts | `lib/content/day-concepts.test.ts`, `day-10-place-value.test.ts` | `DayScreen.test.tsx` | `all-days-completion.spec.ts` | exercise-count contracts ✅ |
| Number-line variety / range | `lib/content/number-line-variety.test.ts`, `engine/number-range.test.ts` | `NumberLine.test.tsx`, `GeneratedNumberLineJump.test.tsx` | — | seeded determinism ✅ |
| Exercise input policy (numbers only) | `lib/utils/exerciseMathPolicy.test.ts`, `choiceOptions.test.ts` | `ExerciseItem.test.tsx`, `ExerciseRenderer.test.tsx` | `exercise-negative.spec.ts` | wrong answer, no free-text ✅ |
| Misconceptions / adaptive suggestions | `lib/utils/misconceptions.test.ts`, `adaptiveSuggestions.test.ts` | `MetacognitionToast.test.tsx` | — | wrong-answer hinting ✅ |
| Spiral review | `lib/review/{engine,select,storage}.test.ts` | `SpiralReviewBlock.test.tsx` | `spiral-review.spec.ts` | selection, storage, sync ✅ |
| Badges & streak | `lib/badges/*.test.ts`, `lib/streak/*.test.ts` | `StreakBadge.test.tsx`, `TrophyUnlock.test.tsx` | `trophy-unlock-bulk.spec.ts` | thresholds, bulk unlock ✅ |

### 7. Subjects: English & Science

| Behavior | Unit | Component | E2E | Neg / Edge |
|----------|------|-----------|-----|-----------|
| English content validity / id stability / storage | `lib/english/*.test.ts`, `content/english-content-validity.test.ts` | `english/EnglishScreens.test.tsx` | `english-day-smoke.spec.ts` | id stability (no orphaned storage) ✅ |
| English final exam + sync | `lib/english/final-exam*.test.ts`, `lib/user-data/englishSync.test.ts` | — | `english-exam-smoke.spec.ts` | exam grading, sync round-trip ✅ |
| Science content / storage / exam | `lib/science/*.test.ts` | `science/ScienceScreens.test.tsx` | `science-day-smoke.spec.ts`, `science-exam-smoke.spec.ts` | storage, exam ✅ |
| Subject-generic screens | — | `subject/SubjectScreens.test.tsx`, `SubjectSectionScreen.test.tsx` | `subject-picker.spec.ts` | shared subject scaffolding ✅ |

### 8. TTS / voice / accessibility / localization

| Behavior | Unit | Component | E2E | Neg / Edge |
|----------|------|-----------|-----|-----------|
| TTS engine + Hebrew normalization | `lib/tts/engine.test.ts`, `audioManifest.test.ts` | `SpeakerButton.test.tsx`, `AudioButton.test.tsx`, `TapToPlayTtsButton.test.tsx` | `tts-accessibility.spec.ts` | symbol→word (`+ = − × ÷ < >`), missing manifest ✅ |
| Spoken content text builders | `lib/content/buildDayPrimerSpeakText.test.ts`, `lib/utils/{exercisePromptSpeakText,workedExampleSpeakText}.test.ts` | `WorkedExampleTtsButton.test.tsx`, `DayTeachingPrimer.test.tsx` | — | step numbering, niqqud ✅ |
| Teaching primer Hebrew lint (forbidden typos) | `lib/content/teaching-primer-content.test.ts` | `TeachingPrimerExpanded*.test.tsx` | — | known-typo regression guards ✅ |
| RTL layout / a11y / focus | — | many `components/ui/*` | `edge-and-a11y.spec.ts`, `visual-smoke.spec.ts` | keyboard nav, focus order, touch targets ✅ |
| Student/Admin TTS toggle + providers | `providers/*TtsProvider.test.tsx`, `StudentTtsToggle.test.tsx` | ✅ | `tts-accessibility.spec.ts` | toggle persistence ✅ |

### 9. Parent dashboard, legal, cookie consent, misc UI

| Behavior | Unit | Component | E2E | Neg / Edge |
|----------|------|-----------|-----|-----------|
| Parent metrics | `lib/parent/metrics.test.ts` | `ParentDashboardScreen.test.tsx` | `parent-dashboard.spec.ts` | empty/edge metrics ✅ |
| Cookie consent | `lib/cookieConsent/storage.test.ts` | `layout/CookieConsentBanner.test.tsx` | — | accept/dismiss persistence ✅ |
| Legal pages | — | `legal/*.test.tsx` | `legal-pages.spec.ts` | link integrity ✅ |
| Analytics events | `lib/analytics/events.test.ts` | — | — | typed payloads, no PII ✅ |
| Shared UI primitives | — | `components/ui/*.test.tsx` (30+) | `visual-smoke.spec.ts` | render, variants, focus ✅ |
| Storage error boundary | — | `ui/StorageErrorBoundary.test.tsx` | — | corrupt storage → safe fallback ✅ |

---

## Cross-cutting axes

Every feature above is additionally evaluated against these five axes. Rows already reflect
them; this section states the *policy* so new work keeps them in scope.

### Positive testing
The happy path for each behavior is covered at the lowest sufficient layer. E2E happy paths
are reserved for genuine multi-screen journeys (`grade-a-lifecycle`, `grade-b-lifecycle`,
day-smoke per subject).

### Negative testing
Every API handler asserts its **error contract**: `400` (bad/absent body), `401`
(unauthenticated), `403` (unauthorized role), `404` (missing entity), `409` (conflict), `500`
(dependency failure). Exercise flows assert wrong-answer handling
(`exercise-negative.spec.ts`). Storage loaders assert corrupt-payload → safe defaults.

### Edge cases
- **Boundaries**: exam pass/fail thresholds, 10-wrong reset, section-unlock boundary
  (warmup / middle / last), exercise-count min/max contracts.
- **Time**: future-clock timestamp clamping (`clampFutureTimestamps`), LWW `updatedAt`.
- **Concurrency**: progress-push transaction serializes concurrent writers.
- **Data shape**: bundleVersion 1→4 forward/backward compat; unknown fields tolerated.

### Localization (Hebrew RTL)
- UI is `dir="rtl"`; `dir="ltr"` only for math inputs — asserted structurally in component
  tests and `edge-and-a11y.spec.ts`.
- Spoken Hebrew correctness: niqqud/spelling regression guards
  (`teachingPrimerHebrewLint`), symbol-to-word voicing (`tts/engine` normalizer), and
  step-label numbering builders.
- **No localized text in `data-testid`** — enforced by `npm run check:testids`.
- No free-text input anywhere (numbers-only policy) — `exerciseMathPolicy`.

### Session / persistence
- Login/logout cookie lifecycle (`authLogin` / `authSession` API tests).
- Progress survives reload and cross-device merge (`merge`, `userProgress` API, sync E2E).
- Backward compatibility: old localStorage shapes still hydrate
  (`storageBackwardCompat`, `auth-backward-compat.spec.ts`).
- Storage keys namespaced `kids_math.<domain>.v<n>` and versioned; loaders fail-safe.

---

## Gap Log

Tracks known holes. Close a row by adding coverage and moving it to the matrix.

| # | Gap | Layer | Severity | Status |
|---|-----|-------|----------|--------|
| G1 | Auth `login` handler had no direct test (only component/E2E) | API | HIGH | ✅ Closed — `app/api/authLogin.test.ts` |
| G2 | `auth/me` handler untested (`auth/logout` already covered by `authLogout.test.ts`) | API | MEDIUM | ✅ Closed — `app/api/authSession.test.ts` |
| G3 | `user/progress` GET/POST handler (auth gating, bundle validation, txn merge, 500 path) untested | API | HIGH | ✅ Closed — `app/api/userProgress.test.ts` |
| G4 | `admin/users` full CRUD (403 gating, 409 dup, 404, self-delete guard, cascade) untested at handler level | API | HIGH | ✅ Closed — `app/api/adminUsers.test.ts` |
| G5 | No load/perf testing (out of scope for a client-first localStorage app) | — | LOW | Deferred — documented, not planned |
| G6 | Visual regression is smoke-only (no pixel baselines) | E2E | LOW | Accepted — `visual-smoke.spec.ts` covers layout breaks |

### Deliberately out of scope
- **Load/stress/perf**: app is client-first with per-user Firestore docs; no shared hot path.
- **Pixel-diff visual regression**: smoke + component render assertions are the chosen trade-off.
- **Real Firestore integration tests**: handlers are tested against an in-memory fake
  (`tests/unit/app/api/fakeFirestore.ts`); real Firestore is exercised in staging deploys.

---

## Change checklist (paste into PRs that touch tested areas)

```
[ ] Found the feature row(s) in TEST_PLAN.md
[ ] Added/updated coverage at the lowest sufficient layer
[ ] Negative + edge cases covered (not just happy path)
[ ] Localization/RTL unaffected or re-verified
[ ] Session/persistence backward-compat preserved (or migration + test)
[ ] Ran fast gates locally (lint, check:testids, test:unit)
[ ] Full test:qa runs green on PR CI
[ ] Updated the matrix / Gap Log if coverage shape changed
```
