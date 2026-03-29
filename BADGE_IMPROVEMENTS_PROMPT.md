# Badge System Improvements — Full Implementation Brief

## Who You Are and What You Are Doing

You are implementing a set of product, UX, and design improvements to the badge and achievement
system of a Hebrew-language math learning web app for Israeli schoolchildren (grades 1–2,
ages 6–8). The improvements were designed collaboratively by a product manager, a product
designer, and a UX/UI specialist. Your job is to implement every change described in this
document, exactly as specified.

---

## App Overview

**What it is:** A structured daily math workbook app, aligned to the Israeli Ministry of
Education curriculum. Children complete one "day" at a time, which contains math exercises
across several sections (warmup, arithmetic, geometry, verbal, challenge). A day is only
marked complete when the student answers 100% of exercises correctly.

**Target users:** Children ages 6–8, primarily using tablets or mobile phones. Parents
supervise. The UI is entirely in Hebrew (RTL).

**Grades:**
- Grade A (כיתה א׳): ~28 active days + 1 final exam day (day-29)
- Grade B (כיתה ב׳): same structure, unlocked only after passing Grade A final exam

**Tech stack:**
- Next.js 14 (App Router, `"use client"` components)
- TypeScript 5
- Tailwind CSS 3
- All state is persisted to `localStorage`. No backend, no database.
- React 18

**Key architectural rule:** `localStorage` is the only persistence layer. All state is
loaded on mount and saved on change. There is no server-side state.

---

## Repository Layout (files you will touch)

```
lib/
  badges/
    types.ts          ← BadgeId union, BadgeDefinition interface, BadgeState
    definitions.ts    ← BADGE_DEFINITIONS array + BADGE_DEFINITIONS_MAP
    engine.ts         ← evaluateBadges() pure function
  types/
    progress.ts       ← WorkbookProgressState, DayProgressState, ExerciseAttempt
  progress/
    engine.ts         ← setAnswerForDay(), markDayComplete(), etc. (pure functions)
    storage.ts        ← loadProgressState(), saveProgressState()
  hooks/
    useBadges.ts      ← React hook wrapping badge evaluation + localStorage
  routes.ts           ← routes.gradeBadges(), routes.gradeHome(), etc.
  grades.ts           ← GradeId = "a" | "b"
components/
  screens/
    BadgeGalleryScreen.tsx   ← the badge gallery page component
    DayScreen.tsx            ← the daily lesson page component
    HomeScreen.tsx           ← the main dashboard component
app/
  globals.css                ← Tailwind base + custom keyframe animations
```

---

## Existing Data Models (read these carefully before touching any file)

### `DayProgressState` (lib/types/progress.ts — current)
```typescript
export interface DayProgressState {
  dayId: DayId;
  answers: Record<ExerciseId, AnswerValue>;
  correctAnswers: Record<ExerciseId, boolean>;
  wrongCount: number;
  attempts: ExerciseAttempt[];
  completedAt?: string;         // ISO timestamp, set when day first reaches 100%
  percentDone: number;
  isComplete: boolean;
  // bestTimeMs does NOT exist yet — you will add it
}
```

### `ExerciseAttempt`
```typescript
export interface ExerciseAttempt {
  exerciseId: ExerciseId;
  answer: AnswerValue;
  isCorrect: boolean;
  attemptedAt: string;          // ISO timestamp
}
```

### `BadgeDefinition` (lib/badges/types.ts — current)
```typescript
export interface BadgeDefinition {
  id: BadgeId;
  name: string;
  description: string;
  icon: string;
  // tier does NOT exist yet — you will add it
}
```

### `BadgeState`
```typescript
export interface BadgeState {
  version: 1;
  grade: GradeId;
  unlocked: UnlockedBadge[];    // [{ id, unlockedAt: ISO }]
  seenIds: BadgeId[];
  updatedAt: string;
}
```

---

## How Progress Is Saved (important for Part 2)

Progress flows like this:
1. `useProgress(dayId, { grade })` hook exposes `setAnswer`, `markComplete`, `percentDone`, etc.
2. `setAnswer` calls `setAnswerForDay()` from `lib/progress/engine.ts` (pure function, returns
   new state).
3. `markComplete` calls `markDayComplete()` from `lib/progress/engine.ts`.
4. The hook saves the returned state via `saveProgressState(nextState, { grade })`.

The `markDayComplete` function in `lib/progress/engine.ts`:
```typescript
export function markDayComplete(
  state: WorkbookProgressState,
  dayId: DayId,
): WorkbookProgressState {
  const dayState = getOrCreateDayProgress(state, dayId);
  if (!passesCompletionGate(dayState.percentDone)) {
    return state;                // returns same reference if not passing → hook returns false
  }
  const nextDayState: DayProgressState = {
    ...dayState,
    isComplete: true,
    completedAt: dayState.completedAt ?? new Date().toISOString(),
  };
  return { ...state, days: { ...state.days, [dayId]: nextDayState }, updatedAt: ... };
}
```

The `setAnswerForDay` function already sets `completedAt` when the answer triggers 100%, but
`markDayComplete` is the authoritative completion call made by the user pressing the button.

---

## Current `BadgeId` Union (lib/badges/types.ts)

