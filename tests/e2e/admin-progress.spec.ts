import { expect, test } from "@playwright/test";
import { createCompletedDayProgressState, createProgressState } from "./testUtils";
import { testIds } from "@/lib/testIds";
import { getWorkbookDaysById } from "@/lib/content/workbook";

function playwrightCookieUrl(): string {
  return process.env.PLAYWRIGHT_COOKIE_URL ?? process.env.PLAYWRIGHT_BASE_URL ?? "http://127.0.0.1:3005";
}

test.beforeEach(async ({ page, context }) => {
  await context.clearCookies();
  await page.goto("/");
  await page.evaluate(() => {
    window.localStorage.clear();
    window.sessionStorage.clear();
  });
});

test("admin can complete/reset day and grade isolation is preserved", async ({ page, context }) => {
  const gradeBProgress = createProgressState({
    days: {
      "day-1": createCompletedDayProgressState("day-1"),
    },
  });

  await context.addCookies([
    { name: "kids_math.unlocked_grade_b", value: "1", url: playwrightCookieUrl() },
  ]);

  await page.goto("/");
  await page.evaluate((payload) => {
    window.localStorage.setItem("kids_math.workbook_progress.v2.grade.b", JSON.stringify(payload));
  }, gradeBProgress);

  await page.goto("/grade/b");
  await expect(page).not.toHaveURL(/\/grade\/b\/locked/);

  await page.goto("/grade/a/day/day-2");
  await expect(page.getByTestId(testIds.screen.day.root("a", "day-2.locked"))).toBeVisible();

  await page.goto("/admin/progress?grade=a");
  await page.getByTestId(testIds.screen.adminProgress.pinInput()).fill("2109");
  await page.getByTestId(testIds.screen.adminProgress.pinSubmit()).click();
  await page.getByTestId(testIds.screen.adminProgress.markComplete("a", "day-1")).click();

  await page.goto("/grade/a/day/day-2");
  await expect(page.getByTestId(testIds.screen.day.root("a", "day-2.locked"))).toHaveCount(0);
  await expect(page.getByTestId(testIds.screen.day.root("a", "day-2"))).toBeVisible();

  const day1 = getWorkbookDaysById("a")["day-1"];
  const firstInputExercise = day1.sections
    .flatMap((section) => section.exercises)
    .find((exercise) => exercise.kind === "number_input" || exercise.kind === "number_line_jump" || exercise.kind === "verbal_input");
  if (firstInputExercise) {
    await page.goto("/grade/a/day/day-1");
    await expect(page.getByTestId(testIds.component.exerciseBox.input(firstInputExercise.id))).not.toHaveValue("");
  }

  await page.goto("/admin/progress?grade=b");
  await page.getByTestId(testIds.screen.adminProgress.pinInput()).fill("2109");
  await page.getByTestId(testIds.screen.adminProgress.pinSubmit()).click();
  await expect(page.getByTestId(testIds.screen.adminProgress.dayState("b", "day-1"))).toContainText("הושלם");

  await page.goto("/admin/progress?grade=a");
  await page.getByTestId(testIds.screen.adminProgress.pinInput()).fill("2109");
  await page.getByTestId(testIds.screen.adminProgress.pinSubmit()).click();
  await page.getByTestId(testIds.screen.adminProgress.reset("a", "day-1")).click();
  await page.getByTestId(testIds.screen.adminProgress.resetConfirm("a", "day-1")).click();
  await expect(page.getByTestId(testIds.screen.adminProgress.statusMessage())).toContainText("כיתה ב׳ ננעלה", {
    timeout: 15_000,
  });

  await page.goto("/grade/a/day/day-2");
  await expect(page.getByTestId(testIds.screen.day.root("a", "day-2.locked"))).toBeVisible();

  await page.goto("/admin/progress?grade=b");
  await page.getByTestId(testIds.screen.adminProgress.pinInput()).fill("2109");
  await page.getByTestId(testIds.screen.adminProgress.pinSubmit()).click();
  await expect(page.getByTestId(testIds.screen.adminProgress.dayState("b", "day-1"))).toContainText("לא הושלם");

  await page.goto("/grade/b");
  await expect(page).toHaveURL(/\/grade\/b\/locked/);
});

test("admin can mark all days complete then force final exam complete", async ({ page }) => {
  await page.goto("/admin/progress?grade=a");
  await page.getByTestId(testIds.screen.adminProgress.pinInput()).fill("2109");
  await page.getByTestId(testIds.screen.adminProgress.pinSubmit()).click();

  const forceFinalExam = page.getByTestId(testIds.screen.adminProgress.forceFinalExamComplete("a"));
  await expect(forceFinalExam).toBeDisabled();

  await page.getByTestId(testIds.screen.adminProgress.markAllDaysComplete("a")).click();
  await expect(forceFinalExam).toBeEnabled();
  await forceFinalExam.click();
  await expect(page.getByTestId(testIds.screen.adminProgress.dayState("a", "day-29"))).toContainText("הושלם");

  await page.goto("/grade/a");
  const finalExamHomeCard = page.locator("article").filter({ has: page.getByTestId(testIds.screen.home.dayCardCta("day-29")) });
  await expect(finalExamHomeCard.getByText(/הוּשְׁלַם/u)).toBeVisible();

  await page.goto("/grade/a/day/day-29");
  await expect(page.getByText("עברת! אפשר להתחיל כיתה ב׳.")).toBeVisible();
});

