import { expect, test } from "@playwright/test";
import type { DayId } from "@/lib/types";
import { getWorkbookDaysById } from "@/lib/content/workbook";
import { answerDayCorrectly } from "./answering";
import {
  createCompletedDayProgressState,
  createProgressState,
  dismissDayCompletionCelebration,
  seedProgressState,
} from "./testUtils";
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

// One test per (grade, day). Each day is independent — it seeds all prior days as
// completed, then completes exactly this day — so splitting the former single mega-loop
// into per-day tests keeps identical coverage while letting Playwright distribute the
// work across shards/workers (the old single test pinned one worker for ~8 minutes).
test.describe("all days completion", () => {
  test.beforeEach(async ({ page, context }) => {
    await context.clearCookies();
    await page.goto("/");
    await page.evaluate(() => window.localStorage.clear());
  });

  for (const grade of ["a", "b"] as const) {
    for (const dayId of allDayIdsForGrade(grade)) {
      test(`grade ${grade.toUpperCase()} can complete ${dayId}`, async ({ page, context }) => {
        test.setTimeout(90 * 1000);

        if (grade === "b") {
          await context.addCookies([
            {
              name: "kids_math.unlocked_grade_b",
              value: "1",
              url: getCookieUrl(),
            },
          ]);
        }

        const completedDays = Object.fromEntries(
          previousDayIds(dayId).map((id) => [id, createCompletedDayProgressState(id)]),
        ) as Record<DayId, ReturnType<typeof createCompletedDayProgressState>>;
        await seedProgressState(page, grade, createProgressState({ days: completedDays }));
        await page.goto(`/grade/${grade}/day/${dayId}`);
        await expect(page.getByTestId(testIds.screen.dayOverview.root(grade, dayId))).toBeVisible();

        await answerDayCorrectly(page, { grade, dayId });
        await page.goto(`/grade/${grade}/day/${dayId}`);
        await expect(page.getByTestId(testIds.screen.dayOverview.completeCta(grade, dayId))).toBeVisible();

        await page.getByTestId(testIds.screen.dayOverview.completeCta(grade, dayId)).click();
        await page.getByTestId(testIds.component.starReward.confirm()).click();
        await dismissDayCompletionCelebration(page);
        await expect(page).toHaveURL(new RegExp(`/grade/${grade}/?$`));
      });
    }
  }
});
