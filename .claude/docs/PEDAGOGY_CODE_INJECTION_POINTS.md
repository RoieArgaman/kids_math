## Purpose

Concrete “where to change what” map for implementing pedagogy improvements (Grades 1–2) in this repo, while keeping diffs minimal and preserving persisted progress semantics.

## Content & sequencing

- **File**: `lib/content/days.ts`
  - **Why**: single source of truth for day/section/exercise generation, including `SkillTag`s and `RepresentationType`.
  - **Typical changes**:
    - implement *variation sequencing* (change one parameter at a time)
    - ensure CPA progression across a concept (concrete → pictorial → abstract)
    - set `misconceptionTarget` for known traps to unlock targeted hints

## Exercise model metadata

- **File**: `lib/types.ts`
  - **Why**: defines `SkillTag`, `RepresentationType`, `Exercise`, `Section`, `WorkedExample`.
  - **Typical changes**:
    - prefer reusing existing fields (`skillTags`, `representation`, `misconceptionTarget`) before adding new schema
    - add new `SkillTag` only when it becomes a major curriculum pillar (additive-only)

## Hints & feedback (Track A MVP shipped)

- **File**: `lib/utils/exercise.ts`
  - **Why**: normalizes answers, checks correctness, and generates retry feedback/hints.
  - **What we changed**:
    - `defaultHint()` now uses **`skillTags` + `representation`** to provide strategy-based hints (make-10, number line, place value, etc.).
  - **Test coverage**:
    - `tests/unit/lib/utils/exercise.test.ts` asserts that hints change when `skillTags`/`representation` are present.

## Progress / unlock / mastery

- **File**: `lib/progress/engine.ts`
  - **Why**: persisted `WorkbookProgressState` logic; completion gate and unlock.
  - **Typical changes**:
    - if moving from 100% completion to “mastery with review”, keep schema versioning + migration; avoid unstable unlock behavior.

## Day UX / routine UI

- **Files**:
  - `components/screens/DayScreen.tsx`
  - `components/ExerciseBox.tsx`
  - **Why**: where to add “Number Talk” / strategy comparison prompts / worked examples.
  - **Constraints**:
    - RTL first, low reading load, focus-visible, touch targets ~44–52px.
    - follow testid rules (`lib/testIds.ts` + `.cursor/rules/testids.mdc`).

