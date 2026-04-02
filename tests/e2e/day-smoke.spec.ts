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

  test("grade A all days show Day Hub and accept answers in warmup section", async ({ page }) => {
    const byId = getWorkbookDaysById("a") as Record<string, WorkbookDay>;
    const dayIds = allDayIdsForGrade("a");

    for (const dayId of dayIds) {
      const completedDays = Object.fromEntries(
        previousDayIds(dayId).map((id) => [id, createCompletedDayProgressState(id)]),
      ) as Record<DayId, ReturnType<typeof createCompletedDayProgressState>>;
      await seedProgressState(page, "a", createProgressState({ days: completedDays }));
      await page.goto(`/grade/a/day/${dayId}`);

      // Day Hub renders
      await expect(page.getByTestId(testIds.screen.dayOverview.root("a", dayId))).toBeVisible();

      const day = byId[dayId];
      expect(day).toBeTruthy();

      // Warmup section card is present and CTA is visible
      const warmupSection = day.sections[0];
      expect(warmupSection).toBeTruthy();
      const warmupCta = page.getByTestId(
        testIds.screen.dayOverview.sectionCardCta("a", dayId, warmupSection.id),
      );
      await expect(warmupCta).toBeVisible();

      // Navigate into warmup section
      await warmupCta.click();
      await expect(
        page.getByTestId(testIds.screen.section.root("a", dayId, warmupSection.id)),
      ).toBeVisible();

      // Answer first exercise in warmup
      const firstExercise = warmupSection.exercises[0];
      expect(firstExercise).toBeTruthy();
      await answerExerciseCorrectly(page, firstExercise);
    }
  });

  test("grade B all days show Day Hub and accept answers in warmup section", async ({
    page,
    context,
  }) => {
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

      // Day Hub renders
      await expect(page.getByTestId(testIds.screen.dayOverview.root("b", dayId))).toBeVisible();

      const day = byId[dayId];
      expect(day).toBeTruthy();

      // Warmup section card CTA is visible
      const warmupSection = day.sections[0];
      expect(warmupSection).toBeTruthy();
      const warmupCta = page.getByTestId(
        testIds.screen.dayOverview.sectionCardCta("b", dayId, warmupSection.id),
      );
      await expect(warmupCta).toBeVisible();

      // Navigate into warmup section
      await warmupCta.click();
      await expect(
        page.getByTestId(testIds.screen.section.root("b", dayId, warmupSection.id)),
      ).toBeVisible();

      // Answer first exercise
      const firstExercise = warmupSection.exercises[0];
      expect(firstExercise).toBeTruthy();
      await answerExerciseCorrectly(page, firstExercise);
    }
  });
});

