import { expect, test } from "@playwright/test";
import {
  createCompletedDayProgressState,
  createFinalExamState,
  createProgressState,
  exerciseByIdForGrade,
  seedFinalExamState,
  seedProgressState,
} from "./testUtils";
import { testIds } from "../../lib/testIds";

function getCookieUrl() {
  return process.env.PLAYWRIGHT_COOKIE_URL ?? process.env.PLAYWRIGHT_BASE_URL ?? "http://127.0.0.1:3005";
}

test.beforeEach(async ({ page, context }) => {
  await context.clearCookies();
  await page.goto("/");
  await page.evaluate(() => window.localStorage.clear());

  // Ensure grade B routes are accessible (middleware gate) for these lifecycle tests.
  await context.addCookies([
    {
      name: "kids_math.unlocked_grade_b",
      value: "1",
      url: getCookieUrl(),
    },
  ]);
});

test.describe("grade B lifecycle", () => {
  test("can complete day-1 and persist after refresh", async ({ page }) => {
    await page.evaluate(() => {
      const key = "kids_math.workbook_progress.v2.grade.b";
      const state = {
        version: 1,
        updatedAt: new Date().toISOString(),
        days: {
          "day-1": {
            dayId: "day-1",
            answers: {},
            correctAnswers: {},
            wrongCount: 0,
            attempts: [],
            percentDone: 100,
            isComplete: false,
          },
        },
      };
      window.localStorage.setItem(key, JSON.stringify(state));
    });

    await page.goto("/grade/b/day/day-1");
    await expect(page.getByTestId(testIds.screen.day.completeCta("b", "day-1"))).toBeVisible();

    await page.getByTestId(testIds.screen.day.completeCta("b", "day-1")).click();
    await page.getByTestId(testIds.component.starReward.confirm()).click();
    await expect(page).toHaveURL(/\/grade\/b\/?$/);

    await page.reload();
    await expect(page).toHaveURL(/\/grade\/b\/?$/);

    const isComplete = await page.evaluate(() => {
      const raw = window.localStorage.getItem("kids_math.workbook_progress.v2.grade.b");
      if (!raw) return false;
      const parsed = JSON.parse(raw) as any;
      return Boolean(parsed?.days?.["day-1"]?.isComplete);
    });
    expect(isComplete).toBe(true);
  });

  test("final exam: fail then pass (no further unlock)", async ({ page }) => {
    // Unlock exam day by completing the previous day in progress state.
    const progress = createProgressState({
      days: {
        "day-28": createCompletedDayProgressState("day-28"),
      },
    });

    const failState = createFinalExamState({ grade: "b", seed: "e2e-seed-fail-b", answerMode: "fail" });
    await seedProgressState(page, "b", progress);
    await seedFinalExamState(page, "b", failState);

    await page.goto("/grade/b/day/day-29");
    await expect(page.getByTestId(testIds.screen.finalExam.root("b"))).toBeVisible();

    await page.getByTestId(testIds.screen.finalExam.finishCta("b")).click();
    await expect(page.getByText("לא עבר — אפשר להיבחן שוב.")).toBeVisible();
    await expect(page.getByText(/ציון:\s*80%/)).toBeVisible();

    const passState = createFinalExamState({ grade: "b", seed: "e2e-seed-pass-b", answerMode: "pass" });
    await seedFinalExamState(page, "b", passState);
    await page.reload();

    await page.getByTestId(testIds.screen.finalExam.finishCta("b")).click();
    await expect(page.getByText("עברת את המבחן המסכם לכיתה ב׳!")).toBeVisible();

    const storedBefore = await page.evaluate(() => window.localStorage.getItem("kids_math.final_exam.v1.grade.b"));
    expect(storedBefore).toBeTruthy();
    const beforeParsed = JSON.parse(storedBefore!) as any;
    expect(beforeParsed?.scorePercent).toBeGreaterThanOrEqual(85);
    expect(Boolean(beforeParsed?.submittedAt)).toBe(true);

    // Immutability: after submit, attempting to change answers / re-check should not mutate persisted state.
    const byId = exerciseByIdForGrade("b");
    const stored = await page.evaluate(() => window.localStorage.getItem("kids_math.final_exam.v1.grade.b"));
    const parsed = stored ? (JSON.parse(stored) as any) : null;
    const firstExerciseId = parsed?.selectedExerciseIds?.[0];
    const firstExercise = typeof firstExerciseId === "string" ? byId.get(firstExerciseId as any) : null;
    if (firstExercise) {
      if (firstExercise.kind === "number_input" || firstExercise.kind === "number_line_jump" || firstExercise.kind === "verbal_input") {
        await page.getByTestId(testIds.component.exerciseBox.input(firstExercise.id)).fill("123");
      } else if (firstExercise.kind === "true_false") {
        await page.getByTestId(testIds.component.exerciseBox.choice(firstExercise.id, "true")).click();
      } else if (firstExercise.kind === "shape_choice") {
        await page.getByTestId(testIds.component.exerciseBox.choice(firstExercise.id, firstExercise.answer)).click();
      } else if (firstExercise.kind === "multiple_choice") {
        await page.getByTestId(testIds.component.exerciseBox.choice(firstExercise.id, firstExercise.answer)).click();
      }
      await page.getByTestId(testIds.component.exerciseBox.check(firstExercise.id)).click();
    }

    const storedAfter = await page.evaluate(() => window.localStorage.getItem("kids_math.final_exam.v1.grade.b"));
    expect(storedAfter).toBe(storedBefore);

    await page.getByTestId(testIds.screen.finalExam.gradePicker()).click();
    await expect(page).toHaveURL(/\/$/);
  });
});

