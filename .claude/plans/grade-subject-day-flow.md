# Plan: Invert navigation to Grade → Subject → Day (with subject-based grade unlock)

## Context

Users report the current flow — **Subject → Grade → Day** — is confusing. We want to flip the top
two levels to **Grade → Subject → Day**, and change how the next grade unlocks:

- If **no** subject is completed in the current grade → the **next grade is completely locked**.
- If a subject **is** completed → **only that subject** is unlocked in the next grade (each subject
  carries its own prerequisite across grades).

Admin, progress (parent dashboard), and analytics must be updated to reflect the grade-first hierarchy.

### Key finding that de-risks this

The **per-subject cross-grade prerequisite already exists today** — it's just expressed subject-first:
- Math grade B is gated behind grade A's final exam (cookie + middleware).
- English/Science level B is gated behind level A's final exam (`isEnglishLevelUnlocked` / `isScienceLevelUnlocked`).
- `GradeId = "a" | "b"` is already shared across all three subjects (English/Science call it "level", but a=Grade A, b=Grade B).

So we are **not** inventing a new gating relationship — we are (1) inverting the navigation order,
(2) adding a **grade-level** gate that is the OR of the per-subject gates, (3) making the three
subjects' enforcement consistent, and (4) updating admin/progress/analytics. There are only ever
2 grades, so "next grade" always means **B**.

### Decisions locked (from user)

1. **"Subject done" = all regular days complete AND that subject's final exam passed** (strictest).
2. **Route depth = add a grade-first layer, keep existing URLs.** No change to day/section URLs,
   day IDs, or `localStorage` keys (honors the storage-back-compat MAX rule). New screens sit on top.
3. **Keep/extend server-side enforcement.** Generalize the middleware+cookie gate to protect grade-B
   paths for all three subjects (English/Science gain server-side enforcement they lack today).

This is a **MAX** task (routing + middleware + grade unlock chain + `lib/*/storage.ts` adjacency).

---

## Target navigation graph

```
/                       GradePickerScreen        Grade A card, Grade B card
                                                 (B locked until ≥1 subject "done" in A)
   │  pick grade
   ▼
/subjects/[grade]       SubjectPickerScreen      Math / English / Science cards
   (NEW route)                                   grade A: all unlocked
                                                 grade B: each card unlocked only if that
                                                          subject is "done" in grade A
   │  pick subject
   ▼
   Math    → /grade/[grade]     (existing HomeScreen — unchanged)
   English → /english/[grade]   (existing SubjectHomeScreen — grade == level, unchanged)
   Science → /science/[grade]   (existing SubjectHomeScreen — unchanged)
      │
      ▼  day → section → exercise   (all unchanged)
```

Back-link chain becomes: day → home → `/subjects/[grade]` → `/`.

`/subjects/b` must **not** live under any middleware-protected subtree (it isn't `/grade/b/*`,
`/english/b/*`, or `/science/b/*`), so the picker itself stays reachable; middleware protects it
separately (grade-level gate).

The old per-subject pickers (`/math`, `/english`, `/science` = "pick a grade/level for this subject")
are removed from the primary flow. Convert each to a **redirect to `/`** so old deep links and the
`gradePicker`/`mathHome` route builders still resolve without dead-ending users in the old order.

---

## Implementation

### Phase 1 — Completion + unlock core (the single source of truth)

**`lib/gradeUnlock.ts`** (edge-safe — imported by middleware, must NOT import storage/localStorage):
- Replace the single `GRADE_B_UNLOCK_COOKIE_NAME` with a per-subject scheme:
  `subjectGradeBUnlockCookieName(subject: Subject)` → `kids_math.unlocked.b.${subject}`, value `"1"`.
- Keep the legacy name `kids_math.unlocked_grade_b` as a recognized alias for **math** (back-compat:
  a returning user who unlocked math-B keeps access). Add a small `MATH_B_LEGACY_COOKIE` const.

**New `lib/completion/subjectGrade.ts`** (client; reuses existing primitives):
- `isSubjectGradeComplete(subject, grade)` → all **regular** days complete (exclude the subject's
  final-exam day) **AND** that subject+grade final exam `passed`. Reuse:
  - Math: `getWorkbookDays(grade)` + `loadProgressState({grade})` + `loadFinalExamState(grade)`.
  - English/Science: `getEnglishDays(level)`/`getScienceDays(level)` + their progress stores +
    `loadEnglishFinalExamState`/`loadScienceFinalExamState`. This mirrors the existing
    `isEnglishLevelExamUnlocked` "all days complete" check (`lib/english/levels.ts:35`).