```typescript
export type BadgeId =
  | "first-day-done"
  | "week-1-complete" | "week-2-complete" | "week-3-complete" | "week-4-complete"
  | "zero-mistakes" | "sharp-mind" | "flawless-five" | "zero-hero"
  | "speed-runner" | "lightning-fast" | "speed-trio"
  | "grade-a-graduate" | "grade-b-graduate"
  | "perfect-week" | "perfect-two-weeks"
  | "comeback-kid" | "iron-will" | "ten-and-done"
  | "streak-3-days" | "streak-5-days" | "streak-10-days"
  | "halfway-there"
  | "early-bird" | "night-owl" | "weekend-warrior"
  | "calendar-streak-3" | "calendar-streak-7"
  | "strand-numbers" | "strand-operations" | "strand-geometry" | "strand-advanced"
  | "exam-high-score" | "exam-ace"
  | "grand-master"
  | "hundred-answers" | "five-hundred-answers";
```

After your changes, `night-owl` must be removed. Total: **36 IDs**.

---

## Routes Available (lib/routes.ts)

```typescript
routes.gradeHome(grade)       → "/grade/a"
routes.gradeBadges(grade)     → "/grade/a/badges"
routes.gradePlan(grade)       → "/grade/a/plan"
routes.gradeDay(grade, dayId) → "/grade/a/day/day-1"
```

---

## DayScreen Architecture (important for Part 2)

`DayScreen` renders `RegularDayScreen` for all days except `day-29` (final exam).

Inside `RegularDayScreen`:
- `useProgress(dayId, { grade })` → provides `setAnswer`, `markComplete`, `percentDone`,
  `isComplete`, `wrongCount`
- `useDayAnswers({ day, grade, ... })` → manages `answers`, `correctMap`, `feedback`,
  `attempts`, `onChangeValue`, `submitExercise`, etc.
- Completion button calls `completeDay()` which calls `markComplete()` from `useProgress`
- `markComplete()` returns a boolean: `true` if actually completed, `false` if already complete
  or didn't pass gate
- After success: `setShowReward(true)` → StarReward modal → TrophyUnlock modal → navigate home

The `allExercises` array is derived from `day.sections.flatMap(s => s.exercises)`.

---

## MANDATORY PROCESS

1. Read every file you plan to modify BEFORE writing any code.
2. Make all changes described below.
3. Run `npx tsc --noEmit` at the end.
4. Fix every TypeScript error before finishing.
5. Do not add features beyond what is described. Do not refactor unrelated code.

---

# PART 1 — Remove the Night-Owl Badge

The `night-owl` badge rewards studying after 21:00. This is inappropriate for a children's
app — parents will not want their 6–8 year old earning a badge for studying late at night.
Remove it completely from all three files.

### 1a. `lib/badges/types.ts`
Remove `| "night-owl"` from the `BadgeId` union type.

### 1b. `lib/badges/definitions.ts`
Remove the entire object `{ id: "night-owl", icon: "🦉", name: "ינשוף הלילה", ... }` from the
`BADGE_DEFINITIONS` array.

### 1c. `lib/badges/engine.ts`
Remove the entire `// night-owl` comment and its associated `if` block:
```typescript
// night-owl: any completed day where completedAt hour >= 21
if (
  Object.values(progress.days).some((d) => {
    if (!d.isComplete || !d.completedAt) return false;
    return new Date(d.completedAt).getHours() >= 21;
  })
) {
  earned.push("night-owl");
}
```

---

# PART 2 — Speed Badge "Beat Your Time" Feature

## Background and Intent

The existing speed badges (`speed-runner`, `lightning-fast`, `speed-trio`) measured time from
`attempts[0].attemptedAt` to `completedAt`. This was a one-shot measurement that couldn't be
improved and could be gamed by slow initial starts.

The new design:
- Each day tracks a `bestTimeMs` — the student's personal best completion time in milliseconds.
- After completing a day, the student sees their best time and can press a button to
  **replay the day in "speed run" mode** to try to beat it.
- Speed run mode shows all exercises fresh (in-memory only, NOT persisted to progress),
  runs a live timer, and if the student answers everything correctly faster than their
  best time, it updates `bestTimeMs` in persistent storage.
- The speed badges are now awarded based on `bestTimeMs` values across completed days.

## 2a. Add `bestTimeMs` to `DayProgressState` — `lib/types/progress.ts`

Add one optional field to the `DayProgressState` interface:

```typescript
bestTimeMs?: number;  // personal best completion time in ms; undefined until first completion
```

This field is `optional` so that existing stored progress (which does not have this field)
deserialises correctly without any migration — `undefined` is the valid "not yet set" state.

## 2b. Record best time on first completion — `lib/progress/engine.ts`

Read the file first. Find the `markDayComplete` function. After the existing guard
(`if (!passesCompletionGate(...)) return state`) and before building `nextDayState`, add logic
to compute `bestTimeMs` for the **first** completion only (do not overwrite an existing best time
in this function — overwriting happens in the speed-run flow described in 2c).

Add this computation inside `markDayComplete`, in the `nextDayState` object:

```typescript
// Compute bestTimeMs for first-time completion
const now = Date.now();
const firstAttemptTime =
  dayState.attempts.length > 0
    ? new Date(dayState.attempts[0].attemptedAt).getTime()
    : now;
const elapsedMs = now - firstAttemptTime;

const nextDayState: DayProgressState = {
  ...dayState,
  isComplete: true,
  completedAt: dayState.completedAt ?? new Date().toISOString(),
  bestTimeMs: dayState.bestTimeMs === undefined ? elapsedMs : dayState.bestTimeMs,
  //           ^^^ only set on first completion; never overwrite an improved best time
};
```

## 2c. Speed-run UI in `RegularDayScreen` — `components/screens/DayScreen.tsx`

Read the full DayScreen.tsx file first. You are modifying `RegularDayScreen` only.

### New local state (add after the existing `useState` declarations)

