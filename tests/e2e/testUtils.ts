import type { Page } from "@playwright/test";
import { testIds } from "@/lib/testIds";
import type { GradeId } from "@/lib/grades";
import type { DayId, DayProgressState, Exercise, ExerciseId, WorkbookDay, WorkbookProgressState } from "@/lib/types";
import { getWorkbookDaysById } from "@/lib/content/workbook";
import { pickFinalExamExerciseIds } from "@/lib/final-exam/picker";
import { FINAL_EXAM_QUESTION_COUNT } from "@/lib/final-exam/config";
import type { FinalExamStateV1 } from "@/lib/final-exam/types";
import type { BadgeState } from "@/lib/badges/types";

const PROGRESS_KEY_PREFIX = "kids_math.workbook_progress.v2.grade.";
const FINAL_EXAM_KEY_PREFIX = "kids_math.final_exam.v1.grade.";
const BADGE_KEY_PREFIX = "kids_math.badges.v1.grade.";

function progressKeyForGrade(grade: GradeId): string {
  return `${PROGRESS_KEY_PREFIX}${grade}`;
}

function finalExamKeyForGrade(grade: GradeId): string {
  return `${FINAL_EXAM_KEY_PREFIX}${grade}`;
}

function badgeKeyForGrade(grade: GradeId): string {
  return `${BADGE_KEY_PREFIX}${grade}`;
}

export async function seedLocalStorage(page: Page, entries: Record<string, unknown>): Promise<void> {
  // Use page.evaluate (not page.addInitScript) so localStorage is set immediately and
  // is NOT re-applied on subsequent page.goto / page.reload calls.
  // addInitScript would reset localStorage on every navigation, breaking tests that
  // navigate internally (e.g. answerDayCorrectly iterating through section URLs).
  await page.evaluate((payload) => {
    for (const [k, v] of Object.entries(payload)) {
      window.localStorage.setItem(k, JSON.stringify(v));
    }
  }, entries);
}

export function createCompletedDayProgressState(dayId: DayId): DayProgressState {
  return {
    dayId,
    answers: {},
    correctAnswers: {},
    wrongCount: 0,
    attempts: [],
    percentDone: 100,
    isComplete: true,
    completedAt: new Date().toISOString(),
  };
}

/**
 * Creates a progress state where every exercise in the day is marked correct
 * (so DayOverviewScreen sees allSectionsComplete = true and shows the completeCta).
 * isComplete defaults to false so the CTA can still be clicked to mark the day done.
 */
export function createFullyAnsweredDayProgressState(
  dayId: DayId,
  grade: GradeId,
  opts?: { isComplete?: boolean },
): DayProgressState {
  const workbookDays = getWorkbookDaysById(grade) as Record<string, WorkbookDay>;
  const day = workbookDays[dayId];
  const correctAnswers: Record<ExerciseId, boolean> = {} as Record<ExerciseId, boolean>;
  if (day) {
    for (const section of day.sections) {
      for (const ex of section.exercises) {
        correctAnswers[ex.id] = true;
      }
    }
  }
  const isComplete = opts?.isComplete ?? false;
  return {
    dayId,
    answers: {},
    correctAnswers,
    wrongCount: 0,
    attempts: [],
    percentDone: 100,
    isComplete,
    ...(isComplete ? { completedAt: new Date().toISOString() } : {}),
  };
}

export function createProgressState(params: { days?: Record<DayId, DayProgressState> }): WorkbookProgressState {
  return {
    version: 1,
    days: params.days ?? {},
    updatedAt: new Date().toISOString(),
  };
}

export async function seedProgressState(page: Page, grade: GradeId, state: WorkbookProgressState): Promise<void> {
  await seedLocalStorage(page, { [progressKeyForGrade(grade)]: state });
}

export function exerciseByIdForGrade(grade: GradeId): Map<ExerciseId, Exercise> {
  const byDay = getWorkbookDaysById(grade);
  const map = new Map<ExerciseId, Exercise>();
  for (const day of Object.values(byDay) as WorkbookDay[]) {
    for (const section of day.sections) {
      for (const ex of section.exercises) {
        map.set(ex.id, ex);
      }
    }
  }
  return map;
}

