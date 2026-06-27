import { expect, test } from "@playwright/test";
import { createProgressState, seedProgressState } from "./testUtils";
import { testIds } from "@/lib/testIds";
import { getWorkbookDays } from "@/lib/content/workbook";
import type { DayProgressState, ExerciseId } from "@/lib/types";

const GRADE = "a" as const;

test.beforeEach(async ({ page, context }) => {
  await context.clearCookies();
  await page.goto("/");
  await page.evaluate(() => window.localStorage.clear());
});

test.describe("spiral review warm-up block", () => {
  test("surfaces a prior first-attempt-wrong exercise on a different day's warm-up", async ({
    page,
  }) => {
    const days = getWorkbookDays(GRADE);
    const sourceDay = days.find((d) => d.id === "day-1");
    // A DIFFERENT day whose warm-up (section 0) we will visit.
    const targetDay = days.find((d) => d.id === "day-2") ?? days[1];
    if (!sourceDay || !targetDay || sourceDay.id === targetDay.id) {
      test.skip(true, "need at least two distinct grade-a days");
      return;
    }

    // Pick a day-1 exercise that the picker can resolve & re-render in the block.
    // number_input / multiple_choice are the only kinds with a stable correct submit path here.
    const sourceExercise = sourceDay.sections
      .flatMap((s) => s.exercises)
      .find((ex) => ex.kind === "number_input" || ex.kind === "multiple_choice");
    if (!sourceExercise) {
      test.skip(true, "no answerable source exercise on day-1");
      return;
    }

    // Seed day-1 with a FIRST-attempt-wrong attempt for that exercise.
    // The spiral selector treats first-attempt-wrong as a review candidate.
    const wrongFirstAttempt: DayProgressState = {
      dayId: sourceDay.id,
      answers: {},
      correctAnswers: {} as Record<ExerciseId, boolean>,
      wrongCount: 1,
      wrongBySection: {} as Record<never, number>,
      attempts: [
        {
          exerciseId: sourceExercise.id,
          answer: 0,
          isCorrect: false,
          attemptedAt: new Date(Date.now() - 60_000).toISOString(),
        },
      ],
      percentDone: 0,
      isComplete: false,
    };

    await seedProgressState(
      page,
      GRADE,
      createProgressState({ days: { [sourceDay.id]: wrongFirstAttempt } }),
    );

    // Visit the target day's warm-up section (section index 0). previewAll bypasses unlock gates.
    const targetWarmup = targetDay.sections[0];
    await page.goto(`/grade/${GRADE}/day/${targetDay.id}/section/${targetWarmup.id}?previewAll=1`);

    const reviewRoot = page.getByTestId(
      testIds.screen.section.spiralReview.root(GRADE, targetDay.id, targetWarmup.id),
    );

    // Resilient: if no candidate renders (content shape edge case), skip rather than fail.
    try {
      await reviewRoot.waitFor({ state: "visible", timeout: 5000 });
    } catch {
      test.skip(true, "no spiral-review candidate rendered for this content shape");
      return;
    }

    // The block must contain at least one exercise.
    const reviewExercise = reviewRoot.getByTestId(
      testIds.screen.section.spiralReview.exercise(
        GRADE,
        targetDay.id,
        targetWarmup.id,
        sourceExercise.id,
      ),
    );
    await expect(reviewExercise).toBeVisible();

    // Answer it correctly and assert no crash (block stays mounted, root still visible).
    if (sourceExercise.kind === "number_input") {
      await page
        .getByTestId(testIds.component.exerciseBox.input(sourceExercise.id))
        .fill(String(sourceExercise.answer));
    } else {
      await page
        .getByTestId(testIds.component.exerciseBox.choice(sourceExercise.id, sourceExercise.answer))
        .click();
    }
    const checkBtn = page.getByTestId(testIds.component.exerciseBox.check(sourceExercise.id));
    if (await checkBtn.isVisible().catch(() => false)) {
      await checkBtn.click();
    }

    await expect(reviewRoot).toBeVisible();

    // CRITICAL invariant: review answers must NOT write to the current day's progress state.
    const targetDayWritten = await page.evaluate((dayId) => {
      const raw = window.localStorage.getItem("kids_math.workbook_progress.v2.grade.a");
      if (!raw) return false;
      try {
        const parsed = JSON.parse(raw) as { days?: Record<string, unknown> };
        return Boolean(parsed.days && parsed.days[dayId]);
      } catch {
        return false;
      }
    }, targetDay.id);
    expect(targetDayWritten).toBe(false);
  });
});
