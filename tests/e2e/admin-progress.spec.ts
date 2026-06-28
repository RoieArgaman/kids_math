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
  await expect(page.getByTestId(testIds.screen.dayOverview.root("a", "day-2.locked"))).toBeVisible();

  await page.goto("/admin/progress?grade=a");
  await page.getByTestId(testIds.screen.adminProgress.pinInput()).fill("2109");
  await page.getByTestId(testIds.screen.adminProgress.pinSubmit()).click();
  await page.getByTestId(testIds.screen.adminProgress.markComplete("a", "day-1")).click();

  await page.goto("/grade/a/day/day-2");
  await expect(page.getByTestId(testIds.screen.dayOverview.root("a", "day-2.locked"))).toHaveCount(0);
  await expect(page.getByTestId(testIds.screen.dayOverview.root("a", "day-2"))).toBeVisible();

  const day1 = getWorkbookDaysById("a")["day-1"];
  const firstInputExercise = day1.sections
    .flatMap((section) => section.exercises)
    .find((exercise) => exercise.kind === "number_input" || exercise.kind === "number_line_jump");
  if (firstInputExercise) {
    const sectionId = firstInputExercise.id.replace(/-exercise-\d+$/, "");
    await page.goto(`/grade/a/day/day-1/section/${sectionId}`);
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
  await expect(page.getByTestId(testIds.screen.dayOverview.root("a", "day-2.locked"))).toBeVisible();

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
  await expect(page.getByTestId(testIds.screen.adminProgress.statusMessage())).toContainText("כיתה ב׳ ננעלה", {
    timeout: 15_000,
  });

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

test("admin can mark and reset per section; day completes when all sections are marked", async ({ page }) => {
  await page.goto("/admin/progress?grade=a");
  await page.getByTestId(testIds.screen.adminProgress.pinInput()).fill("2109");
  await page.getByTestId(testIds.screen.adminProgress.pinSubmit()).click();

  const day1 = getWorkbookDaysById("a")["day-1"];
  expect(day1.sections.length).toBeGreaterThan(1);

  await page.getByTestId(testIds.screen.adminProgress.daySectionsToggle("a", "day-1")).click();

  const firstSectionId = day1.sections[0]!.id;
  await page.getByTestId(testIds.screen.adminProgress.markSectionComplete("a", "day-1", firstSectionId)).click();
  await expect(page.getByTestId(testIds.screen.adminProgress.dayState("a", "day-1"))).toContainText("לא הושלם");

  for (let i = 1; i < day1.sections.length; i++) {
    const sectionId = day1.sections[i]!.id;
    await page.getByTestId(testIds.screen.adminProgress.markSectionComplete("a", "day-1", sectionId)).click();
  }
  await expect(page.getByTestId(testIds.screen.adminProgress.dayState("a", "day-1"))).toContainText("הושלם");

  await page.getByTestId(testIds.screen.adminProgress.resetSection("a", "day-1", firstSectionId)).click();
  await page.getByTestId(testIds.screen.adminProgress.resetSectionConfirm("a", "day-1", firstSectionId)).click();
  await expect(page.getByTestId(testIds.screen.adminProgress.dayState("a", "day-1"))).toContainText("לא הושלם");
});

test("admin can complete and reset English progress in its isolated store with no math side effects", async ({
  page,
}) => {
  const ENGLISH_KEY = "kids_math.english.workbook_progress.v1";
  const MATH_KEY_A = "kids_math.workbook_progress.v2.grade.a";
  const MATH_KEY_B = "kids_math.workbook_progress.v2.grade.b";

  // English must never touch the grade-B unlock chain — fail loudly if it does.
  let lockGradeBCalled = false;
  await page.route("**/api/lock-grade-b", async (route) => {
    lockGradeBCalled = true;
    await route.fulfill({ status: 200, body: "{}" });
  });

  await page.goto("/admin/progress");
  await page.getByTestId(testIds.screen.adminProgress.pinInput()).fill("2109");
  await page.getByTestId(testIds.screen.adminProgress.pinSubmit()).click();

  // Switch to the English subject (defaults to the first level, Pre-A1).
  await page.getByTestId(testIds.screen.adminProgress.subjectSelect()).selectOption("english");

  // No final-exam control exists for English.
  await expect(page.getByTestId(testIds.screen.adminProgress.forceFinalExamComplete("english"))).toHaveCount(0);

  // Mark English day-1 complete.
  await page.getByTestId(testIds.screen.adminProgress.markComplete("english", "day-1")).click();
  await expect(page.getByTestId(testIds.screen.adminProgress.dayState("english", "day-1"))).toContainText("הושלם");

  // Written to the English store; math stores untouched.
  const afterComplete = await page.evaluate(
    (keys) => ({
      english: window.localStorage.getItem(keys.english),
      mathA: window.localStorage.getItem(keys.mathA),
      mathB: window.localStorage.getItem(keys.mathB),
    }),
    { english: ENGLISH_KEY, mathA: MATH_KEY_A, mathB: MATH_KEY_B },
  );
  expect(afterComplete.english).not.toBeNull();
  expect(JSON.parse(afterComplete.english!).days["day-1"].isComplete).toBe(true);
  expect(afterComplete.mathA).toBeNull();
  expect(afterComplete.mathB).toBeNull();

  // Reset English day-1.
  await page.getByTestId(testIds.screen.adminProgress.reset("english", "day-1")).click();
  await page.getByTestId(testIds.screen.adminProgress.resetConfirm("english", "day-1")).click();
  await expect(page.getByTestId(testIds.screen.adminProgress.dayState("english", "day-1"))).toContainText("לא הושלם");

  const afterReset = await page.evaluate((key) => window.localStorage.getItem(key), ENGLISH_KEY);
  expect(JSON.parse(afterReset!).days["day-1"].isComplete).toBe(false);

  expect(lockGradeBCalled).toBe(false);
});

test("admin can complete and reset Science progress in its isolated store with no math side effects", async ({
  page,
}) => {
  const SCIENCE_KEY = "kids_math.science.workbook_progress.v1";
  const MATH_KEY_A = "kids_math.workbook_progress.v2.grade.a";
  const ENGLISH_KEY = "kids_math.english.workbook_progress.v1";

  // Science must never touch the grade-B unlock chain — fail loudly if it does.
  let lockGradeBCalled = false;
  await page.route("**/api/lock-grade-b", async (route) => {
    lockGradeBCalled = true;
    await route.fulfill({ status: 200, body: "{}" });
  });

  await page.goto("/admin/progress");
  await page.getByTestId(testIds.screen.adminProgress.pinInput()).fill("2109");
  await page.getByTestId(testIds.screen.adminProgress.pinSubmit()).click();

  // Switch to the Science subject (defaults to the first level, כיתה א׳).
  await page.getByTestId(testIds.screen.adminProgress.subjectSelect()).selectOption("science");

  // No final-exam control exists for Science (isolated store, like English).
  await expect(page.getByTestId(testIds.screen.adminProgress.forceFinalExamComplete("science"))).toHaveCount(0);

  // Mark Science day-1 complete.
  await page.getByTestId(testIds.screen.adminProgress.markComplete("science", "day-1")).click();
  await expect(page.getByTestId(testIds.screen.adminProgress.dayState("science", "day-1"))).toContainText("הושלם");

  // Written to the Science store; math + english stores untouched.
  const afterComplete = await page.evaluate(
    (keys) => ({
      science: window.localStorage.getItem(keys.science),
      mathA: window.localStorage.getItem(keys.mathA),
      english: window.localStorage.getItem(keys.english),
    }),
    { science: SCIENCE_KEY, mathA: MATH_KEY_A, english: ENGLISH_KEY },
  );
  expect(afterComplete.science).not.toBeNull();
  expect(JSON.parse(afterComplete.science!).days["day-1"].isComplete).toBe(true);
  expect(afterComplete.mathA).toBeNull();
  expect(afterComplete.english).toBeNull();

  // Reset Science day-1.
  await page.getByTestId(testIds.screen.adminProgress.reset("science", "day-1")).click();
  await page.getByTestId(testIds.screen.adminProgress.resetConfirm("science", "day-1")).click();
  await expect(page.getByTestId(testIds.screen.adminProgress.dayState("science", "day-1"))).toContainText("לא הושלם");

  const afterReset = await page.evaluate((key) => window.localStorage.getItem(key), SCIENCE_KEY);
  expect(JSON.parse(afterReset!).days["day-1"].isComplete).toBe(false);

  expect(lockGradeBCalled).toBe(false);
});

test("admin sub-track dropdown filters English days by level (Pre-A1 vs A1)", async ({ page }) => {
  await page.goto("/admin/progress");
  await page.getByTestId(testIds.screen.adminProgress.pinInput()).fill("2109");
  await page.getByTestId(testIds.screen.adminProgress.pinSubmit()).click();

  // English defaults to its first level (Pre-A1): day-1 shown, A1's day-15 hidden.
  await page.getByTestId(testIds.screen.adminProgress.subjectSelect()).selectOption("english");
  await expect(page.getByTestId(testIds.screen.adminProgress.dayRow("english", "day-1"))).toBeVisible();
  await expect(page.getByTestId(testIds.screen.adminProgress.dayRow("english", "day-15"))).toHaveCount(0);

  // Switch the sub-track to A1 (level b): A1's day-15 shown, Pre-A1's day-1 hidden.
  await page.getByTestId(testIds.screen.adminProgress.gradeSelect()).selectOption("b");
  await expect(page.getByTestId(testIds.screen.adminProgress.dayRow("english", "day-15"))).toBeVisible();
  await expect(page.getByTestId(testIds.screen.adminProgress.dayRow("english", "day-1"))).toHaveCount(0);
});

test("admin sub-track dropdown filters Science days by level (כיתה א׳ vs ב׳)", async ({ page }) => {
  await page.goto("/admin/progress");
  await page.getByTestId(testIds.screen.adminProgress.pinInput()).fill("2109");
  await page.getByTestId(testIds.screen.adminProgress.pinSubmit()).click();

  // Science defaults to level א׳: day-1 shown, level ב׳'s day-11 hidden.
  await page.getByTestId(testIds.screen.adminProgress.subjectSelect()).selectOption("science");
  await expect(page.getByTestId(testIds.screen.adminProgress.dayRow("science", "day-1"))).toBeVisible();
  await expect(page.getByTestId(testIds.screen.adminProgress.dayRow("science", "day-11"))).toHaveCount(0);

  // Switch the sub-track to level ב׳: day-11 shown, level א׳'s day-1 hidden.
  await page.getByTestId(testIds.screen.adminProgress.gradeSelect()).selectOption("b");
  await expect(page.getByTestId(testIds.screen.adminProgress.dayRow("science", "day-11"))).toBeVisible();
  await expect(page.getByTestId(testIds.screen.adminProgress.dayRow("science", "day-1"))).toHaveCount(0);
});

test("admin refresh re-reads progress from storage without re-prompting the PIN", async ({ page }) => {
  const ENGLISH_KEY = "kids_math.english.workbook_progress.v1";

  await page.goto("/admin/progress");
  await page.getByTestId(testIds.screen.adminProgress.pinInput()).fill("2109");
  await page.getByTestId(testIds.screen.adminProgress.pinSubmit()).click();

  // Use English (isolated store, no grade-B side effects).
  await page.getByTestId(testIds.screen.adminProgress.subjectSelect()).selectOption("english");
  await page.getByTestId(testIds.screen.adminProgress.markComplete("english", "day-1")).click();
  await expect(page.getByTestId(testIds.screen.adminProgress.dayState("english", "day-1"))).toContainText("הושלם");

  // Mutate the store out-of-band, then refresh: the screen must reflect the new
  // storage state (proves a real re-read) while keeping the admin session (no PIN).
  await page.evaluate((key) => window.localStorage.removeItem(key), ENGLISH_KEY);
  await page.getByTestId(testIds.screen.adminProgress.refresh()).click();

  await expect(page.getByTestId(testIds.screen.adminProgress.dayState("english", "day-1"))).toContainText("לא הושלם");
  await expect(page.getByTestId(testIds.screen.adminProgress.statusMessage())).toContainText("הנתונים עודכנו");
  await expect(page.getByTestId(testIds.screen.adminProgress.pinInput())).toHaveCount(0);
});

test("admin back navigation returns to the hub, still unlocked", async ({ page }) => {
  await page.goto("/admin/progress?grade=a");
  await page.getByTestId(testIds.screen.adminProgress.pinInput()).fill("2109");
  await page.getByTestId(testIds.screen.adminProgress.pinSubmit()).click();

  await page.getByTestId(testIds.screen.adminProgress.navBack()).click();

  // Back returns to the /admin hub and keeps the unlock (no PIN re-prompt).
  await expect(page).toHaveURL(/\/admin$/);
  await expect(page.getByTestId(testIds.screen.adminHub.progressCard())).toBeVisible();
  await expect(page.getByTestId(testIds.screen.adminHub.pinInput())).toHaveCount(0);
});
