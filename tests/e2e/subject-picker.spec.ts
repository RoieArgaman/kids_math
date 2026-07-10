import { expect, test } from "@playwright/test";
import { testIds } from "@/lib/testIds";

test.describe("grade picker (landing)", () => {
  test.beforeEach(async ({ page, context }) => {
    await context.clearCookies();
    await page.goto("/");
    await page.evaluate(() => window.localStorage.clear());
  });

  test("landing `/` shows the grade picker with Grade A and Grade B cards", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByTestId(testIds.screen.gradePicker.root())).toBeVisible();
    await expect(page.getByTestId(testIds.screen.gradePicker.gradeCard("a"))).toBeVisible();
    await expect(page.getByTestId(testIds.screen.gradePicker.gradeCard("b"))).toBeVisible();
  });

  test("Grade B is locked (inert, with reason) in a fresh state", async ({ page }) => {
    await page.goto("/");
    const gradeBCard = page.getByTestId(testIds.screen.gradePicker.gradeCard("b"));
    await expect(gradeBCard).toBeVisible();
    await expect(gradeBCard).not.toHaveAttribute("href", /.*/);
    await expect(page.getByTestId(testIds.screen.gradePicker.gradeCardCta("b"))).toHaveCount(0);
    await expect(page.getByTestId(testIds.screen.gradePicker.gradeLockedHint("b"))).toBeVisible();
  });

  test("Grade A leads to the subject picker with all three subjects open", async ({ page }) => {
    await page.goto("/");
    await page.getByTestId(testIds.screen.gradePicker.gradeCard("a")).click();
    await expect(page).toHaveURL(/\/subjects\/a/);
    await expect(page.getByTestId(testIds.screen.subjectPicker.root())).toBeVisible();
    await expect(page.getByTestId(testIds.screen.subjectPicker.mathCardCta())).toBeVisible();
    await expect(page.getByTestId(testIds.screen.subjectPicker.englishCardCta())).toBeVisible();
    await expect(page.getByTestId(testIds.screen.subjectPicker.scienceCardCta())).toBeVisible();
  });

  test("subject picker can return to the grade picker; Math leads into the workbook", async ({ page }) => {
    await page.goto("/subjects/a");
    await page.getByTestId(testIds.screen.subjectPicker.navBack()).click();
    await expect(page).toHaveURL(/\/$/);
    await expect(page.getByTestId(testIds.screen.gradePicker.root())).toBeVisible();

    await page.goto("/subjects/a");
    await page.getByTestId(testIds.screen.subjectPicker.mathCard()).click();
    await expect(page).toHaveURL(/\/grade\/a/);
  });

  test("?previewAll=1 unlocks the Grade B card (QA bypass)", async ({ page }) => {
    await page.goto("/?previewAll=1");
    const gradeBCard = page.getByTestId(testIds.screen.gradePicker.gradeCard("b"));
    await expect(page.getByTestId(testIds.screen.gradePicker.gradeCardCta("b"))).toBeVisible();
    await gradeBCard.click();
    await expect(page).toHaveURL(/\/subjects\/b/);
  });

  test("legacy /math and /english redirect to the grade picker", async ({ page }) => {
    await page.goto("/math");
    await expect(page).toHaveURL(/\/$/);
    await expect(page.getByTestId(testIds.screen.gradePicker.root())).toBeVisible();

    await page.goto("/english");
    await expect(page).toHaveURL(/\/$/);
    await expect(page.getByTestId(testIds.screen.gradePicker.root())).toBeVisible();
  });
});