test.describe("Day Hub scenarios", () => {
  test.setTimeout(60 * 1000);

  const grade = "a" as const;
  const dayId: DayId = "day-1";

  test.beforeEach(async ({ page, context }) => {
    await context.clearCookies();
    await page.goto("/");
    await page.evaluate(() => window.localStorage.clear());
  });

  test("day hub loads with section cards", async ({ page }) => {
    await page.goto(`/grade/${grade}/day/${dayId}`);
    await expect(page.getByTestId(testIds.screen.dayOverview.root(grade, dayId))).toBeVisible();

    const day = (getWorkbookDaysById(grade) as Record<string, WorkbookDay>)[dayId];
    expect(day).toBeTruthy();

    // All section cards rendered
    for (const section of day.sections) {
      await expect(
        page.getByTestId(testIds.screen.dayOverview.sectionCard(grade, dayId, section.id)),
      ).toBeVisible();
    }
  });

  test("warmup gate: non-warmup sections locked initially", async ({ page }) => {
    await page.goto(`/grade/${grade}/day/${dayId}`);
    await expect(page.getByTestId(testIds.screen.dayOverview.root(grade, dayId))).toBeVisible();

    const day = (getWorkbookDaysById(grade) as Record<string, WorkbookDay>)[dayId];
    expect(day).toBeTruthy();
    expect(day.sections.length).toBeGreaterThan(1);

    // Warmup CTA is visible, subsequent sections have no CTA (locked)
    const warmupSection = day.sections[0];
    await expect(
      page.getByTestId(testIds.screen.dayOverview.sectionCardCta(grade, dayId, warmupSection.id)),
    ).toBeVisible();

    const secondSection = day.sections[1];
    await expect(
      page.getByTestId(testIds.screen.dayOverview.sectionCardCta(grade, dayId, secondSection.id)),
    ).not.toBeVisible();
  });

  test("navigate into warmup section", async ({ page }) => {
    await page.goto(`/grade/${grade}/day/${dayId}`);
    await expect(page.getByTestId(testIds.screen.dayOverview.root(grade, dayId))).toBeVisible();

    const day = (getWorkbookDaysById(grade) as Record<string, WorkbookDay>)[dayId];
    const warmupSection = day.sections[0];

    await page
      .getByTestId(testIds.screen.dayOverview.sectionCardCta(grade, dayId, warmupSection.id))
      .click();

    await expect(
      page.getByTestId(testIds.screen.section.root(grade, dayId, warmupSection.id)),
    ).toBeVisible();
  });

  test("answer exercises in warmup section", async ({ page }) => {
    await page.goto(`/grade/${grade}/day/${dayId}`);
    await expect(page.getByTestId(testIds.screen.dayOverview.root(grade, dayId))).toBeVisible();

    const day = (getWorkbookDaysById(grade) as Record<string, WorkbookDay>)[dayId];
    const warmupSection = day.sections[0];

    await page
      .getByTestId(testIds.screen.dayOverview.sectionCardCta(grade, dayId, warmupSection.id))
      .click();

    await expect(
      page.getByTestId(testIds.screen.section.root(grade, dayId, warmupSection.id)),
    ).toBeVisible();

    // Answer all warmup exercises
    for (const exercise of warmupSection.exercises) {
      await answerExerciseCorrectly(page, exercise);
    }

    // Section complete panel appears
    await expect(
      page.getByTestId(testIds.screen.section.completionPanel(grade, dayId, warmupSection.id)),
    ).toBeVisible();
  });

  test("navigate back to Day Hub from section", async ({ page }) => {
    await page.goto(`/grade/${grade}/day/${dayId}`);
    await expect(page.getByTestId(testIds.screen.dayOverview.root(grade, dayId))).toBeVisible();

    const day = (getWorkbookDaysById(grade) as Record<string, WorkbookDay>)[dayId];
    const warmupSection = day.sections[0];

    await page
      .getByTestId(testIds.screen.dayOverview.sectionCardCta(grade, dayId, warmupSection.id))
      .click();

    await expect(
      page.getByTestId(testIds.screen.section.root(grade, dayId, warmupSection.id)),
    ).toBeVisible();

    // Click back nav
    await page
      .getByTestId(testIds.screen.section.nav(grade, dayId, warmupSection.id))
      .getByRole("link", { name: /חֲזָרָה לַיּוֹם/i })
      .click();

    await expect(page.getByTestId(testIds.screen.dayOverview.root(grade, dayId))).toBeVisible();
  });

  test("warmup card shows complete after answering all warmup exercises", async ({ page }) => {
    await page.goto(`/grade/${grade}/day/${dayId}`);
    await expect(page.getByTestId(testIds.screen.dayOverview.root(grade, dayId))).toBeVisible();

    const day = (getWorkbookDaysById(grade) as Record<string, WorkbookDay>)[dayId];
    const warmupSection = day.sections[0];

    // Enter warmup section
    await page
      .getByTestId(testIds.screen.dayOverview.sectionCardCta(grade, dayId, warmupSection.id))
      .click();

    await expect(
      page.getByTestId(testIds.screen.section.root(grade, dayId, warmupSection.id)),
    ).toBeVisible();

    // Answer all warmup exercises
    for (const exercise of warmupSection.exercises) {
      await answerExerciseCorrectly(page, exercise);
    }

    // Navigate back
    await page
      .getByTestId(testIds.screen.section.nav(grade, dayId, warmupSection.id))
      .getByRole("link", { name: /חֲזָרָה לַיּוֹם/i })
      .click();

    await expect(page.getByTestId(testIds.screen.dayOverview.root(grade, dayId))).toBeVisible();

    // Warmup card CTA shows "תִּרְגּוּל חוֹזֵר" (replay), confirming complete state
    await expect(
      page.getByTestId(testIds.screen.dayOverview.sectionCardCta(grade, dayId, warmupSection.id)),
    ).toHaveText(/תִּרְגּוּל חוֹזֵר/);
  });

  test("other sections unlock after warmup complete", async ({ page }) => {
    const day = (getWorkbookDaysById(grade) as Record<string, WorkbookDay>)[dayId];
    if (day.sections.length < 2) {
      test.skip();
      return;
    }

    await page.goto(`/grade/${grade}/day/${dayId}`);
    await expect(page.getByTestId(testIds.screen.dayOverview.root(grade, dayId))).toBeVisible();

    const warmupSection = day.sections[0];
    const secondSection = day.sections[1];

    // Enter warmup and complete it
    await page
      .getByTestId(testIds.screen.dayOverview.sectionCardCta(grade, dayId, warmupSection.id))
      .click();

    for (const exercise of warmupSection.exercises) {
      await answerExerciseCorrectly(page, exercise);
    }

    // Navigate back
    await page
      .getByTestId(testIds.screen.section.nav(grade, dayId, warmupSection.id))
      .getByRole("link", { name: /חֲזָרָה לַיּוֹם/i })
      .click();

    await expect(page.getByTestId(testIds.screen.dayOverview.root(grade, dayId))).toBeVisible();

    // Second section CTA is now visible (unlocked)
    await expect(
      page.getByTestId(testIds.screen.dayOverview.sectionCardCta(grade, dayId, secondSection.id)),
    ).toBeVisible();
  });
});