```typescript
// Speed-run state
const [isSpeedRun, setIsSpeedRun] = useState(false);
const [speedRunStartMs, setSpeedRunStartMs] = useState<number | null>(null);
const [speedRunCorrect, setSpeedRunCorrect] = useState<Record<string, boolean>>({});
const [speedRunResult, setSpeedRunResult] = useState<{
  elapsedMs: number;
  isNewRecord: boolean;
  prevBestMs: number | null;
} | null>(null);
const [liveTimerMs, setLiveTimerMs] = useState(0);
```

### Live timer effect (add after existing `useEffect` blocks)

```typescript
useEffect(() => {
  if (!isSpeedRun || speedRunStartMs === null) return;
  const interval = setInterval(() => {
    setLiveTimerMs(Date.now() - speedRunStartMs);
  }, 1000);
  return () => clearInterval(interval);
}, [isSpeedRun, speedRunStartMs]);
```

### Helper: format milliseconds to `mm:ss` string

Add this helper function inside `RegularDayScreen` (not exported):

```typescript
function formatMs(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}
```

### Speed-run answer handler

Add this callback (use `useCallback`):

```typescript
const handleSpeedRunAnswer = useCallback(
  (exerciseId: string, isCorrect: boolean) => {
    setSpeedRunCorrect((prev) => {
      const next = { ...prev, [exerciseId]: isCorrect };
      // Check if ALL exercises are now correctly answered
      const allDone =
        allExercises.length > 0 &&
        allExercises.every((ex) => next[ex.id] === true);
      if (allDone && speedRunStartMs !== null) {
        const elapsed = Date.now() - speedRunStartMs;
        const prevBest = progress.days[dayId]?.bestTimeMs ?? null;
        const isNewRecord = prevBest === null || elapsed < prevBest;
        // Update bestTimeMs in persistent storage if improved
        if (isNewRecord) {
          // Use the existing useProgress hook's underlying save mechanism.
          // We need to update progress state directly.
          // Access saveProgressState + loadProgressState to update bestTimeMs:
          const currentProgress = loadProgressState({ grade });
          const dayProg = currentProgress.days[dayId];
          if (dayProg) {
            const updatedProgress = {
              ...currentProgress,
              days: {
                ...currentProgress.days,
                [dayId]: { ...dayProg, bestTimeMs: elapsed },
              },
              updatedAt: new Date().toISOString(),
            };
            saveProgressState(updatedProgress, { grade });
          }
        }
        setSpeedRunResult({ elapsedMs: elapsed, isNewRecord, prevBestMs: prevBest });
        setIsSpeedRun(false);
        setSpeedRunStartMs(null);
      }
      return next;
    });
  },
  [allExercises, speedRunStartMs, progress, dayId, grade],
);
```

You will need to import `loadProgressState` and `saveProgressState` from
`@/lib/progress/storage` at the top of the file if not already imported.

Also import `progress` from the `useProgress` hook — check if `useProgress` already exposes
the raw progress state. If it does not, you need an alternative approach: load progress once on
mount using a `useState` that you update manually. Add this to `RegularDayScreen`:

```typescript
// For speed-run best-time updates we need direct access to progress state
const [rawProgress, setRawProgress] = useState<WorkbookProgressState | null>(null);
useEffect(() => {
  setRawProgress(loadProgressState({ grade }));
}, [grade]);
```

Then in `handleSpeedRunAnswer`, use `rawProgress` in place of `progress` (the local raw copy),
and after saving call `setRawProgress(updatedProgress)` to keep it fresh.

### "Beat Your Time" panel

After the existing completion panel block (the three `isComplete && canComplete`, `isComplete &&
!canComplete`, and `else` branches), add a **new section** that renders when `isComplete` is
true and `!isSpeedRun` and `speedRunResult === null`:

```tsx
{isComplete && !isSpeedRun && speedRunResult === null && (
  <div className="mb-6 rounded-3xl border border-violet-200 bg-violet-50 p-5 text-center shadow-sm" dir="rtl">
    {rawProgress?.days[dayId]?.bestTimeMs !== undefined && (
      <p className="mb-2 text-sm font-semibold text-violet-700">
        ⏱️ הזמן הכי טוב שלך: <strong>{formatMs(rawProgress.days[dayId].bestTimeMs!)}</strong>
      </p>
    )}
    <button
      type="button"
      className="touch-button w-full rounded-2xl bg-violet-600 py-4 text-lg font-semibold text-white shadow-md hover:bg-violet-700 active:bg-violet-800"
      onClick={() => {
        setSpeedRunCorrect({});
        setSpeedRunResult(null);
        setSpeedRunStartMs(Date.now());
        setLiveTimerMs(0);
        setIsSpeedRun(true);
        window.scrollTo({ top: 0, behavior: "smooth" });
      }}
    >
      🏃 נסה לשפר את הזמן!
    </button>
  </div>
)}
```

### Speed-run banner

When `isSpeedRun === true`, render this banner **immediately above the first `SectionBlock`**
(wrap the sections map to conditionally prepend it):

```tsx
{isSpeedRun && (
  <div className="mb-4 rounded-2xl border border-amber-300 bg-amber-100 px-4 py-3 text-center font-bold text-amber-900" dir="rtl">
    🏃 מצב מהירות — ענה על כל השאלות מחדש!
    <span className="ml-4 font-mono text-amber-700">⏱️ {formatMs(liveTimerMs)}</span>
  </div>
)}
```

### Speed-run result panel

When `speedRunResult !== null`, render this **in place of the "Beat Your Time" panel** (i.e.,
the condition above `!isSpeedRun` also requires `speedRunResult === null`):

