import { expect, test } from "@playwright/test";
import { testIds } from "@/lib/testIds";
import { seedMathGradeAComplete, seedSubjectGradeBUnlockCookie } from "./testUtils";

test.describe("Grade → Subject → Day: partial unlock (finish Math A only)", () => {
  test.beforeEach(async ({ page, context }) => {
    await context.clearCookies();
    await page.goto("/");
    await page.evaluate(() => window.localStorage.clear());
  });

  test("finishing Math in Grade A unlocks Grade B and ONLY the Math subject there", async ({ page }) => {
    await seedMathGradeAComplete(page);
    await page.goto("/");

    // Grade B is now enterable from the landing grade picker.
    const gradeBCta = page.getByTestId(testIds.screen.gradePicker.gradeCardCta("b"));
    await expect(gradeBCta).toBeVisible();
    await page.getByTestId(testIds.screen.gradePicker.gradeCard("b")).click();
    await expect(page).toHaveURL(/\/subjects\/b/);

    // Math open; English + Science locked with hints (per-subject prerequisite).
    await expect(page.getByTestId(testIds.screen.subjectPicker.mathCardCta())).toBeVisible();
    await expect(page.getByTestId(testIds.screen.subjectPicker.lockedHint("english"))).toBeVisible();
    await expect(page.getByTestId(testIds.screen.subjectPicker.lockedHint("science"))).toBeVisible();

    // Math B card navigates into the Grade B workbook (server gate passes via cookie).
    await page.getByTestId(testIds.screen.subjectPicker.mathCard()).click();
    await expect(page).toHaveURL(/\/grade\/b/);
  });

  test("server gate: /english/b redirects to the English locked page while Math-only is unlocked", async ({ page }) => {
    await seedMathGradeAComplete(page);

    // English B is NOT unlocked → middleware redirects to the English locked page.
    await page.goto("/english/b");
    await expect(page).toHaveURL(/\/english\/b\/locked/);
    await expect(page.getByTestId(testIds.screen.lockedGrade.root("english"))).toBeVisible();
    await expect(page.getByTestId(testIds.screen.lockedGrade.reason("english"))).toBeVisible();

    // Math B IS unlocked → its subtree is reachable.
    await page.goto("/grade/b");
    await expect(page).toHaveURL(/\/grade\/b\/?$/);
  });
});

test.describe("Grade → Subject → Day: grade-level gate (/subjects/b)", () => {
  test.beforeEach(async ({ page, context }) => {
    await context.clearCookies();
    await page.goto("/");
    await page.evaluate(() => window.localStorage.clear());
  });

  test("/subjects/b redirects to the grade-level locked page when nothing is unlocked", async ({ page }) => {
    await page.goto("/subjects/b");
    await expect(page).toHaveURL(/\/subjects\/b\/locked/);
    await expect(page.getByTestId(testIds.screen.lockedGrade.root("grade"))).toBeVisible();
  });

  test("/subjects/b is reachable once ANY subject cookie is present", async ({ page }) => {
    await seedSubjectGradeBUnlockCookie(page, "science");
    await page.goto("/subjects/b");
    await expect(page).toHaveURL(/\/subjects\/b\/?$/);
    await expect(page.getByTestId(testIds.screen.subjectPicker.root())).toBeVisible();
  });
});

test.describe("Grade → Subject → Day: edge cases & self-heal", () => {
  test.beforeEach(async ({ page, context }) => {
    await context.clearCookies();
    await page.goto("/");
    await page.evaluate(() => window.localStorage.clear());
  });

  test("reconcile self-heals a lost cookie for an earned subject (unlock-only)", async ({ page, context }) => {
    await seedMathGradeAComplete(page); // progress + passed exam + cookie
    await context.clearCookies(); // simulate cookie loss; localStorage completion remains

    // Visiting the grade picker runs reconcileGradeUnlockCookies() → re-POSTs the unlock.
    await page.goto("/");
    await expect(page.getByTestId(testIds.screen.gradePicker.gradeCardCta("b"))).toBeVisible();

    // Cookie restored → the math grade-B subtree is reachable again.
    await page.goto("/grade/b");
    await expect(page).toHaveURL(/\/grade\/b\/?$/);
  });

  test("direct deep link into a locked subtree redirects to its locked page preserving next=", async ({ page }) => {
    await page.goto("/science/b/day/day-12");
    await expect(page).toHaveURL(/\/science\/b\/locked/);
    await expect(page).toHaveURL(/next=/);
    await expect(page.getByTestId(testIds.screen.lockedGrade.root("science"))).toBeVisible();
  });

  test("invalid grade in /subjects/[grade] returns 404", async ({ page }) => {
    const res = await page.goto("/subjects/zzz");
    expect(res?.status()).toBe(404);
  });
});
