import { expect, test } from "@playwright/test";
import { testIds } from "@/lib/testIds";
import { seedSubjectGradeBUnlockCookie } from "./testUtils";

/**
 * Per-subject Grade-B unlock isolation (server cookie gate). grade-subject-flow.spec.ts
 * proves the Math-only case; this proves the symmetric English-only and Science-only
 * cases — one subject's cookie must open ONLY its own `/…/b` subtree. The middleware
 * gates `/grade/b`, `/english/b`, `/science/b` on independent per-subject cookies.
 *
 * Note: these assert the SERVER gate (cookie → subtree reachable/locked). The subject
 * picker's per-card CTA-vs-hint is driven by client completion state, covered elsewhere.
 */

test.beforeEach(async ({ page, context }) => {
  await context.clearCookies();
  await page.goto("/");
  await page.evaluate(() => window.localStorage.clear());
});

test("English unlocked: /english/b is reachable while Math and Science stay locked", async ({ page }) => {
  await seedSubjectGradeBUnlockCookie(page, "english");

  await page.goto("/english/b");
  await expect(page).toHaveURL(/\/english\/b\/?$/);

  await page.goto("/grade/b");
  await expect(page).toHaveURL(/\/grade\/b\/locked/);
  await expect(page.getByTestId(testIds.screen.gradeBLocked.root())).toBeVisible();

  await page.goto("/science/b");
  await expect(page).toHaveURL(/\/science\/b\/locked/);
  await expect(page.getByTestId(testIds.screen.lockedGrade.root("science"))).toBeVisible();
});

test("Science unlocked: /science/b is reachable while Math and English stay locked", async ({ page }) => {
  await seedSubjectGradeBUnlockCookie(page, "science");

  await page.goto("/science/b");
  await expect(page).toHaveURL(/\/science\/b\/?$/);

  await page.goto("/grade/b");
  await expect(page).toHaveURL(/\/grade\/b\/locked/);
  await expect(page.getByTestId(testIds.screen.gradeBLocked.root())).toBeVisible();

  await page.goto("/english/b");
  await expect(page).toHaveURL(/\/english\/b\/locked/);
  await expect(page.getByTestId(testIds.screen.lockedGrade.root("english"))).toBeVisible();
});

test("any single subject cookie opens the /subjects/b grade-level picker", async ({ page }) => {
  await seedSubjectGradeBUnlockCookie(page, "english");
  await page.goto("/subjects/b");
  await expect(page).toHaveURL(/\/subjects\/b\/?$/);
  await expect(page.getByTestId(testIds.screen.subjectPicker.root())).toBeVisible();
});

test("deep link into locked /english/b subtree preserves next=", async ({ page }) => {
  await page.goto("/english/b/day/day-3");
  await expect(page).toHaveURL(/\/english\/b\/locked/);
  await expect(page).toHaveURL(/next=/);
});