```tsx
{isComplete && speedRunResult !== null && (
  <div
    className={`mb-6 rounded-3xl p-5 text-center shadow-md border ${
      speedRunResult.isNewRecord
        ? "bg-emerald-50 border-emerald-300"
        : "bg-amber-50 border-amber-300"
    }`}
    dir="rtl"
  >
    {speedRunResult.isNewRecord ? (
      <>
        <p className="text-3xl mb-1">🏆</p>
        <p className="text-lg font-extrabold text-emerald-800 mb-1">שיא חדש!</p>
        <p className="text-sm font-semibold text-emerald-700">
          הזמן שלך: <strong>{formatMs(speedRunResult.elapsedMs)}</strong>
          {speedRunResult.prevBestMs !== null && (
            <span className="text-emerald-600"> (שיפרת מ-{formatMs(speedRunResult.prevBestMs)})</span>
          )}
        </p>
      </>
    ) : (
      <>
        <p className="text-3xl mb-1">😊</p>
        <p className="text-lg font-extrabold text-amber-800 mb-1">ניסיון טוב!</p>
        <p className="text-sm font-semibold text-amber-700">
          הזמן שלך: <strong>{formatMs(speedRunResult.elapsedMs)}</strong>
          {speedRunResult.prevBestMs !== null && (
            <span> (השיא הוא: {formatMs(speedRunResult.prevBestMs)})</span>
          )}
        </p>
      </>
    )}
    <div className="mt-4 flex gap-3 justify-center">
      <button
        type="button"
        className="touch-button rounded-2xl border border-violet-300 bg-white px-5 py-3 text-sm font-semibold text-violet-700"
        onClick={() => {
          setSpeedRunCorrect({});
          setSpeedRunResult(null);
          setSpeedRunStartMs(Date.now());
          setLiveTimerMs(0);
          setIsSpeedRun(true);
          window.scrollTo({ top: 0, behavior: "smooth" });
        }}
      >
        🔄 נסה שוב
      </button>
      <button
        type="button"
        className="touch-button rounded-2xl bg-violet-600 px-5 py-3 text-sm font-semibold text-white"
        onClick={() => router.push(routes.gradeHome(grade, { previewAll }))}
      >
        🏠 חזרה לבית
      </button>
    </div>
  </div>
)}
```

### Speed-run exercise rendering

When `isSpeedRun === true`, the `ExerciseItem` components need to use **local speed-run answer
state** instead of persisted progress answers. Pass two extra props to `ExerciseItem`:
- `speedRunMode: boolean` — when true, show fresh empty answer field
- `onSpeedRunSubmit?: (exerciseId: string, isCorrect: boolean) => void`

**IMPORTANT:** Before modifying `ExerciseItem`, read it. If adding new props would require
large changes throughout, a simpler alternative is: in `RegularDayScreen`, when `isSpeedRun`
is true, pass `value=""` and `isCorrect={undefined}` and `wasChecked={false}` to every
`ExerciseItem`, and add an `onSubmitExercise` override that calls `handleSpeedRunAnswer`
instead of the normal `submitExercise`.

Implement the simpler approach: modify the `ExerciseItem` rendering block as follows:

```tsx
{section.exercises.map((exercise) => (
  <ExerciseItem
    screenRootTestId={testIds.screen.day.root(grade, dayId)}
    key={exercise.id}
    exercise={exercise}
    value={isSpeedRun ? (speedRunCorrect[exercise.id] !== undefined ? String(speedRunCorrect[exercise.id]) : "") : (answers[exercise.id] ?? "")}
    retryMessage={isSpeedRun ? undefined : feedback[exercise.id]}
    isCorrect={isSpeedRun ? (speedRunCorrect[exercise.id] === true ? true : undefined) : correctMap[exercise.id]}
    wasChecked={isSpeedRun ? (speedRunCorrect[exercise.id] !== undefined) : (attempts[exercise.id] ?? 0) > 0}
    setFocusRef={setFocusRef}
    wrongAttempts={isSpeedRun ? 0 : (wrongAttempts[exercise.id] ?? 0)}
    hintUsed={isSpeedRun ? false : (hintUsed[exercise.id] ?? false)}
    onRevealHint={isSpeedRun ? () => {} : onRevealHint}
    onChangeValue={isSpeedRun ? () => {} : onChangeValue}
    onSubmitExercise={isSpeedRun
      ? (exerciseId, answer, isCorrect) => handleSpeedRunAnswer(exerciseId, isCorrect)
      : submitExercise}
    onNextInput={focusNextInput}
    onRetryExercise={isSpeedRun ? () => {} : onRetryExercise}
  />
))}
```

Note: `onSubmitExercise`'s signature in ExerciseItem may vary — read the component to confirm
the exact signature, and adjust the lambda accordingly.

## 2d. Update badge evaluation — `lib/badges/engine.ts`

Replace the existing speed badge evaluation blocks with logic based on `bestTimeMs`.
Find and replace these three blocks entirely:

```typescript
// REMOVE THIS (old speed-runner / speed-trio block):
const fastDays = Object.values(progress.days).filter((d) => {
  if (!d.isComplete) return false;
  if (!d.completedAt) return false;
  if (!d.attempts || d.attempts.length === 0) return false;
  const elapsed = new Date(d.completedAt).getTime() - new Date(d.attempts[0].attemptedAt).getTime();
  return elapsed < 300_000;
});
if (fastDays.length >= 1) earned.push("speed-runner");
if (fastDays.length >= 3) earned.push("speed-trio");

// REMOVE THIS (old lightning-fast block):
const lightningDays = Object.values(progress.days).filter((d) => {
  if (!d.isComplete) return false;
  if (!d.completedAt) return false;
  if (!d.attempts || d.attempts.length === 0) return false;
  const elapsed = new Date(d.completedAt).getTime() - new Date(d.attempts[0].attemptedAt).getTime();
  return elapsed < 180_000;
});
if (lightningDays.length >= 1) earned.push("lightning-fast");
```

