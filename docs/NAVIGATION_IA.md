# Navigation & Information Architecture (kids_math)

This app teaches multiple **subjects**. The front door is a **subject picker**; each subject
owns its own navigation tree below it.

## Route map

```
/                                   Subject picker        → [ חשבון/Math ] [ אנגלית/English ]
/math                               Math grade picker     → [ כיתה א׳ ] [ כיתה ב׳ ]
/grade/[grade]                      Math grade home (day list)
/grade/[grade]/day/[id]             Math day hub (sections)
/grade/[grade]/day/[id]/section/[sectionId]   Math section (exercises)
/grade/[grade]/gmat-challenge | /badges | /plan
/english                            English home (day list, single Pre-A1 track)
/english/day/[id]                   English day hub
/english/day/[id]/section/[sectionId]         English section (exercises)
/admin/progress | /admin/users      Global admin
/privacy | /cookies                 Legal
```

Math is keyed by **grade** (`a`/`b`); English is a single subject-keyed track (no grade).
See [`AGENTS.md`](../AGENTS.md) → Routing & Navigation and the `LearningTrack` model in
`lib/subjects.ts` / `lib/track.ts`.

## Route builders — always use these (never hardcode paths)

All in `lib/routes.ts`:

- `routes.subjectPicker()` → `/` (the home)
- `routes.mathHome()` → `/math` (the grade picker)
- `routes.gradeHome(grade)` / `gradeDay` / `gradeSection` / `gradeGmatChallenge` / `gradeBadges` / `gradePlan`
- `routes.englishHome()` / `englishDay(dayId)` / `englishSection(dayId, sectionId)` / `englishExam()`
- `routes.gradePicker()` → **alias of `/math`** (kept so legacy "back to grade selection" links resolve correctly)

**Link-direction rule:**
- Inside a Math screen, "back to grade selection" → `routes.gradePicker()` (== `/math`).
- A top-level "back to subjects/home" → `routes.subjectPicker()` (== `/`).

## Test IDs

- Subject picker: `testIds.screen.subjectPicker.*` (`mathCard`, `mathCardCta`, `englishCard`, `englishCardCta`, `adminCta`, `navBack` lives on the grade picker).
- Math grade picker (now at `/math`): keeps `testIds.screen.gradePicker.*` (so existing grade-card selectors are unchanged) + `gradePicker.navBack()` (→ subject picker).

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
7. **Entry point:** add a card to the subject picker (`app/page.tsx`) + `testIds.screen.subjectPicker.<subject>Card*`.
8. **TestIDs:** add `testIds.screen.<subject>.*`; run `npm run check:testids`.
9. **Tests:** add a `tests/e2e/<subject>-day-smoke.spec.ts` (mirror the English one) + subject-picker nav assertion.
10. **Docs:** update this file's route map + add the subject's pedagogy note to `docs/`.
11. **Sync (if cross-device needed):** add the subject's keys to `UserProgressBundle` + `/api/user/progress` (bump `bundleVersion`, keep backward-compat).

## How to add a grade (Math)

Follow `.cursor/rules/add-grade.mdc` (MAX mode). In short: add the grade to `GradeId` in
`lib/grades.ts`, author content under `lib/content/grade-<x>/`, wire it in
`lib/content/workbook.ts`, add a card to the **Math grade picker** (`app/math/page.tsx`) with
`testIds.screen.gradePicker.gradeCard("<x>")`, and gate it in `middleware.ts` if it should be locked.

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
