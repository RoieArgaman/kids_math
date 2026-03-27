import { expect, test } from "@playwright/test";
import { testIds } from "../../lib/testIds";

function getCookieUrl() {
  return process.env.PLAYWRIGHT_COOKIE_URL ?? process.env.PLAYWRIGHT_BASE_URL ?? "http://127.0.0.1:3005";
}

test.describe("grade B route gate", () => {
  test("shows locked page when unlock cookie is absent", async ({ page }) => {
    await page.goto("/grade/b");
    await expect(page).toHaveURL(/\/grade\/b\/locked/);
    await expect(page.getByTestId(testIds.screen.gradeBLocked.root())).toBeVisible();
  });

  test("can unlock via POST /api/unlock-grade-b", async ({ page }) => {
    await page.goto("/grade/b");
    await expect(page.getByTestId(testIds.screen.gradeBLocked.root())).toBeVisible();

    // Use in-browser fetch so the httpOnly cookie is stored in the browser context.
    await page.evaluate(async () => {
      const res = await fetch("/api/unlock-grade-b", { method: "POST" });
      if (!res.ok) throw new Error("unlock failed");
    });

    await page.goto("/grade/b");
    await expect(page.getByTestId(testIds.screen.home.root("b"))).toBeVisible();
  });

  test("shows grade B home when unlock cookie is set", async ({ context, page }) => {
    const cookieUrl = getCookieUrl();
    await context.addCookies([
      {
        name: "kids_math.unlocked_grade_b",
        value: "1",
        url: cookieUrl,
      },
    ]);
    await page.goto("/grade/b");
    await expect(page).toHaveURL(/\/grade\/b\/?$/);
    await expect(page.getByTestId(testIds.screen.home.root("b"))).toBeVisible();
  });

  test("keeps locked when unlock cookie value is not 1", async ({ context, page }) => {
    const cookieUrl = getCookieUrl();
    await context.addCookies([
      {
        name: "kids_math.unlocked_grade_b",
        value: "0",
        url: cookieUrl,
      },
    ]);

    await page.goto("/grade/b");
    await expect(page).toHaveURL(/\/grade\/b\/locked/);
    await expect(page.getByTestId(testIds.screen.gradeBLocked.root())).toBeVisible();
  });
});
