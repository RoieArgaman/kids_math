# Test Coverage Matrix

> Living map of **feature → automated coverage**. Every app route (`app/**/page.tsx`)
> MUST have a row here; `npm run check:coverage-matrix` fails when a route has no row
> (so a new feature can't ship coverage-less). Cross-cutting features (no single route)
> are listed in the second table.
>
> Columns: **E2E** = Playwright spec(s) under `tests/e2e/`. **Unit** = representative
> Vitest coverage under `tests/unit/`. **Notes** = edge/negative cases or gaps.
> Keep spec filenames accurate — they are the regression home for that surface.

## Route coverage

| Route (`app/…/page.tsx`) | Feature | E2E spec(s) | Unit | Notes |
|---|---|---|---|---|
| `app/page.tsx` | Landing grade picker | `subject-picker.spec.ts`, `grade-b-gate.spec.ts` | `GradePickerScreen.test.tsx` | previewAll bypass, Grade-B locked hint |
| `app/math/page.tsx` | Legacy `/math` redirect | `subject-picker.spec.ts` | `routes.test.ts` | redirects to `/` |
| `app/plan/page.tsx` | Global plan redirect/layout | `plan-screen.spec.ts` | `PlanScreen.test.tsx` | — |
| `app/subjects/[grade]/page.tsx` | Subject picker (Math/English/Science) | `subject-picker.spec.ts`, `grade-subject-flow.spec.ts` | `SubjectPickerScreen.test.tsx` | invalid grade → 404 |
| `app/subjects/b/locked/page.tsx` | Grade-B subject-level locked page | `grade-subject-flow.spec.ts` | `SubjectScreens.test.tsx` | reachable once any subject cookie present |
| `app/grade/[grade]/page.tsx` | Grade home (days, streak, exam CTA) | `grade-a-lifecycle.spec.ts`, `grade-b-lifecycle.spec.ts`, `streak.spec.ts` | `HomeScreen.test.tsx` | streak badge, resume state |
| `app/grade/[grade]/plan/page.tsx` | Study plan (strands, %) | `plan-screen.spec.ts` | `PlanScreen.test.tsx` | 0% empty, non-zero partial, RTL |
| `app/grade/[grade]/badges/page.tsx` | Badge gallery | `badges-gallery.spec.ts`, `trophy-unlock-bulk.spec.ts` | `BadgeGalleryScreen.test.tsx` | empty state, earned vs locked |
| `app/grade/[grade]/day/[id]/page.tsx` | Day hub (sections, warmup gate) | `day-smoke.spec.ts`, `all-days-completion.spec.ts` | `DayOverviewScreen.test.tsx` | warmup gate, teaching primer |
| `app/grade/[grade]/day/[id]/section/[sectionId]/page.tsx` | Section (exercises) | `day-smoke.spec.ts`, `exercise-negative.spec.ts`, `exercise-kinds.spec.ts`, `spiral-review.spec.ts` | `SectionScreen.test.tsx` | per-kind positive/negative, retry, auto-reset |
| `app/grade/[grade]/gmat-challenge/page.tsx` | GMAT challenge (timed) | `gmat-challenge.spec.ts` | `GmatChallengeScreen.test.tsx` | locked until exam pass |
| `app/grade/b/locked/page.tsx` | Grade-B locked page | `grade-b-gate.spec.ts`, `grade-b.spec.ts` | `LockedGradeScreen.test.tsx` | `next=` round-trip |
| `app/day/[id]/page.tsx` | Legacy day redirect | `day-smoke.spec.ts` | `routes.test.ts` | — |
| `app/english/page.tsx` | English level picker | `subject-picker.spec.ts` | `EnglishScreens.test.tsx` | — |
| `app/english/[level]/page.tsx` | English level home | `english-day-smoke.spec.ts` | `EnglishScreens.test.tsx` | exam locked until days done |
| `app/english/[level]/day/[id]/page.tsx` | English day hub | `english-day-smoke.spec.ts` | `EnglishScreens.test.tsx` | — |
| `app/english/[level]/day/[id]/section/[sectionId]/page.tsx` | English section | `english-day-smoke.spec.ts` | `SubjectSectionScreen.test.tsx` | match_pairs / letter_tiles kinds |
| `app/english/[level]/exam/page.tsx` | English final exam | `english-exam-smoke.spec.ts` | `english/final-exam/storage.test.ts` | pass flow, locked gate |
| `app/english/b/locked/page.tsx` | English Grade-B locked | `grade-subject-flow.spec.ts` | `EnglishScreens.test.tsx` | server gate redirect |
| `app/science/page.tsx` | Science level picker | `subject-picker.spec.ts` | `ScienceScreens.test.tsx` | — |
| `app/science/[level]/page.tsx` | Science level home | `science-day-smoke.spec.ts` | `ScienceScreens.test.tsx` | — |
| `app/science/[level]/day/[id]/page.tsx` | Science day hub | `science-day-smoke.spec.ts` | `ScienceScreens.test.tsx` | — |
| `app/science/[level]/day/[id]/section/[sectionId]/page.tsx` | Science section | `science-day-smoke.spec.ts` | `SubjectSectionScreen.test.tsx` | — |
| `app/science/[level]/exam/page.tsx` | Science final exam | `science-exam-smoke.spec.ts` | `science/final-exam/storage.test.ts` | pass flow, locked gate, Level ב׳ |
| `app/science/b/locked/page.tsx` | Science Grade-B locked | `grade-subject-flow.spec.ts` | `ScienceScreens.test.tsx` | — |
| `app/admin/page.tsx` | Admin hub (PIN gate) | `parent-dashboard.spec.ts`, `admin-pin.spec.ts` | `AdminHubScreen.test.tsx` | wrong PIN, unlock persistence |
| `app/admin/progress/page.tsx` | Admin progress management | `admin-progress.spec.ts`, `admin-progress-sync.spec.ts` | `AdminProgressScreen.test.tsx` | reset clears exam/gmat |
| `app/admin/users/page.tsx` | Admin users mgmt | `admin-users.spec.ts` | `AdminUsersScreen.test.tsx` | add/reset/soft-delete, non-admin denied |
| `app/admin/parent-dashboard/page.tsx` | Parent dashboard (read-only) | `parent-dashboard.spec.ts` | `ParentDashboardScreen.test.tsx` | read-only invariant |
| `app/privacy/page.tsx` | Privacy policy | `legal-pages.spec.ts` | `LegalSection.test.tsx` | — |
| `app/cookies/page.tsx` | Cookie policy | `legal-pages.spec.ts` | `LegalSection.test.tsx` | consent accept/reject |

## Cross-cutting feature coverage

| Feature | E2E spec(s) | Unit | Notes |
|---|---|---|---|
| Auth (login/logout/avatar) | `auth.spec.ts`, `auth-backward-compat.spec.ts` | `authLogin.test.ts`, `context*.test.tsx` | one real-login path env-gated |
| Account lockout / show-password | `account-lockout.spec.ts` | `accountLockout.test.ts` | cooldown, one-more-try nudge |
| Session revocation / logout-all | `session-revocation.spec.ts` | `tokenVersion.test.ts` | token-version bump |
| Per-student isolation / sync | `multi-user-isolation.spec.ts` | `isolation.test.ts`, `merge.test.ts` | F1 level-ב exam (unit); F4 analytics clear (E2E) |
| Session revocation (401 teardown) | `session-lifecycle.spec.ts`, `session-revocation.spec.ts` | `contextOrdering.test.tsx`, `tokenVersion.test.ts` | 401 wipes device; anon not wiped |
| Grade-B unlock (per subject) | `grade-b-gate.spec.ts`, `grade-b-lifecycle.spec.ts`, `grade-b-unlock-paths.spec.ts`, `grade-subject-flow.spec.ts` | `gradeUnlock.test.ts`, `reconcile.test.ts` | English/Science-only unlock isolation |
| Storage resilience | `storage-resilience.spec.ts` | `progress/storage.test.ts` | corrupt/wrong-shape → no crash (F2-style) |
| Adaptive weak-spot suggestions | `adaptive-suggestions.spec.ts` | `adaptiveSuggestions.test.ts` | shown on completed day w/ wrong ex; MetacognitionToast unit-only |
| Anonymous daily limit | `anon-daily-limit.spec.ts` | `anonDailyLimit.test.ts` | per-subject cap, login lifts |
| Final exam (math) | `grade-a-lifecycle.spec.ts` | `final-exam/grading.test.ts`, `picker.test.ts` | boundary score, reset |
| Spiral review | `spiral-review.spec.ts` | `review/engine.test.ts` | prior-wrong resurfacing |
| Streak | `streak.spec.ts` | `streak/engine.test.ts`, `calendarStreakTimezone.test.ts` | increment, reset, local-date (F3) |
| Badges / trophy | `badges-gallery.spec.ts`, `trophy-unlock-bulk.spec.ts` | `badges/engine.test.ts` | bulk unlock modal |
| TTS / voice | `tts-accessibility.spec.ts` | `tts/engine.test.ts` | toggle persistence, admin-off hides |
| Cookie consent | `legal-pages.spec.ts` | `cookieConsent/storage.test.ts` | banner accept, persists |
| Touch targets / a11y | `touch-targets.spec.ts`, `edge-and-a11y.spec.ts` | — | ≥44px, mobile viewport |
| Security headers / health | `security-headers.spec.ts`, `health.spec.ts` | `health.test.ts` | staged CSP/HSTS posture |
| Error routes / 404 | `edge-and-a11y.spec.ts`, `error-pages.spec.ts` | `parseDayId.test.ts` | invalid grade/level/day/section |
| Exercise-kind mechanics | `exercise-kinds.spec.ts`, `exercise-negative.spec.ts` | `exercise.test.ts` | per-kind wrong→retry→correct |
| RTL / layout invariants | `rtl-i18n.spec.ts`, `touch-targets.spec.ts` | — | dir=rtl, no horizontal overflow |
| Seed-key contract (harness) | — | `seedKeyContract.test.ts` | guards E2E seed prefixes vs lib keys |

## Status legend

- A blank/absent E2E cell means **unit-only** — acceptable only for pure logic that has no
  user-observable surface. Anything a learner can see or do should have an E2E row.
- `@smoke`-tagged tests form the fast pre-shard lane (see `playwright.config.ts` / CI).
