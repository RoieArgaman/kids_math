import { expect, test } from "@playwright/test";
import {
  createCompletedDayProgressState,
  createFinalExamState,
  createProgressState,
  dismissDayCompletionCelebration,
  exerciseByIdForGrade,
  seedFinalExamState,
  seedProgressState,
} from "./testUtils";
import { childTid, testIds } from "@/lib/testIds";

test.beforeEach(async ({ page, context }) => {
  await context.clearCookies();
  await page.goto("/");
  await page.evaluate(() => window.localStorage.clear());
});

test.describe("grade A lifecycle", () => {
  test("can complete day-1 and progress persists after refresh", async ({ page }) => {
    // Seed day-1 as 100% done but not yet marked complete, to exercise the completion UI without answering dozens of exercises.
    await page.evaluate(() => {
      const key = "kids_math.workbook_progress.v2.grade.a";
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

    await page.goto("/grade/a/day/day-1");
    await expect(page.getByTestId(testIds.screen.day.completeCta("a", "day-1"))).toBeVisible();

    await page.getByTestId(testIds.screen.day.completeCta("a", "day-1")).click();
    await page.getByTestId(testIds.component.starReward.confirm()).click();
    await dismissDayCompletionCelebration(page);
    await expect(page).toHaveURL(/\/grade\/a\/?$/);

    // Refresh should preserve completion.
    await page.reload();
    await expect(page).toHaveURL(/\/grade\/a\/?$/);

    // And persisted state should mark day-1 complete.
    const isComplete = await page.evaluate(() => {
      const raw = window.localStorage.getItem("kids_math.workbook_progress.v2.grade.a");
      if (!raw) return false;
      const parsed = JSON.parse(raw) as any;
      return Boolean(parsed?.days?.["day-1"]?.isComplete);
    });
    expect(isComplete).toBe(true);
  });

  test("final exam: fail, retry, then pass unlocks grade B via real flow", async ({ page }) => {
    // Unlock exam day by completing the previous day in progress state.
    const progress = createProgressState({
      days: {
        "day-28": createCompletedDayProgressState("day-28"),
      },
    });

    // Seed a deterministic fail attempt (80%) then we will retry and seed a pass attempt.
    const failState = createFinalExamState({ grade: "a", seed: "e2e-seed-fail-a", answerMode: "fail" });

    await seedProgressState(page, "a", progress);
    await seedFinalExamState(page, "a", failState);

    await page.goto("/grade/a/day/day-29");
    const finalExamRootA = page.getByTestId(testIds.screen.finalExam.root("a"));
    await expect(finalExamRootA).toBeVisible();
    await expect(
      finalExamRootA.locator('[data-testid^="km.component.exerciseBox.exercise."][data-testid$=".check"]'),
    ).toHaveCount(0);
    await expect(page.getByTestId(testIds.screen.finalExam.finishCta("a"))).toBeVisible();

    await page.getByTestId(testIds.screen.finalExam.finishCta("a")).click();
    await expect(page.getByText("לא עבר — אפשר להיבחן שוב.")).toBeVisible();
    await expect(page.getByText(/ציון:\s*80%/)).toBeVisible();

    const firstSelection = await page.evaluate(() => {
      const raw = window.localStorage.getItem("kids_math.final_exam.v1.grade.a");
      if (!raw) return null;
      const parsed = JSON.parse(raw) as any;
      return parsed?.selectedExerciseIds ?? null;
    });
    expect(Array.isArray(firstSelection)).toBe(true);

    // Retry should reset the UI (no results panel).
    await page.getByTestId(testIds.screen.finalExam.retryCta("a")).click();
    await expect.poll(async () => {
      const raw = await page.evaluate(() => window.localStorage.getItem("kids_math.final_exam.v1.grade.a"));
      if (!raw) return false;
      try {
        const parsed = JSON.parse(raw) as { submittedAt?: string };
        return parsed.submittedAt == null || parsed.submittedAt === "";
      } catch {
        return false;
      }
    }).toBe(true);
    await expect(page.getByTestId(childTid(testIds.screen.finalExam.finishPanel("a"), "results"))).toHaveCount(0);
    await expect(page.getByTestId(testIds.screen.finalExam.finishCta("a"))).toBeHidden();
    await expect(
      finalExamRootA.locator('[data-testid^="km.component.exerciseBox.exercise."][data-testid$=".check"]'),
    ).toHaveCount(0);

    const secondSelection = await page.evaluate(() => {
      const raw = window.localStorage.getItem("kids_math.final_exam.v1.grade.a");
      if (!raw) return null;
      const parsed = JSON.parse(raw) as any;
      return parsed?.selectedExerciseIds ?? null;
    });
    expect(secondSelection).not.toEqual(firstSelection);

    // Re-seed a pass attempt deterministically before reloading.
    const passState = createFinalExamState({ grade: "a", seed: "e2e-seed-pass-a", answerMode: "pass" });
    await seedFinalExamState(page, "a", passState);
    await page.reload();

    // Simulate a slow unlock API (but still hit the real server so it can set the httpOnly cookie).
    await page.route("**/api/unlock-grade-b", async (route) => {
      await new Promise((resolve) => setTimeout(resolve, 1200));
      await route.continue();
    });

    await page.getByTestId(testIds.screen.finalExam.finishCta("a")).click();
    await expect(page.getByText("עברת! אפשר להתחיל כיתה ב׳.")).toBeVisible();

    const startGradeBButton = page.getByTestId(testIds.screen.finalExam.startGradeB());
    await expect(startGradeBButton).toBeDisabled();
    await expect(startGradeBButton).toContainText("פותחים את כיתה ב׳");
    await expect(startGradeBButton).toBeEnabled({ timeout: 10_000 });

    // After submit, score should be stable in localStorage.
    const storedBefore = await page.evaluate(() => window.localStorage.getItem("kids_math.final_exam.v1.grade.a"));
    expect(storedBefore).toBeTruthy();
    const beforeParsed = JSON.parse(storedBefore!) as any;
    expect(beforeParsed?.scorePercent).toBeGreaterThanOrEqual(85);
    expect(Boolean(beforeParsed?.submittedAt)).toBe(true);

    // Immutability: after submit, attempting to change answers should not mutate persisted state.
    const byId = exerciseByIdForGrade("a");
    const firstExerciseId =
      Array.isArray(beforeParsed?.selectedExerciseIds) && typeof beforeParsed.selectedExerciseIds[0] === "string"
        ? (beforeParsed.selectedExerciseIds[0] as string)
        : null;
    const firstExercise = firstExerciseId ? byId.get(firstExerciseId as any) : null;
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
    }

    const storedAfter = await page.evaluate(() => window.localStorage.getItem("kids_math.final_exam.v1.grade.a"));
    expect(storedAfter).toBe(storedBefore);

    // This CTA navigates to grade B, which should now be allowed by middleware cookie (set by finishExam()).
    await page.getByTestId(testIds.screen.finalExam.startGradeB()).click();
    await expect(page).toHaveURL(/\/grade\/b\/?$/);
    await expect(page.getByRole("heading", { level: 1 })).toContainText("ב׳");
  });
});