Replace with:

```typescript
// speed-runner / speed-trio: bestTimeMs < 5 minutes (300,000 ms)
const fastDays = Object.values(progress.days).filter(
  (d) => d.isComplete === true && d.bestTimeMs !== undefined && d.bestTimeMs < 300_000,
);
if (fastDays.length >= 1) earned.push("speed-runner");
if (fastDays.length >= 3) earned.push("speed-trio");

// lightning-fast: bestTimeMs < 3 minutes (180,000 ms)
const lightningDays = Object.values(progress.days).filter(
  (d) => d.isComplete === true && d.bestTimeMs !== undefined && d.bestTimeMs < 180_000,
);
if (lightningDays.length >= 1) earned.push("lightning-fast");
```

---

# PART 3 — Fix Duplicate Emoji Icons

Several badges share identical emoji icons, making them visually indistinguishable in the grid.
In `lib/badges/definitions.ts`, change only the `icon` field of these specific badge IDs:

| Badge `id`            | Current icon | New icon |
|-----------------------|-------------|----------|
| `calendar-streak-3`   | `"🔥"`      | `"📆"`   |
| `calendar-streak-7`   | `"🔥"`      | `"🗓️"`  |
| `perfect-two-weeks`   | `"👑"`      | `"💫"`   |
| `grade-b-graduate`    | `"🎓"`      | `"🏫"`   |

Do not change any other fields. Do not change `streak-3-days` (keeps 🔥), `perfect-week`
(keeps 👑), or `grade-a-graduate` (keeps 🎓).

---

# PART 4 — Badge Rarity Tiers

## 4a. Add `BadgeTier` type and `tier` field — `lib/badges/types.ts`

Add a new exported type:
```typescript
export type BadgeTier = "bronze" | "silver" | "gold" | "platinum";
```

Add `tier: BadgeTier` as a required field to `BadgeDefinition`:
```typescript
export interface BadgeDefinition {
  id: BadgeId;
  name: string;
  description: string;
  icon: string;
  tier: BadgeTier;
}
```

## 4b. Add `tier` to every entry — `lib/badges/definitions.ts`

Every object in `BADGE_DEFINITIONS` must have a `tier` field. Apply this mapping:

**`"bronze"`** (easy, first-time achievements):
`first-day-done`, `week-1-complete`, `week-2-complete`, `week-3-complete`, `week-4-complete`,
`streak-3-days`, `streak-5-days`, `halfway-there`, `zero-mistakes`, `speed-runner`,
`comeback-kid`, `early-bird`, `weekend-warrior`, `calendar-streak-3`, `hundred-answers`

**`"silver"`** (requires consistent effort):
`streak-10-days`, `sharp-mind`, `lightning-fast`, `speed-trio`, `iron-will`, `ten-and-done`,
`perfect-week`, `calendar-streak-7`, `strand-numbers`, `strand-operations`,
`strand-geometry`, `strand-advanced`, `exam-high-score`, `five-hundred-answers`

**`"gold"`** (hard, near-complete curriculum):
`flawless-five`, `perfect-two-weeks`, `grade-a-graduate`, `grade-b-graduate`, `exam-ace`,
`zero-hero`

**`"platinum"`** (prestige, near-impossible):
`grand-master`

---

# PART 5 — Fix `five-hundred-answers` Threshold

Grade A has ~28 active days, averaging ~15 questions each ≈ 420 total answers. The badge
threshold of 500 is unreachable within a single grade.

### `lib/badges/engine.ts`
Change the `five-hundred-answers` threshold from `500` to `400`:
```typescript
if (totalAnswers >= 400) earned.push("five-hundred-answers");
```

### `lib/badges/definitions.ts`
Update the `five-hundred-answers` entry:
- `name`: change to `"ארבע מאות תשובות"`
- `description`: change to `'ענית על 400 שאלות בסה"כ'`
- Do NOT rename the `id` — changing the ID would break all existing stored badge states.

---

# PART 6 — Fix Perseverance Badge Gaming

Currently `comeback-kid` and `iron-will` are earned by completing a day with 5+ wrong answers.
A child could deliberately answer wrong to earn these badges. Adding a minimum attempts guard
ensures the student genuinely engaged with many questions.

In `lib/badges/engine.ts`, replace the `toughDays` filter:

**Current:**
```typescript
const toughDays = Object.values(progress.days).filter(
  (d) => d.isComplete === true && d.wrongCount >= 5,
);
```

**Replace with:**
```typescript
const toughDays = Object.values(progress.days).filter(
  (d) => d.isComplete === true && d.wrongCount >= 5 && d.attempts.length >= 10,
);
```

Also update `ten-and-done`. Find:
```typescript
if (Object.values(progress.days).some((d) => d.isComplete === true && d.wrongCount >= 10)) {
```

Replace with:
```typescript
if (Object.values(progress.days).some(
  (d) => d.isComplete === true && d.wrongCount >= 10 && d.attempts.length >= 15,
)) {
```

---

# PART 7 — BadgeGalleryScreen Overhaul

Read `components/screens/BadgeGalleryScreen.tsx` fully before making any change.

