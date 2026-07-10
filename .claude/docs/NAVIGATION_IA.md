# Navigation & Information Architecture (kids_math)

This app teaches multiple **subjects** across two **grades**. The front door is a **grade picker**
(`/`); picking a grade opens a **subject picker** (`/subjects/[grade]`) for that grade, and each
subject owns its own day/section tree below it: **Grade → Subject → Day**.

## Route map

```
/                                   Grade picker          → [ כיתה א׳ ] [ כיתה ב׳ (locked until a subject is done in א׳) ]
/subjects/[grade]                   Subject picker        → [ חשבון ] [ אנגלית ] [ מדעים ]  (grade B: per-subject locked)
/subjects/b/locked                  Grade-level locked page (no subject done in Grade A)
/grade/[grade]                      Math grade home (day list)
/grade/[grade]/day/[id]             Math day hub (sections)
/grade/[grade]/day/[id]/section/[sectionId]   Math section (exercises)
/grade/[grade]/gmat-challenge | /badges | /plan
/grade/b/locked                     Math grade-B locked page
/english/[level]                    English level home (day list)
/english/[level]/day/[id]           English day hub
/english/[level]/day/[id]/section/[sectionId] English section (exercises)
/english/[level]/exam               English level final exam
/english/b/locked                   English level-B locked page
/science/[level] ...                Science (mirrors English) + /science/b/locked
/math, /english, /science           Legacy per-subject pickers → redirect to `/`
/admin/progress | /admin/users      Global admin (grade-first selectors)
/privacy | /cookies                 Legal
```

**Grade-B unlock:** each subject carries its own cross-grade prerequisite — completing a subject
in Grade A (all its regular days **and** its final exam) unlocks *that* subject in Grade B. Grade B
itself opens once **any** subject is done in Grade A. Enforcement is per-subject cookies
(`kids_math.unlocked.b.<subject>`; legacy `kids_math.unlocked_grade_b` still accepted for math) read
by `middleware.ts`, set on exam pass and reconciled by `reconcileGradeUnlockCookies()`
(unlock-only self-heal). The single completion truth is `lib/completion/subjectGrade.ts`.

Math is keyed by **grade** (`a`/`b`). English mirrors that with **two CEFR levels**
(`a` = Pre-A1, `b` = A1) reusing the same `GradeId` axis: a level picker, per-level
homes, and a per-level final exam, with Level B gated behind Level A's exam. Learner
progress uses a single subject-keyed store (day IDs are disjoint across levels: A =
day-1..14, B = day-15..28). See [`AGENTS.md`](../AGENTS.md) → Routing & Navigation.

## Route builders — always use these (never hardcode paths)

All in `lib/routes.ts`:

- `routes.subjectPicker()` → `/` (the home)
- `routes.mathHome()` → `/math` (the grade picker)
- `routes.gradeHome(grade)` / `gradeDay` / `gradeSection` / `gradeGmatChallenge` / `gradeBadges` / `gradePlan`
- `routes.englishLevelPicker()` → `/english` (the level picker)
- `routes.englishHome(level)` / `englishDay(level, dayId)` / `englishSection(level, dayId, sectionId)` / `englishExam(level)`
- `routes.gradePicker()` → **alias of `/math`** (kept so legacy "back to grade selection" links resolve correctly)

**Link-direction rule (Grade → Subject → Day):**
- Inside a subject screen (Math/English/Science), "back one level" → the subject picker for that
  grade: `routes.subjectsForGrade(grade)` (== `/subjects/[grade]`).
- The subject picker's "back" → the grade picker: `routes.gradePicker()` (== `/`).
- `routes.gradePicker()` and `routes.subjectPicker()` both resolve to `/` (the landing grade picker;
  `subjectPicker` is a back-compat alias). `routes.mathHome()`/`englishLevelPicker()`/
  `scienceLevelPicker()` still return `/math`/`/english`/`/science`, but those pages now redirect to `/`.

## Test IDs

- Grade picker (landing `/`): `testIds.screen.gradePicker.*` (`gradeCard("a"|"b")`, `gradeCardCta`,
  `gradeLockedHint("b")`, `adminCta`).
- Subject picker (`/subjects/[grade]`): `testIds.screen.subjectPicker.*` (`mathCard`/`englishCard`/
  `scienceCard` + `*CardCta`, `lockedHint(subject)`, `navBack` → grade picker).
- Locked pages: math keeps `testIds.screen.gradeBLocked.*`; english/science/grade-level use
  `testIds.screen.lockedGrade.{root,reason,primaryCta,secondaryCta}("english"|"science"|"grade")`.