function toAnswerString(ex: Exercise, mode: "correct" | "wrong"): string {
  const correct = (() => {
    switch (ex.kind) {
      case "number_input":
      case "number_line_jump":
        return String(ex.answer);
      case "multiple_choice":
        return ex.answer;
      case "true_false":
        return ex.answer ? "true" : "false";
      case "shape_choice":
        return ex.answer;
      default: {
        const _never: never = ex;
        return _never;
      }
    }
  })();

  if (mode === "correct") return correct;

  // Wrong-but-non-empty answer, stable across kinds.
  switch (ex.kind) {
    case "number_input":
    case "number_line_jump":
      return String(Number(ex.answer) + 1);
    case "multiple_choice": {
      const firstDifferent = ex.options.find((o) => o !== ex.answer);
      return firstDifferent ?? `${ex.answer}x`;
    }
    case "true_false":
      return ex.answer ? "false" : "true";
    case "shape_choice": {
      const firstDifferent = ex.options.find((o) => o !== ex.answer);
      return firstDifferent ?? "circle";
    }
    default: {
      const _never: never = ex;
      return _never;
    }
  }
}

export function createFinalExamState(params: {
  grade: GradeId;
  seed: string;
  pickerVersion?: 1;
  answerMode: "pass" | "fail";
}): FinalExamStateV1 {
  const pickerVersion = params.pickerVersion ?? 1;
  const selectedExerciseIds = pickFinalExamExerciseIds({
    seed: params.seed,
    pickerVersion,
    count: FINAL_EXAM_QUESTION_COUNT,
    grade: params.grade,
  });

  const byId = exerciseByIdForGrade(params.grade);
  const answers: Record<ExerciseId, string> = {} as Record<ExerciseId, string>;
  const correctMap: Record<ExerciseId, boolean> = {} as Record<ExerciseId, boolean>;
  const attempts: Record<ExerciseId, number> = {} as Record<ExerciseId, number>;

  // To fail deterministically, answer 6 wrong out of 30 → 80% (<85%).
  const wrongTarget = params.answerMode === "fail" ? 6 : 0;
  let wrongSoFar = 0;

  for (const id of selectedExerciseIds) {
    const ex = byId.get(id);
    if (!ex) continue;
    const shouldBeWrong = wrongSoFar < wrongTarget;
    const value = toAnswerString(ex, shouldBeWrong ? "wrong" : "correct");
    answers[id] = value;
    attempts[id] = 1;
    correctMap[id] = !shouldBeWrong;
    if (shouldBeWrong) wrongSoFar += 1;
  }

  return {
    version: 1,
    grade: params.grade,
    createdAt: new Date().toISOString(),
    pickerVersion: 1,
    selectedExerciseIds,
    answers,
    correctMap,
    attempts,
  };
}

export async function seedFinalExamState(page: Page, grade: GradeId, state: FinalExamStateV1): Promise<void> {
  await seedLocalStorage(page, { [finalExamKeyForGrade(grade)]: state });
}

export async function seedBadgeState(page: Page, grade: GradeId, state: BadgeState): Promise<void> {
  await seedLocalStorage(page, { [badgeKeyForGrade(grade)]: state });
}

/**
 * After confirming the star reward on day completion, a trophy modal may appear when new badges unlock.
 * Dismiss it so navigation to the grade home can finish (see DayScreen StarReward / TrophyUnlock).
 */
export async function dismissDayCompletionCelebration(page: Page): Promise<void> {
  const trophyConfirm = page.getByTestId(testIds.component.trophyUnlock.confirm());
  try {
    await trophyConfirm.waitFor({ state: "visible", timeout: 3000 });
    await trophyConfirm.click();
  } catch {
    // No trophy step; grade home navigation already happened from star confirm alone.
  }
}