- `isSubjectUnlockedInGrade(subject, grade)` → `grade === "a" ? true : isSubjectGradeComplete(subject, "a")`.
- `isGradeUnlocked(grade)` → `grade === "a" ? true : SUBJECTS.some(s => isSubjectGradeComplete(s, "a"))`.
- `previewAll` bypasses all three (consistent with existing gates).

**Cookie ↔ localStorage reconciliation (resolves review HIGH-1).** There are two sources of truth:
the unlock **cookies** (server enforcement, middleware) and **localStorage** completion (client UI).
They can desync (user clears cookies but keeps progress, restores a backup, or a POST failed).
Rule: **localStorage completion is authoritative; the cookie is a derived cache.** Add a
`reconcileGradeUnlockCookies()` that, on the grade picker (`/`) and subject picker mount, compares
`isSubjectGradeComplete(subject,"a")` against the cookie and re-POSTs `grade-b-unlock`/`grade-b-lock`
to converge. This makes the server gate self-heal without trusting the client blindly beyond what the
learner has already earned locally. Awaited before rendering CTAs (mirrors the existing
"await-before-CTA" note in LEARNING_LOG for math B).

Re-point the existing subject-specific gates to this module so there's one definition:
`lib/english/levels.ts` `isEnglishLevelUnlocked`, `lib/science/levels.ts` `isScienceLevelUnlocked`,
and `app/math/page.tsx`'s `gradeBLocked` all delegate to `isSubjectUnlockedInGrade`.

### Phase 2 — Server-side enforcement (middleware + API)

**`middleware.ts`**:
- Expand matcher to `["/grade/b/:path*", "/english/b/:path*", "/science/b/:path*", "/subjects/b"]`.
- For each subject subtree, require that subject's grade-B cookie; else redirect to that subject's
  locked page (`?next=`). Math also accepts the legacy cookie.
- For `/subjects/b`: require **any** subject-B cookie; else redirect to a grade-locked page.
- Keep existing exclusions (`/locked`, `/api/`).

**API** — generalize the two math-only endpoints into subject-aware ones:
- `app/api/grade-b-unlock/route.ts` (POST `{subject}`) sets `kids_math.unlocked.b.${subject}` (1yr).
- `app/api/grade-b-lock/route.ts` (POST `{subject}`) clears it.
- Keep the old `/api/unlock-grade-b` + `/api/lock-grade-b` as thin math-subject shims (back-compat for
  any cached client), or update all callers — prefer updating callers and deleting the old routes.

**Set the cookie when a subject's grade A becomes "done"** — trigger on final-exam pass, gated on the
full `isSubjectGradeComplete` check:
- Math: `components/screens/FinalExamScreen.tsx:195` (already POSTs unlock on grade-A pass) →
  POST `grade-b-unlock {subject:"math"}`.
- English/Science: the shared `components/screens/subject/SubjectFinalExamScreen.tsx` (today unlock is
  client-only) → POST `grade-b-unlock {subject}` on level-A pass. Wire `subject` in via
  `SubjectScreenConfig` (`lib/subjects/subjectScreenConfig.ts`).

**Revoke on admin reset** — generalize `lib/admin/resetDayProgress.ts` `shouldRevokeGradeBUnlock`
(currently math-only) to all three subjects; the admin cascade POSTs `grade-b-lock {subject}` when a
reset un-completes that subject's grade A.

**Locked pages** — generalize the single `app/grade/b/locked/page.tsx` into a shared
`LockedGradeScreen` parameterized by `{subject?, grade}`. Add pages: `/english/b/locked`,
`/science/b/locked`, and `/subjects/b/locked` (grade-level). Keep `/grade/b/locked`.

### Phase 3 — New screens & routing

**`lib/routes.ts`** — clean naming (resolves review MEDIUM-1, naming muddle):
- `gradePicker: () => "/"` becomes the **landing grade picker** (semantically correct — the `/` page
  now picks a grade). The current `gradePicker`→`/math` alias is **removed**; the ~8 back-links that
  used it are repointed (below), so nothing silently resolves to the old order.