---

## How to add a new subject

1. **Model:** add the subject to `Subject` in `lib/subjects.ts` and extend `LearningTrack`.
2. **Storage (MAX):** create `lib/<subject>/storage.ts` — its own namespaced key
   `kids_math.<subject>.workbook_progress.v1`. **Never** edit `lib/progress/storage.ts`.
   Add a unit test asserting isolation + fail-safe parse (mirror `tests/unit/lib/english/storage.test.ts`).
3. **Resolver:** add the subject to `lib/track.ts` (`getTrackDays` / `loadTrackProgress` / `saveTrackProgress`).
4. **Content:** `lib/content/<subject>/` (day files using `lib/content/engine/exercise-factories.ts`) + a `get<Subject>Days()` accessor.
5. **Routes:** add builders to `lib/routes.ts` (`<subject>Home`, `<subject>Day`, `<subject>Section`).
6. **Screens & pages:** add `components/screens/<subject>/*` reusing leaf components
   (`ExerciseItem`, `SectionBlock`, `ProgressBar`, `StarReward`, `AudioButton`) + the track-aware
   hooks (`useProgress`/`useDayAnswers` accept an optional `subject`). Add `app/<subject>/**` thin pages.
7. **Entry point:** add a card to the subject picker (`app/subjects/[grade]/page.tsx`, the `SUBJECT_CARDS`
   array) + `testIds.screen.subjectPicker.<subject>Card*`, and add the subject to `SUBJECTS` in
   `lib/subjects.ts` (drives the grade-unlock OR-gate + reconcile). Add its per-subject grade-B locked
   page (`app/<subject>/b/locked/page.tsx` via the shared `LockedGradeScreen`) and middleware subtree.
8. **TestIDs:** add `testIds.screen.<subject>.*`; run `npm run check:testids`.
9. **Tests:** add a `tests/e2e/<subject>-day-smoke.spec.ts` (mirror the English one) + subject-picker nav assertion.
10. **Docs:** update this file's route map + add the subject's pedagogy note to `docs/`.
11. **Sync (if cross-device needed):** add the subject's keys to `UserProgressBundle` + `/api/user/progress` (bump `bundleVersion`, keep backward-compat).

## How to add a grade (Math)

Follow `.cursor/rules/add-grade.mdc` (MAX mode). In short: add the grade to `GradeId` in
`lib/grades.ts`, author content under `lib/content/grade-<x>/`, wire it in
`lib/content/workbook.ts`, add a card to the **grade picker** (`app/page.tsx`) with
`testIds.screen.gradePicker.gradeCard("<x>")` gated on `isGradeUnlocked("<x>")`, add a
`/subjects/<x>` entry, and gate the new grade's subtrees in `middleware.ts` if locked. (With only
grades a/b today, "next grade" is always B; a third grade generalizes `subjectGrade.ts`.)

**Gate the picker card too — not just middleware.** `middleware.ts` is the security gate
(it redirects locked `/grade/<x>` routes to a locked page), but a card that still renders as an
active `<Link>` is *presented* as open and bounces the child through a redirect. So when a grade
is locked, also gate its **picker card** on the same unlock signal (e.g.
`loadFinalExamState(prevGrade)?.passed`, with `previewAll` bypassing the gate for QA): render an
**inert** card (a `<div>`, not a `<Link>`, with `opacity-60`, a 🔒 chip, and no
`gradeCardCta`) until the prerequisite is met. The absence of `gradeCardCta("<x>")` is the
inert signal E2E asserts.

## How to add a new exercise kind

1. Add the kind to `ExerciseKind` + a typed interface to the `Exercise` union in `lib/types/curriculum.ts`.
2. Handle it in **every** exhaustive `switch (exercise.kind)` (the compiler will flag them):
   `lib/utils/exercise.ts` (×2: `isAnswerCorrect`, `defaultHint`), `lib/progress/engine.ts`
   (`answerValueForExercise`), and add a real branch in `components/exercises/ExerciseRenderer.tsx`
   (it ends in a `never` check — do not rely on a fall-through).
3. Add a factory in `lib/content/engine/exercise-factories.ts` and choices in `lib/utils/choiceOptions.ts` if it uses options.
4. Add testIds for any new interactive DOM; run `npm run check:testids`.
5. Add a grading unit test (mirror `tests/unit/lib/utils/exercise-english-kinds.test.ts`).
6. **Rule:** numbers/taps only — never a free-text field (see `CLAUDE.md` → Exercise Input Policy).
