import { expect, test } from "@playwright/test";
import { testIds } from "@/lib/testIds";

function getCookieUrl(): string {
  return process.env.PLAYWRIGHT_COOKIE_URL ?? process.env.PLAYWRIGHT_BASE_URL ?? "http://127.0.0.1:3005";
}

test.describe("grade B negative gate", () => {
  test.beforeEach(async ({ page, context }) => {
    await context.clearCookies();
    await page.goto("/");
    await page.evaluate(() => window.localStorage.clear());
  });

  test("deep grade-B link redirects to locked with next= carrying the original path", async ({ page }) => {
    const deepPath = "/grade/b/day/day-1";
    await page.goto(deepPath);

    // Middleware redirects unauthorized deep links to the locked page.
    await expect(page).toHaveURL(/\/grade\/b\/locked/);

    // The original path is preserved in the next= query param.
    const url = new URL(page.url());
    expect(url.searchParams.get("next")).toBe(deepPath);

    await expect(page.getByTestId(testIds.screen.gradeBLocked.root())).toBeVisible();
  });

  test("bare /grade/b also redirects to locked when cookie is absent", async ({ page }) => {
    await page.goto("/grade/b");
    await expect(page).toHaveURL(/\/grade\/b\/locked/);

    const url = new URL(page.url());
    expect(url.searchParams.get("next")).toBe("/grade/b");

    await expect(page.getByTestId(testIds.screen.gradeBLocked.root())).toBeVisible();
  });

  test("locked page exposes both CTAs", async ({ page }) => {
    await page.goto("/grade/b/day/day-1");
    await expect(page.getByTestId(testIds.screen.gradeBLocked.root())).toBeVisible();

    await expect(page.getByTestId(testIds.screen.gradeBLocked.continueGradeA())).toBeVisible();
    await expect(page.getByTestId(testIds.screen.gradeBLocked.goFinalExam())).toBeVisible();
  });

  test("positive contrast: with unlock cookie /grade/b is NOT redirected to locked", async ({ context, page }) => {
    // Copy how grade-b-lifecycle sets the unlock cookie.
    await context.addCookies([
      {
        name: "kids_math.unlocked_grade_b",
        value: "1",
        url: getCookieUrl(),
      },
    ]);

    await page.goto("/grade/b");
    await expect(page).toHaveURL(/\/grade\/b\/?$/);
    await expect(page).not.toHaveURL(/\/grade\/b\/locked/);
    await expect(page.getByTestId(testIds.screen.home.root("b"))).toBeVisible();
  });
});
