import { expect, test } from "@playwright/test";
import { testIds } from "@/lib/testIds";

test.describe("subject picker (home)", () => {
  test.beforeEach(async ({ page, context }) => {
    await context.clearCookies();
    await page.goto("/");
    await page.evaluate(() => window.localStorage.clear());
  });

  test("home shows Math and English subjects", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByTestId(testIds.screen.subjectPicker.root())).toBeVisible();
    await expect(page.getByTestId(testIds.screen.subjectPicker.mathCard())).toBeVisible();
    await expect(page.getByTestId(testIds.screen.subjectPicker.englishCard())).toBeVisible();
  });

  test("Math leads to the grade picker at /math", async ({ page }) => {
    await page.goto("/");
    await page.getByTestId(testIds.screen.subjectPicker.mathCardCta()).click();
    await expect(page).toHaveURL(/\/math$/);
    await expect(page.getByTestId(testIds.screen.gradePicker.root())).toBeVisible();
    await expect(page.getByTestId(testIds.screen.gradePicker.gradeCard("a"))).toBeVisible();
    await expect(page.getByTestId(testIds.screen.gradePicker.gradeCard("b"))).toBeVisible();
  });

  test("grade picker can return to the subject picker", async ({ page }) => {
    await page.goto("/math");
    await page.getByTestId(testIds.screen.gradePicker.navBack()).click();
    await expect(page).toHaveURL(/\/$/);
    await expect(page.getByTestId(testIds.screen.subjectPicker.root())).toBeVisible();
  });

  test("English leads to the English home", async ({ page }) => {
    await page.goto("/");
    await page.getByTestId(testIds.screen.subjectPicker.englishCardCta()).click();
    await expect(page).toHaveURL(/\/english$/);
    await expect(page.getByTestId(testIds.screen.english.home.root())).toBeVisible();
  });
});

test.describe("math grade picker — grade B unlock gating", () => {
  test.beforeEach(async ({ page, context }) => {
    await context.clearCookies();
    await page.goto("/math");
    await page.evaluate(() => window.localStorage.clear());
  });

  test("grade B card is locked (inert, no CTA) before grade A final exam is passed", async ({ page }) => {
    await page.goto("/math");
    const gradeBCard = page.getByTestId(testIds.screen.gradePicker.gradeCard("b"));
    await expect(gradeBCard).toBeVisible();
    // Inert: rendered as a non-navigating element with no CTA link.
    await expect(gradeBCard).not.toHaveAttribute("href", /.*/);
    await expect(page.getByTestId(testIds.screen.gradePicker.gradeCardCta("b"))).toHaveCount(0);
    // Clicking it must not enter grade B.
    await gradeBCard.click();
    await expect(page).toHaveURL(/\/math$/);
  });

  test("?previewAll=1 unlocks the grade B card (QA bypass)", async ({ page }) => {
    await page.goto("/math?previewAll=1");
    const gradeBCard = page.getByTestId(testIds.screen.gradePicker.gradeCard("b"));
    await expect(gradeBCard).toBeVisible();
    await expect(page.getByTestId(testIds.screen.gradePicker.gradeCardCta("b"))).toBeVisible();
    await gradeBCard.click();
    await expect(page).toHaveURL(/\/grade\/b/);
  });

  test("passing grade A final exam unlocks the grade B card", async ({ page }) => {
    // Seed a full, valid passed FinalExamState for grade A
    // (loadFinalExamState requires exactly FINAL_EXAM_QUESTION_COUNT ids).
    await page.evaluate(() => {
      const ids = Array.from({ length: 30 }, (_, i) => `q${i}`);
      const state = {
        version: 1,
        grade: "a",
        createdAt: new Date().toISOString(),
        pickerVersion: 1,
        selectedExerciseIds: ids,
        answers: {},
        correctMap: {},
        attempts: {},
        submittedAt: new Date().toISOString(),
        scorePercent: 90,
        passed: true,
      };
      window.localStorage.setItem("kids_math.final_exam.v1.grade.a", JSON.stringify(state));
    });
    await page.reload();
    const gradeBCard = page.getByTestId(testIds.screen.gradePicker.gradeCard("b"));
    await expect(gradeBCard).toBeVisible();
    await expect(page.getByTestId(testIds.screen.gradePicker.gradeCardCta("b"))).toBeVisible();
  });
});