test("admin reset day-29 clears final exam and GMAT storage; exam starts fresh", async ({
  page,
}) => {
  await page.goto("/admin/progress?grade=a");
  await page.getByTestId(testIds.screen.adminProgress.pinInput()).fill("2109");
  await page.getByTestId(testIds.screen.adminProgress.pinSubmit()).click();

  await page.getByTestId(testIds.screen.adminProgress.markAllDaysComplete("a")).click();
  await page.getByTestId(testIds.screen.adminProgress.forceFinalExamComplete("a")).click();

  await page.goto("/grade/a/day/day-29");
  await expect(page.getByText("עברת! אפשר להתחיל כיתה ב׳.")).toBeVisible();

  await page.goto("/admin/progress?grade=a");
  await page.getByTestId(testIds.screen.adminProgress.pinInput()).fill("2109");
  await page.getByTestId(testIds.screen.adminProgress.pinSubmit()).click();

  await page.evaluate(() => {
    const state = {
      version: 1,
      grade: "a",
      createdAt: new Date().toISOString(),
      pickerVersion: 1,
      phase: "rules",
      sectionOrder: ["quant", "verbal", "data"],
      orderIndex: 0,
      itemsBySection: { quant: [], verbal: [], data: [] },
      answers: {},
      correctMap: {},
      attempts: {},
      bookmarks: { quant: [], verbal: [], data: [] },
      reviewSnapshot: null,
      sectionEndsAt: null,
      breakEndsAt: null,
    };
    window.localStorage.setItem("kids_math.gmat_challenge.v1.grade.a", JSON.stringify(state));
  });

  await page.getByTestId(testIds.screen.adminProgress.reset("a", "day-29")).click();
  await page.getByTestId(testIds.screen.adminProgress.resetConfirm("a", "day-29")).click();

  const clearedBeforeReEnter = await page.evaluate(() => ({
    finalExam: window.localStorage.getItem("kids_math.final_exam.v1.grade.a"),
    gmat: window.localStorage.getItem("kids_math.gmat_challenge.v1.grade.a"),
  }));
  expect(clearedBeforeReEnter.finalExam).toBeNull();
  expect(clearedBeforeReEnter.gmat).toBeNull();

  await page.goto("/grade/b");
  await expect(page).toHaveURL(/\/grade\/b\/locked/);

  await page.goto("/grade/a/day/day-29");
  await expect(page.getByText("עברת! אפשר להתחיל כיתה ב׳.")).toBeHidden();
  await expect(page.getByTestId(testIds.screen.finalExam.root("a"))).toBeVisible();
});

test("admin reset day-29 clears final exam and GMAT for grade b", async ({ page, context }) => {
  await context.addCookies([
    { name: "kids_math.unlocked_grade_b", value: "1", url: playwrightCookieUrl() },
  ]);

  await page.goto("/admin/progress?grade=b");
  await page.getByTestId(testIds.screen.adminProgress.pinInput()).fill("2109");
  await page.getByTestId(testIds.screen.adminProgress.pinSubmit()).click();

  await page.getByTestId(testIds.screen.adminProgress.markAllDaysComplete("b")).click();
  await page.getByTestId(testIds.screen.adminProgress.forceFinalExamComplete("b")).click();

  await page.goto("/grade/b/day/day-29");
  await expect(page.getByText("עברת את המבחן המסכם לכיתה ב׳!")).toBeVisible();

  await page.goto("/admin/progress?grade=b");
  await page.getByTestId(testIds.screen.adminProgress.pinInput()).fill("2109");
  await page.getByTestId(testIds.screen.adminProgress.pinSubmit()).click();
  await page.evaluate(() => {
    const state = {
      version: 1,
      grade: "b",
      createdAt: new Date().toISOString(),
      pickerVersion: 1,
      phase: "rules",
      sectionOrder: ["quant", "verbal", "data"],
      orderIndex: 0,
      itemsBySection: { quant: [], verbal: [], data: [] },
      answers: {},
      correctMap: {},
      attempts: {},
      bookmarks: { quant: [], verbal: [], data: [] },
      reviewSnapshot: null,
      sectionEndsAt: null,
      breakEndsAt: null,
    };
    window.localStorage.setItem("kids_math.gmat_challenge.v1.grade.b", JSON.stringify(state));
  });
  await page.getByTestId(testIds.screen.adminProgress.reset("b", "day-29")).click();
  await page.getByTestId(testIds.screen.adminProgress.resetConfirm("b", "day-29")).click();

  const storage = await page.evaluate(() => ({
    finalExam: window.localStorage.getItem("kids_math.final_exam.v1.grade.b"),
    gmat: window.localStorage.getItem("kids_math.gmat_challenge.v1.grade.b"),
  }));
  expect(storage.finalExam).toBeNull();
  expect(storage.gmat).toBeNull();

  await page.goto("/grade/b/day/day-29");
  await expect(page.getByText("עברת את המבחן המסכם לכיתה ב׳!")).toBeHidden();
  await expect(page.getByTestId(testIds.screen.finalExam.root("b"))).toBeVisible();
});

test("admin back navigation returns to grade picker", async ({ page }) => {
  await page.goto("/admin/progress?grade=a");
  await page.getByTestId(testIds.screen.adminProgress.pinInput()).fill("2109");
  await page.getByTestId(testIds.screen.adminProgress.pinSubmit()).click();

  await page.getByTestId(testIds.screen.adminProgress.navBack()).click();

  await expect(page.getByTestId(testIds.screen.gradePicker.root())).toBeVisible();
  await expect(page).toHaveURL("/");

  await page.goto("/admin/progress?grade=a");
  await expect(page.getByTestId(testIds.screen.adminProgress.pinInput())).toBeVisible();
});
