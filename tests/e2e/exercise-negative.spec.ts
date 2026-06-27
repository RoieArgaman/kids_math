import { expect, test } from "@playwright/test";
import type { Exercise, WorkbookDay } from "@/lib/types";
import { getWorkbookDaysById } from "@/lib/content/workbook";
import { answerExerciseCorrectly, answerExerciseWrongly } from "./answering";
import { testIds } from "@/lib/testIds";

const SUBMIT_OUTCOME_TIMEOUT_MS = 1_500;

/**
 * Find a number_input exercise inside a grade-A warmup section (section index 0).
 * Warmup sections are always accessible without seeding progress (no gate).
 */
function findWarmupNumberInput(): { dayId: string; sectionId: string; exercise: Exercise } | null {
  const byDay = getWorkbookDaysById("a") as Record<string, WorkbookDay>;
  for (const [dayId, day] of Object.entries(byDay)) {
    const warmup = day.sections[0];
    if (!warmup) continue;
    for (const ex of warmup.exercises) {
      if (ex.kind === "number_input") {
        return { dayId, sectionId: warmup.id, exercise: ex };
      }
    }
  }
  return null;
}

test.describe("exercise negative paths (number_input)", () => {
  test.beforeEach(async ({ page, context }) => {
    await context.clearCookies();
    await page.goto("/");
    await page.evaluate(() => window.localStorage.clear());
  });

  test("empty submit does not falsely mark correct; wrong answer shows retry; retry then correct succeeds", async ({
    page,
  }) => {
    const match = findWarmupNumberInput();
    if (!match) {
      test.skip(true, "No number_input exercise found in any grade-A warmup section");
    }
    const { dayId, sectionId, exercise } = match!;

    await page.goto(`/grade/a/day/${dayId}/section/${sectionId}`);

    const root = page.getByTestId(testIds.component.exerciseBox.root(exercise.id));
    await expect(root).toBeVisible();

    const input = root.getByTestId(testIds.component.exerciseBox.input(exercise.id));
    const check = root.getByTestId(testIds.component.exerciseBox.check(exercise.id));
    const retry = root.getByTestId(testIds.component.exerciseBox.retry(exercise.id));

    // 1) Empty submit: clearing input and clicking check must NOT mark the exercise
    //    correct/complete. The check control must still be present (no false pass),
    //    and the wrong-answer retry path must not have been triggered as a success.
    await input.fill("");
    await check.click();

    // The check button is still available (the exercise was not consumed as correct).
    await expect(check).toBeVisible({ timeout: SUBMIT_OUTCOME_TIMEOUT_MS });
    // The input is still editable (not locked into a completed state).
    await expect(input).toBeEditable();

    // 2) Wrong answer surfaces the retry control.
    await answerExerciseWrongly(page, exercise);
    await expect(retry).toBeVisible({ timeout: SUBMIT_OUTCOME_TIMEOUT_MS });

    // 3) After retrying, answering correctly succeeds (retry control disappears).
    //    answerExerciseCorrectly handles clicking retry when present.
    await answerExerciseCorrectly(page, exercise);
    await expect(retry).toHaveCount(0, { timeout: SUBMIT_OUTCOME_TIMEOUT_MS });
  });
});