- Add `subjectsForGrade: (grade) => "/subjects/${grade}"` for the new per-grade subject picker.
- Keep `subjectPicker: () => "/"` as a back-compat alias of `gradePicker` for any stray callers, but
  prefer `gradePicker` in new code.
- `mathHome`/`englishLevelPicker`/`scienceLevelPicker` keep returning `/math` etc. (builders unchanged)
  but those **pages become redirects to `/`**.

**`app/page.tsx`** — replace the current subject picker with the **GradePickerScreen** (Grade A / B;
B disabled until `isGradeUnlocked("b")`, mirroring today's `app/math/page.tsx` locked-card pattern).
Fire `grade_selected` here.

**`app/subjects/[grade]/page.tsx`** (NEW) — parses `grade`, renders **SubjectPickerScreen** listing
Math/English/Science. Each card links to that subject's home for the grade; disabled/locked when
`!isSubjectUnlockedInGrade(subject, grade)`. Reuse card markup/tokens from the current subject picker
(`app/page.tsx`) and the locked-card pattern from `app/math/page.tsx`. **Reuse the shared UI library**
(Surface/Card/HeroHeader/Chip per `.claude/docs/UI_COMPONENTS.md`); run `npm run check:cards`. RTL
preserved (`dir` inherited from root layout). Fire `subject_selected`.

**Back-links** — repoint the ~8 `routes.gradePicker()` / `routes.mathHome()` back targets to
`routes.subjectsForGrade(grade)` (callers already have `grade`): `HomeScreen.tsx:196`,
`PlanScreen.tsx:100`, `DayOverviewScreen.tsx:219`, `ComingSoonScreen.tsx:65`, `FinalExamScreen.tsx:367`,
`AdminHubScreen.tsx:68`, and the English/Science `SubjectHomeScreen` back link
(`config.levelPickerRoute` → `subjectsForGrade`). `/subjects/[grade]` back → `routes.subjectPicker()` (`/`).

**`app/math/page.tsx`** — convert to a redirect to `/` (its grade-picker role moves to `/`).
Similarly `app/english/page.tsx`, `app/science/page.tsx` → redirect to `/`.

### Phase 4 — Admin

**`components/screens/AdminProgressScreen.tsx`**:
- Swap the two selectors to **Grade first, then Subject** (grade-first IA). Keep the underlying
  `trackKey` resolution and per-day/section controls unchanged.
- Generalize the grade-unlock side effects to all subjects: `handleForceFinalExamComplete` POSTs
  `grade-b-unlock {subject}` (not just math); `handleReset` POSTs `grade-b-lock {subject}` when the
  cascade un-completes that subject's grade A. Uses the same `shouldRevoke*` from Phase 2.
- **`AdminHubScreen.tsx`** back-link → `/` (grade picker).

### Phase 5 — Progress / Parent Dashboard

**`components/screens/ParentDashboardScreen.tsx`** + **`lib/parent/metrics.ts`**:
- Keep the 6-track load (`{math,english,science} × {a,b}`) but **group the display grade-first**
  (Grade A → its 3 subjects, Grade B → its 3 subjects) to match the new IA.
- Add a **per-grade** days/sections rollup to `deriveDaysAndSections` (today it's global + per-subject
  only) so the dashboard can show "Grade A: X/Y days, Grade B: X/Y". Exam rows and accuracy tiles
  reordered grade → subject.

### Phase 6 — Analytics

**`lib/types/analytics.ts`** + **`lib/analytics/events.ts`**:
- Add optional `subject?: Subject` and `gradeId?: GradeId` to `AnalyticsEvent` and to `logEvent`'s
  input (backward compatible; existing events keep working). Bump `schemaVersion` note if needed.
- Add event name `subject_selected` (fired on the new subject picker). Keep `grade_selected`
  (now fired on the `/` grade picker).
- Thread `subject`/`gradeId` into the key emit sites (`day_viewed`, `day_completed`,
  `answer_submitted`, `home_viewed`) so analytics can finally distinguish subject & grade — resolving
  the current limitation where `lib/analytics/metrics.ts` collides `day-N` ids across tracks.

### Phase 7 — testIds & tests

**`lib/testIds.ts`** — a near-perfect reuse falls out of the existing namespaces (resolves review
MEDIUM-2):
- **`screen.gradePicker.*`** already has `gradeCard("a"|"b")` etc. — it currently renders at `/math`;
  move it to render at **`/`**. No new ids needed for the grade landing.
- **`screen.subjectPicker.*`** already has `mathCard`/`englishCard`/`scienceCard` — it currently
  renders at `/`; move it to render at **`/subjects/[grade]`**. Add only `lockedHint(subject)` and a
  per-card locked state id.
- Add grade-lock hint id to `gradePicker` for the disabled Grade B card (already has `gradeCard("b")`
  child ids like the current locked pattern in `app/math/page.tsx`).
- Run `npm run check:testids` to enforce coverage. Document the swap in `NAVIGATION_IA.md`.

**Tests** (update fixtures/specs for the new flow; keep grade axis + storage keys unchanged):
- Unit: `routes.test.ts` (new builders), `middleware.test.ts` (per-subject + `/subjects/b` gate),
  `parent/metrics.test.ts` (per-grade rollup), new tests for `lib/completion/subjectGrade.ts`.
- E2E (`tests/e2e/`): update landing/nav specs to Grade→Subject→Day; extend `admin-progress.spec.ts`
  grade-isolation; add English/Science grade-B server-gate coverage. Reuse `testUtils.ts` seeders
  (`seedProgressState`, `createFinalExamState`, cookie helpers) — extend cookie helper to the new
  per-subject cookie names.

**Docs**: update `.claude/docs/NAVIGATION_IA.md` (tree + link-direction rule) and append a
`.claude/docs/LEARNING_LOG.md` entry.

---

## Edge cases & open gaps addressed

- **Grade A is always the entry** — all subjects unlocked; only Grade B is gated. With just 2 grades,
  "next grade" is unambiguous.
- **"Completely locked" grade** — Grade B card on `/` is a disabled card (reuse the inert-card pattern
  from `app/math/page.tsx:101`) until `isGradeUnlocked("b")`; `/subjects/b` is also middleware-gated.
- **Partial unlock** — e.g. finish Math A only → Grade B enterable, Math B card active, English/Science
  B cards locked with a hint ("finish English in Grade A to unlock"). Server enforces each subtree.
- **Back-compat** — legacy `kids_math.unlocked_grade_b` cookie honored as math-B; no `localStorage`
  keys, day IDs, or content change, so existing learner progress survives (MAX storage rule satisfied).
- **`/math` `/english` `/science` deep links** — redirect to `/` instead of dead-ending in the old order.
- **Legacy `app/day/[id]/page.tsx`** (hardcodes grade `a`) — keep working (grade A is always open) or
  redirect to `routes.gradeDay("a", id)`; verify no orphan back-links point at the old order.
- **previewAll / QA bypass** — preserved end-to-end via the shared helpers.
- **Analytics day-id collision** — mitigated by adding `subject`/`gradeId` to events.
- **Cookie/localStorage desync** — self-healed by `reconcileGradeUnlockCookies()` (Phase 1).
- **Client-triggered unlock** (accepted limitation, unchanged from today) — the unlock POST is fired by
  the client on exam pass; the server does not independently recompute completion. Acceptable for
  non-sensitive educational content; cookies are `httpOnly`/`secure`/`sameSite=lax`. Flagged by
  Security review as MEDIUM-accepted (same risk profile as the current math-B design).

## Files (representative)

Core: `lib/gradeUnlock.ts`, `lib/completion/subjectGrade.ts` (new), `middleware.ts`,
`app/api/grade-b-unlock/route.ts` + `grade-b-lock/route.ts` (new), `lib/routes.ts`.
Screens: `app/page.tsx`, `app/subjects/[grade]/page.tsx` (new), `app/math|english|science/page.tsx`
(→ redirects), `components/screens/{HomeScreen,PlanScreen,DayOverviewScreen,ComingSoonScreen,FinalExamScreen,AdminHubScreen}.tsx`,
`components/screens/subject/{SubjectHomeScreen,SubjectFinalExamScreen}.tsx`, shared `LockedGradeScreen`.
Config/gates: `lib/subjects/subjectScreenConfig.ts`, `lib/english/levels.ts`, `lib/science/levels.ts`,
`lib/admin/resetDayProgress.ts`, `components/screens/AdminProgressScreen.tsx`.
Progress/analytics: `components/screens/ParentDashboardScreen.tsx`, `lib/parent/metrics.ts`,
`lib/types/analytics.ts`, `lib/analytics/events.ts`.
testIds/tests/docs: `lib/testIds.ts`, `tests/**`, `.claude/docs/NAVIGATION_IA.md`, `LEARNING_LOG.md`.

## Multi-Role Plan Review (MAX — all roles)

Mode: **MAX** (routing + middleware + grade-unlock chain + `lib/*/storage.ts` adjacency + admin/cookies/API).

### Review Team Participation
| Role | Participated | Finding | Verdict |
|------|-------------|---------|---------|
| SeniorDev_TechLead | ✅ | Route-builder naming was muddled (`subjectPicker` showing grades, `gradePicker` aliasing `/math`). | BLOCK(MEDIUM) → fixed |
| SeniorFrontEnd_TechLead | ✅ | New pickers must reuse shared UI library + `check:cards`; RTL & disabled-card a11y. | APPROVE (after note) |
| Dev_Architect | ✅ | Cookie (server) vs localStorage (client) can desync; middleware must stay edge-pure. | BLOCK(HIGH) → fixed via reconcile |
| QA_Architect | ✅ | Need boundary tests for strict "all days AND exam"; middleware per-subject + grade gate. | APPROVE (tests specified) |
| SeniorAutomation_Engineer | ✅ | Stable testIds via reuse of existing namespaces; add partial-unlock E2E. | APPROVE |
| SeniorAutomation_TechLead | ✅ | Cookie seeding must move to a shared helper (per-subject names) to avoid flake/dupe. | APPROVE |
| SeniorManualQA_Engineer | ✅ | RTL step-by-step script required (below). | APPROVE |
| UX_QA_Engineer | ✅ | Locked cards must not trap focus; locked pages must state *why* + *how to unlock*. | APPROVE (note) |
| SeniorQA_Engineer | ✅ | Legacy `/day/[id]`, previewAll deep links, returning-user with legacy cookie. | APPROVE (edge cases added) |
| SeniorProductDesigner | ✅ | Grade & subject pickers share one visual language/tokens. | APPROVE |
| SeniorProductManager | ✅ | Define acceptance criteria; analytics change is separable → own commit. | APPROVE (criteria below) |
| MoE_PedagogyLead | ➖ | N/A — no exercise/curriculum content changes (nav + gating only). | N/A |
| Security | ✅ | Client-triggered unlock is an accepted, pre-existing limitation; cookies httpOnly/secure. | APPROVE(MEDIUM-accepted) |

**Blocking findings resolved:** HIGH-1 (cookie/localStorage reconcile) and MEDIUM-1 (route naming),
MEDIUM-2 (testId reuse) are folded into Phases 1, 3, 7 above. No CRITICAL findings. Review passes.

### Cross-file impact confirmed
Route builders, middleware matcher, 3 API routes, 6 back-link call sites, `subjectScreenConfig`,
`resetDayProgress`, admin/parent screens, analytics schema, testIds, and E2E fixtures — all listed in
**Files** above. No `localStorage` key, day ID, or content change → existing learner data loads
unchanged (Data & Storage Rule satisfied).

---

## Acceptance Criteria (SeniorProductManager)

1. Landing `/` shows a **grade** picker; Grade B is visibly locked until ≥1 subject is "done" in Grade A.
2. Picking a grade shows a **subject** picker for that grade; in Grade A all three subjects are open.
3. In Grade B, a subject card is open **iff** that subject was completed (all days + exam) in Grade A;
   others show a clear locked hint.
4. Server-side: directly visiting `/grade/b/*`, `/english/b/*`, `/science/b/*`, or `/subjects/b`
   without the earned cookie redirects to the matching locked page.
5. Completing a subject in Grade A unlocks exactly that subject in Grade B (not the others).
6. Admin can view/force/reset per (grade, subject); forcing completion unlocks, reset revokes.
7. Parent dashboard groups progress grade-first; analytics events carry `subject` + `gradeId`.
8. All existing learner progress survives the deploy (no data reset).
9. `npm run test:qa` green; `check:testids` + `check:cards` pass.

---

## Full Testing Plan

### A. Automated — Unit (`npm run test:unit`)
- **`lib/completion/subjectGrade.ts`** (new): all-days-incomplete → not complete; all-days-complete but
  exam not passed → **not** complete (strict AND); both → complete; `isGradeUnlocked` = OR across
  subjects; `isSubjectUnlockedInGrade("x","a")` always true; grade B gated on grade A; `previewAll` bypass.
- **`tests/unit/lib/routes.test.ts`**: `gradePicker()==="/"`, `subjectsForGrade("a")==="/subjects/a"`,
  `subjectPicker()` alias, unchanged day/section builders.
- **`tests/unit/middleware.test.ts`**: each of `/grade/b`, `/english/b`, `/science/b` redirects without
  its cookie and passes with it; legacy math cookie accepted; `/subjects/b` needs **any** subject cookie;
  `/locked` + `/api/` excluded; grade-A paths never gated.
- **`lib/gradeUnlock.ts`**: per-subject cookie-name builder; legacy alias maps to math.
- **`tests/unit/lib/admin/resetDayProgress.test.ts`**: revoke cascade for all three subjects.
- **`tests/unit/lib/parent/metrics.test.ts`**: new per-grade days/sections rollup; grade-first grouping.
- **Analytics** (`lib/analytics/events` / `types`): old events (no `subject`) still parse (back-compat);
  new events carry `subject`/`gradeId`; `subject_selected` recorded.
- **New `reconcileGradeUnlockCookies` unit**: cookie missing + localStorage complete → POST unlock;
  cookie present + localStorage incomplete → POST lock; in-sync → no POST.

### B. Automated — E2E (`npm run test:e2e`, Chromium)
- **New `tests/e2e/grade-subject-flow.spec.ts`**: `/` → Grade A → `/subjects/a` → Math/English/Science
  → day; back-chain day → home → `/subjects/a` → `/`.
- **New partial-unlock spec**: seed Math A fully complete (`seedProgressState` + `createFinalExamState`
  + set math-B cookie via helper) → `/` Grade B enabled → `/subjects/b`: Math open, English/Science
  locked; direct `/english/b` redirects to `/english/b/locked`, `/grade/b/*` open.
- **Extend `tests/e2e/admin-progress.spec.ts`**: grade-first selectors; force-complete english A sets
  english-B cookie and unlocks `/english/b`; reset revokes.
- **Extend `tests/e2e/parent-dashboard.spec.ts`**: grade-first grouping + per-grade counts.
- **Update** existing landing/nav specs (`legal-pages`, `visual-smoke`, lifecycle specs) to the new order.
- **Helpers**: extend `tests/e2e/testUtils.ts` with per-subject cookie seeders
  (`kids_math.unlocked.b.{subject}`) + a `seedSubjectGradeComplete(page, subject, grade)` convenience.

### C. Static gates
`npm run lint` · `npm run check:testids` · `npm run check:cards` · `npm run build` (App Router tree +
edge middleware compile).

### D. MCP Playwright — visual + interaction smoke (MAX mandatory)
Screens: `/` grade picker (Grade B locked vs unlocked), `/subjects/a` (all open), `/subjects/b`
(mixed lock states), each locked page, admin progress (grade-first), parent dashboard. Capture RTL
layout, disabled-card styling, focus order (locked cards not focus-trapped), and dark/light.

### E. Manual RTL script (SeniorManualQA_Engineer)
1. Fresh state → `/`: only Grade A actionable; Grade B shows lock + reason.
2. Grade A → subject picker: 3 subjects open; enter Math, complete all days + pass final exam.
3. Return `/`: Grade B now actionable. Enter → Math open, English/Science locked with hints.
4. Open Math B day; confirm back-chain and RTL throughout.
5. Type `/english/b` in the address bar → redirected to English-B locked page explaining how to unlock.
6. Complete English A → `/english/b` now reachable; Science B still locked.
7. Admin → force-reset Math A final exam → `/` Grade B still actionable (English done), Math B re-locked
   and `/grade/b/*` redirects again.
8. previewAll (`?previewAll=1`) bypasses all gates.

### F. Regression / data safety
Verify a pre-existing user (seed old `kids_math.workbook_progress.v2.grade.*`, legacy
`kids_math.unlocked_grade_b` cookie) lands correctly: progress intact, Grade B unlocked via reconcile,
no data reset. Cross-check `.claude/docs/REGRESSION_TEST_PLAN.md`.

### G. Final gate
`npm run test:qa` (lint + unit + build + E2E) green before READY; append `LEARNING_LOG.md`.