This is the most extensive UI change. Apply every sub-item below.

## 7a. New imports and types needed at the top of the file

Add these imports (check if any are already present):
```typescript
import type { BadgeTier } from "@/lib/badges/types";
import { BADGE_DEFINITIONS } from "@/lib/badges/definitions";
```

## 7b. BADGE_CATEGORIES constant (add inside the file, not exported)

This defines the display order and grouping for the gallery:

```typescript
const BADGE_CATEGORIES: { label: string; ids: BadgeId[] }[] = [
  {
    label: "📈 התקדמות",
    ids: ["first-day-done", "halfway-there", "streak-3-days", "streak-5-days", "streak-10-days"],
  },
  {
    label: "📅 שבועות",
    ids: ["week-1-complete", "week-2-complete", "week-3-complete", "week-4-complete"],
  },
  {
    label: "🎯 דיוק",
    ids: [
      "zero-mistakes", "sharp-mind", "flawless-five", "zero-hero",
      "perfect-week", "perfect-two-weeks",
    ],
  },
  {
    label: "⚡ מהירות",
    ids: ["speed-runner", "lightning-fast", "speed-trio"],
  },
  {
    label: "💪 התמדה",
    ids: ["comeback-kid", "iron-will", "ten-and-done"],
  },
  {
    label: "⏰ תזמון",
    ids: ["early-bird", "weekend-warrior"],
  },
  {
    label: "🗓️ ימים רצופים",
    ids: ["calendar-streak-3", "calendar-streak-7"],
  },
  {
    label: "📚 תחומי לימוד",
    ids: ["strand-numbers", "strand-operations", "strand-geometry", "strand-advanced"],
  },
  {
    label: "📝 מבחן",
    ids: ["exam-high-score", "exam-ace"],
  },
  {
    label: "💬 מאמץ",
    ids: ["hundred-answers", "five-hundred-answers"],
  },
  {
    label: "🏆 מצטיין",
    ids: ["grand-master", "grade-a-graduate", "grade-b-graduate"],
  },
];
```

## 7c. Helper functions (add inside the file, not exported)

```typescript
function formatUnlockDate(iso: string): string {
  const date = new Date(iso);
  const diffDays = Math.floor((Date.now() - date.getTime()) / 86_400_000);
  if (diffDays === 0) return "היום";
  if (diffDays === 1) return "אתמול";
  if (diffDays < 7) return `לפני ${diffDays} ימים`;
  return date.toLocaleDateString("he-IL");
}

const TIER_BORDER: Record<BadgeTier, string> = {
  bronze:   "border-amber-300",
  silver:   "border-slate-400",
  gold:     "border-yellow-400",
  platinum: "border-purple-500",
};

const TIER_BG: Record<BadgeTier, string> = {
  bronze:   "bg-amber-50",
  silver:   "bg-slate-50",
  gold:     "bg-yellow-50",
  platinum: "bg-purple-50",
};

const TIER_LABEL: Record<BadgeTier, string> = {
  bronze:   "ברונזה",
  silver:   "כסף",
  gold:     "זהב",
  platinum: "פלטינה",
};
```

## 7d. New state (add after the existing `useState` declarations)

```typescript
const [openTooltipId, setOpenTooltipId] = useState<BadgeId | null>(null);
```

## 7e. Click-outside tooltip handler (add after existing `useEffect` blocks)

```typescript
useEffect(() => {
  const close = () => setOpenTooltipId(null);
  document.addEventListener("click", close);
  return () => document.removeEventListener("click", close);
}, []);
```

## 7f. Compute derived values (add after `const unlockedAtMap = ...`)

```typescript
// Badges unlocked within the last 24 hours get a glow animation
const recentlyUnlockedIds = new Set(
  badgeState.unlocked
    .filter((u) => Date.now() - new Date(u.unlockedAt).getTime() < 86_400_000)
    .map((u) => u.id),
);

// Build a lookup from id → BadgeDefinition for fast access
const badgeById = Object.fromEntries(allBadges.map((b) => [b.id, b]));
```

## 7g. Replace the JSX render output

Replace the existing `return (...)` JSX completely with the following structure.
Keep the outer `<main>` and nav/title elements, but replace the badge grid and everything
below the title.

Full structure:

