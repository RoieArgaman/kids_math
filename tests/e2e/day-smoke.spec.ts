import { expect, test } from "@playwright/test";
import type { DayId, WorkbookDay } from "@/lib/types";
import { getWorkbookDaysById } from "@/lib/content/workbook";
import { answerExerciseCorrectly } from "./answering";
import { createCompletedDayProgressState, createProgressState, seedProgressState } from "./testUtils";
import { testIds } from "@/lib/testIds";
import { FINAL_EXAM_DAY_ID } from "@/lib/final-exam/config";

function getCookieUrl() {
  return process.env.PLAYWRIGHT_COOKIE_URL ?? process.env.PLAYWRIGHT_BASE_URL ?? "http://127.0.0.1:3005";
}

function allDayIdsForGrade(grade: "a" | "b"): DayId[] {
  return Object.keys(getWorkbookDaysById(grade))
    .filter((id) => id !== FINAL_EXAM_DAY_ID)
    .sort((a, b) => Number(a.replace("day-", "")) - Number(b.replace("day-", ""))) as DayId[];
}

function previousDayIds(dayId: DayId): DayId[] {
  const n = Number(dayId.replace("day-", ""));
  if (Number.isNaN(n) || n <= 1) return [];
  return Array.from({ length: n - 1 }, (_, i) => `day-${i + 1}` as DayId);
}

test.describe("day smoke", () => {
  test.setTimeout(3 * 60 * 1000);

  test.beforeEach(async ({ page, context }) => {
    await context.clearCookies();
    await page.goto("/");
    await page.evaluate(() => window.localStorage.clear());
  });

  test("grade A all days render and accept answers", async ({ page }) => {
    const byId = getWorkbookDaysById("a") as Record<string, WorkbookDay>;
    const dayIds = allDayIdsForGrade("a");

    for (const dayId of dayIds) {
      const completedDays = Object.fromEntries(
        previousDayIds(dayId).map((id) => [id, createCompletedDayProgressState(id)]),
      ) as Record<DayId, ReturnType<typeof createCompletedDayProgressState>>;
      await seedProgressState(page, "a", createProgressState({ days: completedDays }));
      await page.goto(`/grade/a/day/${dayId}`);
      await expect(page.getByTestId(testIds.screen.day.root("a", dayId))).toBeVisible();

      const day = byId[dayId];
      expect(day).toBeTruthy();
      const firstExercise = day.sections[0]?.exercises[0];
      expect(firstExercise).toBeTruthy();
      await answerExerciseCorrectly(page, firstExercise);
    }
  });

  test("grade B all days render and accept answers", async ({ page, context }) => {
    await context.addCookies([
      {
        name: "kids_math.unlocked_grade_b",
        value: "1",
        url: getCookieUrl(),
      },
    ]);

    const byId = getWorkbookDaysById("b") as Record<string, WorkbookDay>;
    const dayIds = allDayIdsForGrade("b");

    for (const dayId of dayIds) {
      const completedDays = Object.fromEntries(
        previousDayIds(dayId).map((id) => [id, createCompletedDayProgressState(id)]),
      ) as Record<DayId, ReturnType<typeof createCompletedDayProgressState>>;
      await seedProgressState(page, "b", createProgressState({ days: completedDays }));
      await page.goto(`/grade/b/day/${dayId}`);
      await expect(page.getByTestId(testIds.screen.day.root("b", dayId))).toBeVisible();

      const day = byId[dayId];
      expect(day).toBeTruthy();
      const firstExercise = day.sections[0]?.exercises[0];
      expect(firstExercise).toBeTruthy();
      await answerExerciseCorrectly(page, firstExercise);
    }
  });
});
