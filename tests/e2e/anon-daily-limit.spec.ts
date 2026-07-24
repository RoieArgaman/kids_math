import { expect, test } from "@playwright/test";
import { testIds } from "@/lib/testIds";
import { mockAuthApi, TEST_USER, TEST_PASSWORD } from "./testUtils";

const mathDay1 = testIds.screen.dayOverview.root("a", "day-1");
const englishDay1 = testIds.screen.english.day.root("day-1");
const englishAnonLock = testIds.screen.anonDailyLimit.root("english");
const englishLoginCta = testIds.screen.anonDailyLimit.loginCta("english");

// Freemium access gating (Phase 5): an anonymous visitor may open one workbook day,
// in one subject, per calendar day. The cap is a soft conversion nudge; logging in
// lifts it entirely.
test.describe("anon daily limit", () => {
  test.beforeEach(async ({ page, context }) => {
    await context.clearCookies();
    await page.goto("/");
    await page.evaluate(() => window.localStorage.clear());
    await mockAuthApi(page); // anonymous by default
  });

  test("one subject/day is free; a second subject is capped; the claimed day stays open", async ({
    page,
  }) => {
    // First open claims today's free slot.
    await page.goto("/grade/a/day/day-1");
    await expect(page.getByTestId(mathDay1)).toBeVisible();

    // A different subject the same day is capped (the cross-subject case is the
    // gate's main teeth — a first day in another subject isn't progression-locked).
    await page.goto("/english/a/day/day-1");
    await expect(page.getByTestId(englishAnonLock)).toBeVisible();

    // The originally-claimed day stays re-openable so the child can finish it.
    await page.goto("/grade/a/day/day-1");
    await expect(page.getByTestId(mathDay1)).toBeVisible();
  });

  test("logging in from the lock lifts the cap in place", async ({ page }) => {
    await page.goto("/grade/a/day/day-1");
    await expect(page.getByTestId(mathDay1)).toBeVisible();

    await page.goto("/english/a/day/day-1");
    await expect(page.getByTestId(englishAnonLock)).toBeVisible();

    // Sign in via the lock's own CTA.
    await page.getByTestId(englishLoginCta).click();
    await page.getByTestId(testIds.component.auth.usernameInput()).fill(TEST_USER.username);
    await page.getByTestId(testIds.component.auth.passwordInput()).fill(TEST_PASSWORD);
    await page.getByTestId(testIds.component.auth.submitButton()).click();

    // The screen re-renders unlocked — logged-in users are never metered.
    await expect(page.getByTestId(englishAnonLock)).toHaveCount(0);
    await expect(page.getByTestId(englishDay1)).toBeVisible();
  });
});
