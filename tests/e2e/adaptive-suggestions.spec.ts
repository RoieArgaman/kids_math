import { expect, test } from "@playwright/test";
import { getWorkbookDaysById } from "@/lib/content/workbook";
import { routes } from "@/lib/routes";
import { childTid, testIds } from "@/lib/testIds";
import type { DayProgressState, ExerciseId, WorkbookDay } from "@/lib/types";
import { createProgressState, seedProgressState } from "./testUtils";

/**
 * Adaptive "weak-spot" suggestions on the day overview. When a day is complete but the
 * learner got an exercise wrong (never corrected), the overview surfaces a practice
 * panel linking back to those exercises. Seeded via progress state so no full playthrough
 * is needed. (The MetacognitionToast is a controlled component covered by unit tests.)
 */

const GRADE = "a";
const DAY = "day-1";

test.beforeEach(async ({ page, context }) => {
  await context.clearCookies();
  await page.goto("/");
  await page.evaluate(() => window.localStorage.clear());
});

test("a completed day with a wrong exercise shows the weak-spot practice panel", async ({ page }) => {
  const day = (getWorkbookDaysById(GRADE) as Record<string, WorkbookDay>)[DAY];
  const exercises = day.sections.flatMap((s) => s.exercises);
  const weakEx = exercises[0];

  // Complete the day, but mark the first exercise wrong (never corrected) and the rest correct.
  const correctAnswers: Record<ExerciseId, boolean> = {} as Record<ExerciseId, boolean>;
  for (const ex of exercises) correctAnswers[ex.id] = true;
  correctAnswers[weakEx.id] = false;

  const dayState: DayProgressState = {
    dayId: DAY,
    answers: {},
    correctAnswers,
    wrongCount: 1,
    wrongBySection: {},
    attempts: [],
    percentDone: 100,
    isComplete: true,
    completedAt: new Date().toISOString(),
  };
  await seedProgressState(page, GRADE, createProgressState({ days: { [DAY]: dayState } }));

  await page.goto(routes.gradeDay(GRADE, DAY));

  const panel = page.getByTestId(testIds.screen.dayOverview.weakSpotPanel(GRADE, DAY));
  await expect(panel).toBeVisible();
  await expect(page.getByTestId(childTid(testIds.screen.dayOverview.weakSpotPanel(GRADE, DAY), "list"))).toBeVisible();

  // The weak exercise is listed and links back into its section.
  const weakLink = page.getByTestId(testIds.screen.dayOverview.weakSpotExercise(GRADE, DAY, weakEx.id));
  await expect(weakLink).toBeVisible();
  await weakLink.click();
  await expect(page).toHaveURL(new RegExp(`/grade/${GRADE}/day/${DAY}/section/`));
});

test("a completed day with no wrong exercises shows NO weak-spot panel", async ({ page }) => {
  const day = (getWorkbookDaysById(GRADE) as Record<string, WorkbookDay>)[DAY];
  const exercises = day.sections.flatMap((s) => s.exercises);

  const correctAnswers: Record<ExerciseId, boolean> = {} as Record<ExerciseId, boolean>;
  for (const ex of exercises) correctAnswers[ex.id] = true;

  const dayState: DayProgressState = {
    dayId: DAY,
    answers: {},
    correctAnswers,
    wrongCount: 0,
    wrongBySection: {},
    attempts: [],
    percentDone: 100,
    isComplete: true,
    completedAt: new Date().toISOString(),
  };
  await seedProgressState(page, GRADE, createProgressState({ days: { [DAY]: dayState } }));

  await page.goto(routes.gradeDay(GRADE, DAY));
  await expect(page.getByTestId(testIds.screen.dayOverview.root(GRADE, DAY))).toBeVisible();
  await expect(page.getByTestId(testIds.screen.dayOverview.weakSpotPanel(GRADE, DAY))).toHaveCount(0);
});
