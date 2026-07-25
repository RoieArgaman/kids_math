import { expect, test } from "@playwright/test";
import { testIds } from "@/lib/testIds";

/**
 * Admin PIN gate — negative / edge paths. The happy path (block → wrong → correct →
 * cards, and unlock persistence) lives in parent-dashboard.spec.ts; this covers the
 * cases that must NOT unlock and the direct-access lock on the inner admin screens.
 */

const CORRECT_PIN = "2109";
const COOKIE_CONSENT_KEY = "kids_math.cookie_consent.v1";

test.beforeEach(async ({ page, context }) => {
  await context.clearCookies();
  await page.goto("/");
  await page.evaluate((key) => {
    window.localStorage.clear();
    window.sessionStorage.clear();
    window.localStorage.setItem(key, "1");
  }, COOKIE_CONSENT_KEY);
});

test("a wrong PIN keeps the hub locked and shows an error", async ({ page }) => {
  await page.goto("/admin");
  await page.getByTestId(testIds.screen.adminHub.pinInput()).fill("9999");
  await page.getByTestId(testIds.screen.adminHub.pinSubmit()).click();

  await expect(page.getByTestId(testIds.screen.adminHub.pinError())).toBeVisible();
  // Still locked — no cards revealed.
  await expect(page.getByTestId(testIds.screen.adminHub.progressCard())).toHaveCount(0);
});

test("wrong PIN then correct PIN recovers and unlocks", async ({ page }) => {
  await page.goto("/admin");
  const input = page.getByTestId(testIds.screen.adminHub.pinInput());

  await input.fill("0000");
  await page.getByTestId(testIds.screen.adminHub.pinSubmit()).click();
  await expect(page.getByTestId(testIds.screen.adminHub.pinError())).toBeVisible();

  await input.fill(CORRECT_PIN);
  await page.getByTestId(testIds.screen.adminHub.pinSubmit()).click();
  await expect(page.getByTestId(testIds.screen.adminHub.progressCard())).toBeVisible();
  await expect(page.getByTestId(testIds.screen.adminHub.parentDashboardCard())).toBeVisible();
});

test("direct /admin/progress is locked behind its own PIN when not unlocked", async ({ page }) => {
  await page.goto("/admin/progress");
  // The management data must not render without the PIN.
  await expect(page.getByTestId(testIds.screen.adminProgress.pinInput())).toBeVisible();
});

test("direct /admin/parent-dashboard while locked redirects to the hub PIN", async ({ page }) => {
  await page.goto("/admin/parent-dashboard");
  await expect(page).toHaveURL(/\/admin$/);
  await expect(page.getByTestId(testIds.screen.adminHub.pinInput())).toBeVisible();
});