```tsx
return (
  <main data-testid={badgesRoot}>
    {/* Navigation */}
    <div data-testid={childTid(badgesRoot, "nav")} className="mb-4">
      <AppNavLink href={routes.gradeHome(grade)}>חֲזָרָה לַחוֹבֶרֶת</AppNavLink>
    </div>

    {/* Title */}
    <h1
      data-testid={childTid(badgesRoot, "title")}
      className="mb-4 text-2xl font-extrabold text-purple-800"
    >
      🏆 הַפְּרָסִים שֶׁלִּי
    </h1>

    {/* Empty state — shown only when nothing is unlocked yet */}
    {badgeState.unlocked.length === 0 && (
      <div
        className="mb-6 rounded-2xl border border-amber-200 bg-amber-50 p-6 text-center"
        dir="rtl"
      >
        <div className="mb-2 text-4xl">🌟</div>
        <div className="mb-1 text-base font-bold text-amber-800">הפרסים מחכים לך!</div>
        <div className="text-sm text-amber-600">
          השלם ימים והצלח בתרגילים כדי לאסוף פרסים
        </div>
      </div>
    )}

    {/* Progress counter */}
    <div
      className="mb-6 flex items-center justify-between rounded-xl bg-purple-50 px-4 py-2 text-sm font-semibold text-purple-700"
      dir="rtl"
    >
      <span>🏅 הפרסים שלי</span>
      <span>
        {badgeState.unlocked.length} / {allBadges.length}
      </span>
    </div>

    {/* Grouped badge sections */}
    {BADGE_CATEGORIES.map((cat) => {
      // Filter to badges that exist in allBadges (guards against missing IDs after removals)
      const catBadges = cat.ids
        .map((id) => badgeById[id])
        .filter((b): b is BadgeDefinition => b !== undefined);
      if (catBadges.length === 0) return null;

      return (
        <section key={cat.label} className="mb-8" dir="rtl">
          <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-slate-500">
            {cat.label}
          </h2>
          <div
            data-testid={childTid(badgesRoot, "grid")}
            className="grid grid-cols-1 gap-4 sm:grid-cols-2"
          >
            {catBadges.map((badge) => {
              const isUnlocked = unlockedIds.has(badge.id);
              const unlockedAt = unlockedAtMap[badge.id];
              const cardTid = testIds.screen.badges.badgeCard(badge.id);
              const isRecentlyUnlocked = recentlyUnlockedIds.has(badge.id);
              const isTooltipOpen = openTooltipId === badge.id;

              return (
                <div
                  key={badge.id}
                  data-testid={cardTid}
                  className={[
                    "group relative rounded-2xl border p-4 text-center shadow-sm transition-all cursor-pointer",
                    isUnlocked
                      ? `${TIER_BORDER[badge.tier]} ${TIER_BG[badge.tier]}`
                      : `${TIER_BORDER[badge.tier]} ${TIER_BG[badge.tier]} opacity-50 grayscale`,
                    isRecentlyUnlocked ? "badge-new-glow" : "",
                  ]
                    .filter(Boolean)
                    .join(" ")}
                  onClick={(e) => {
                    e.stopPropagation();
                    setOpenTooltipId((prev) =>
                      prev === badge.id ? null : badge.id,
                    );
                  }}
                >
                  {/* Tier label */}
                  <span className="absolute right-2 top-2 text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                    {TIER_LABEL[badge.tier]}
                  </span>

                  {/* Hover / tap tooltip */}
                  <div
                    className={[
                      "pointer-events-none absolute bottom-full left-1/2 z-10 mb-2 w-48",
                      "-translate-x-1/2 rounded-xl bg-slate-800 px-3 py-2 text-center",
                      "text-xs leading-snug text-white shadow-lg transition-opacity duration-150",
                      isTooltipOpen ? "opacity-100" : "opacity-0 group-hover:opacity-100",
                    ].join(" ")}
                    dir="rtl"
                  >
                    {badge.description}
                    <div className="absolute left-1/2 top-full -translate-x-1/2 border-4 border-transparent border-t-slate-800" />
                  </div>

                  {/* Icon with lock overlay */}
                  <div
                    data-testid={childTid(cardTid, "icon")}
                    className="relative mb-2 inline-block"
                  >
                    <span className="text-4xl">{badge.icon}</span>
                    {!isUnlocked && (
                      <span className="absolute -bottom-1 -right-1 text-base">🔒</span>
                    )}
                  </div>

                  {/* Badge name */}
                  <div
                    data-testid={childTid(cardTid, "name")}
                    className="mb-1 text-sm font-bold text-slate-800"
                  >
                    {badge.name}
                  </div>

                  {/* Unlocked: show relative date + description */}
                  {isUnlocked && unlockedAt ? (
                    <>
                      <div
                        data-testid={childTid(cardTid, "unlockedAt")}
                        className="text-xs text-emerald-600"
                      >
                        {formatUnlockDate(unlockedAt)}
                      </div>
                      <div
                        className="mt-1 text-xs leading-snug text-slate-500"
                        dir="rtl"
                      >
                        {badge.description}
                      </div>
                    </>
                  ) : (
                    /* Locked: show description as hint */
                    <div
                      data-testid={childTid(cardTid, "lockedHint")}
                      className="text-xs text-slate-600"
                    >
                      {badge.description}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      );
    })}

    <TrophyUnlock
      visible={showTrophy}
      newBadgeIds={newlyUnlockedIds}
      onConfirm={() => {
        markAllSeen();
        setShowTrophy(false);
        logEvent("badges_viewed", {
          payload: { grade, unlockedCount: badgeState.unlocked.length },
        });
      }}
    />
  </main>
);
```

**Note on `BadgeDefinition` import:** The map `catBadges.map(id => badgeById[id])` returns
`BadgeDefinition | undefined`. The filter `(b): b is BadgeDefinition => b !== undefined`
narrows the type. TypeScript may need the explicit type guard — ensure it compiles.

## 7h. Add `badge-new-glow` animation to `app/globals.css`

Add these lines anywhere in `globals.css` (after the existing keyframes):

```css
@keyframes badge-glow {
  0%   { box-shadow: 0 0 0 0 rgba(251, 191, 36, 0.7); }
  70%  { box-shadow: 0 0 0 10px rgba(251, 191, 36, 0); }
  100% { box-shadow: 0 0 0 0 rgba(251, 191, 36, 0); }
}
.badge-new-glow {
  animation: badge-glow 1.2s ease-out 2;
}
```

---

# PART 8 — "Next Badge" Goal Widget on HomeScreen

Read `components/screens/HomeScreen.tsx` fully before modifying it.

## 8a. Add BADGE_CATEGORY_ORDER constant (inside HomeScreen.tsx, not exported)

This is the same ID order as BADGE_CATEGORIES in the gallery — used to find the first
locked badge the student might earn next:

