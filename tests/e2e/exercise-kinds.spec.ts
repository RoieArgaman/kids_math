import { expect, test } from "@playwright/test";
import { getWorkbookDaysById } from "@/lib/content/workbook";
import { routes } from "@/lib/routes";
import { testIds } from "@/lib/testIds";
import type { DayId, Exercise, WorkbookDay } from "@/lib/types";
import { answerExerciseCorrectly, answerExerciseWrongly } from "./answering";

/**
 * Per-exercise-kind interaction mechanics (wrong → retry → correct). Drives the
 * always-accessible warmup section (sections[0]) of whichever grade-A day first
 * contains each kind, so no section-unlock gating is needed. This asserts the WIRING
 * per kind; the grading math itself is unit-tested.
 */

// Find the first warmup-section exercise of each kind across grade-A content.
function firstExerciseByKind(): Map<string, { dayId: DayId; sectionId: string; exercise: Exercise }> {
  const byId = getWorkbookDaysById("a") as Record<string, WorkbookDay>;
  const found = new Map<string, { dayId: DayId; sectionId: string; exercise: Exercise }>();
  for (const day of Object.values(byId)) {
    const warmup = day.sections[0];
    if (!warmup) continue;
    for (const ex of warmup.exercises) {
      if (!found.has(ex.kind)) {
        found.set(ex.kind, { dayId: day.id, sectionId: warmup.id, exercise: ex });
      }
    }
  }
  return found;
}

const KINDS = firstExerciseByKind();

test.describe("exercise-kind interaction mechanics", () => {
  for (const [kind, { dayId, sectionId, exercise }] of KINDS) {
    test(`${kind}: wrong answer shows retry, then a correct answer clears it`, async ({ page }) => {
      // previewAll bypasses the sequential day-unlock gate so a kind that first appears
      // in a later day's warmup is still reachable without completing every prior day.
      await page.goto(routes.gradeSection("a", dayId, sectionId, { previewAll: true }));

      const root = page.getByTestId(testIds.component.exerciseBox.root(exercise.id));
      await expect(root).toBeVisible();

      // Wrong answer → retry surfaces.
      await answerExerciseWrongly(page, exercise);
      const retry = page.getByTestId(testIds.component.exerciseBox.retry(exercise.id));
      await expect(retry).toBeVisible();

      // Retry → correct answer → retry gone (accepted).
      await retry.click();
      await answerExerciseCorrectly(page, exercise);
      await expect(page.getByTestId(testIds.component.exerciseBox.retry(exercise.id))).toHaveCount(0);
    });
  }

  test("at least the core math kinds were discovered in warmups", () => {
    // Guards against the introspection silently finding nothing (e.g. a content refactor).
    expect(KINDS.size).toBeGreaterThan(0);
  });
});