```typescript
const BADGE_CATEGORY_ORDER: BadgeId[] = [
  "first-day-done", "halfway-there", "streak-3-days", "streak-5-days", "streak-10-days",
  "week-1-complete", "week-2-complete", "week-3-complete", "week-4-complete",
  "zero-mistakes", "sharp-mind", "flawless-five", "zero-hero",
  "perfect-week", "perfect-two-weeks",
  "speed-runner", "lightning-fast", "speed-trio",
  "comeback-kid", "iron-will", "ten-and-done",
  "early-bird", "weekend-warrior",
  "calendar-streak-3", "calendar-streak-7",
  "strand-numbers", "strand-operations", "strand-geometry", "strand-advanced",
  "exam-high-score", "exam-ace",
  "hundred-answers", "five-hundred-answers",
  "grand-master", "grade-a-graduate", "grade-b-graduate",
];
```

## 8b. Import BadgeId and BADGE_DEFINITIONS_MAP

At the top of `HomeScreen.tsx`, add:
```typescript
import type { BadgeId } from "@/lib/badges/types";
import { BADGE_DEFINITIONS_MAP } from "@/lib/badges/definitions";
```

Check if they are already imported — do not duplicate imports.

## 8c. Compute nextBadge from existing `useBadges` data

The hook `useBadges(effectiveGrade)` is already called in HomeScreen and returns
`{ newlyUnlockedIds, markAllSeen, badgeState, allBadges }`. Use this data.

Add these lines after the `useBadges` call:

```typescript
const unlockedBadgeIdSet = new Set(badgeState.unlocked.map((u) => u.id));
const nextBadge = BADGE_CATEGORY_ORDER
  .map((id) => BADGE_DEFINITIONS_MAP[id])
  .find((def) => def !== undefined && !unlockedBadgeIdSet.has(def.id)) ?? null;
```

## 8d. Render the widget

Find the location in the JSX where the week grid starts (look for the `workbookDaysList` map
or the first week section). Add the widget **immediately above** the week grid, after the
`HeroHeader` component (or after the trophy modal if it comes first).

```tsx
{nextBadge && !showTrophy && (
  <div
    className="mb-6 flex items-center gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3"
    dir="rtl"
  >
    <span className="text-3xl">{nextBadge.icon}</span>
    <div className="min-w-0 flex-1">
      <div className="text-xs font-semibold text-amber-700">הפרס הבא שאפשר להשיג:</div>
      <div className="truncate text-sm font-bold text-amber-900">{nextBadge.name}</div>
      <div className="truncate text-xs text-amber-700">{nextBadge.description}</div>
    </div>
    <a
      href={routes.gradeBadges(effectiveGrade)}
      className="shrink-0 text-xs font-semibold text-violet-600 hover:underline"
    >
      כל הפרסים ←
    </a>
  </div>
)}
```

Use `<a href=...>` instead of a Next.js `<Link>` only if importing `Link` would conflict;
otherwise use `<Link href={routes.gradeBadges(effectiveGrade)}>כל הפרסים ←</Link>`.
`Link` is already imported at the top of HomeScreen — use it.

---

# PART 9 — Document Streak System Separation

Do NOT attempt to merge the two streak systems. They measure different things:
- `lib/streak/engine.ts` tracks "opened the app on consecutive calendar days"
- `lib/badges/engine.ts` `calendar-streak-*` tracks "completed at least one day on consecutive dates"

Add this comment block at the top of the calendar-streak section in `lib/badges/engine.ts`
(immediately before `const completedDateSet = ...`):

```typescript
// NOTE: This calendar-streak logic is separate from lib/streak/engine.ts.
// lib/streak tracks "app opened on consecutive days" (for StreakBadge on HomeScreen).
// These badges track "at least one day completed on consecutive calendar dates".
// They intentionally differ and must NOT be merged without a data migration plan.
```

---

# FINAL VERIFICATION CHECKLIST

After all changes are complete, verify:

1. **`npx tsc --noEmit` produces zero errors.**

2. **Badge count consistency:**
   - Count members of `BadgeId` union in `lib/badges/types.ts` → must be **36**
     (37 original minus `night-owl`)
   - Count entries in `BADGE_DEFINITIONS` array → must be **36**
   - Every `BadgeId` value must have an evaluation branch in `evaluateBadges()`
   - `night-owl` must not appear anywhere in `types.ts`, `definitions.ts`, or `engine.ts`

3. **Tier field completeness:**
   - Every entry in `BADGE_DEFINITIONS` must have a `tier` field
   - No entry may have `tier: undefined`

4. **BADGE_CATEGORIES coverage:**
   - Every ID in every `BADGE_CATEGORIES` entry must exist in `BadgeId`
   - (The removed `night-owl` must not appear in `BADGE_CATEGORIES`)

5. **Speed-run safety:**
   - Speed-run answers must NOT be written to the persistent progress state's `answers`,
     `correctAnswers`, `wrongCount`, or `attempts` fields
   - Only `bestTimeMs` is updated from the speed-run flow

6. **`five-hundred-answers` ID unchanged:**
   - The `id` field must still be `"five-hundred-answers"` — only `name` and `description` changed

7. **`bestTimeMs` backward compatibility:**
   - `bestTimeMs` is declared `optional` (`?`) in `DayProgressState`
   - `sanitizeState()` in `lib/progress/storage.ts` uses `withDefaultsForDayState()` —
     check that it does NOT break when `bestTimeMs` is absent (it should spread the object,
     so an absent optional field is fine — verify this)

8. **No regressions in existing tests** (if a test runner is available):
   - Run `npm test` or `npx jest` if tests exist and fix any failures caused by your changes
