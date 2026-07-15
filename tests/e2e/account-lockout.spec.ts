/**
 * Account-lockout + kids-gaming login UX (roadmap Phase 1 / 1.2 + PM review).
 *
 * The login backend is API-mocked in e2e (see testUtils), so these drive the REAL LoginModal
 * against mocked login responses — verifying the child-facing behavior the unit tests can't:
 * the calm lockout countdown, the show-password toggle, and the "one more try" nudge.
 */
import { expect, test } from "@playwright/test";
import { testIds } from "@/lib/testIds";
import { mockAuthApi } from "./testUtils";

test.beforeEach(async ({ page, context }) => {
  await context.clearCookies();
  await page.goto("/");
  await page.evaluate(() => window.localStorage.clear());
  await mockAuthApi(page); // /api/auth/me → 401, default login route (overridden per test)
});

async function openLogin(page: import("@playwright/test").Page) {
  await page.goto("/");
  await page.getByTestId(testIds.component.auth.loginButton()).click();
  await expect(page.getByTestId(testIds.component.auth.loginModal())).toBeVisible();
}

test("show-password toggle reveals and re-hides the password", async ({ page }) => {
  await openLogin(page);
  const pw = page.getByTestId(testIds.component.auth.passwordInput());
  await expect(pw).toHaveAttribute("type", "password");
  await page.getByTestId(testIds.component.auth.showPasswordToggle()).click();
  await expect(pw).toHaveAttribute("type", "text");
  await page.getByTestId(testIds.component.auth.showPasswordToggle()).click();
  await expect(pw).toHaveAttribute("type", "password");
});

test("a locked account shows a calm countdown (no red error) and disables submit", async ({ page }) => {
  await page.route("/api/auth/login", (route) =>
    route.fulfill({
      status: 429,
      contentType: "application/json",
      body: JSON.stringify({ error: "locked", retryAfterSeconds: 30 }),
    }),
  );
  await openLogin(page);
  await page.getByTestId(testIds.component.auth.usernameInput()).fill("kid");
  await page.getByTestId(testIds.component.auth.passwordInput()).fill("whatever");
  await page.getByTestId(testIds.component.auth.submitButton()).click();

  const countdown = page.getByTestId(testIds.component.auth.lockoutCountdown());
  await expect(countdown).toBeVisible();
  await expect(countdown).toContainText("שניות");
  // Not shown as a punitive error box, and submit is blocked while locked.
  await expect(page.getByTestId(testIds.component.auth.errorMessage())).toHaveCount(0);
  await expect(page.getByTestId(testIds.component.auth.submitButton())).toBeDisabled();
});

test("last attempt shows the 'one more try' nudge", async ({ page }) => {
  await page.route("/api/auth/login", (route) =>
    route.fulfill({
      status: 401,
      contentType: "application/json",
      body: JSON.stringify({ error: "Invalid credentials", attemptsRemaining: 1 }),
    }),
  );
  await openLogin(page);
  await page.getByTestId(testIds.component.auth.usernameInput()).fill("kid");
  await page.getByTestId(testIds.component.auth.passwordInput()).fill("wrong");
  await page.getByTestId(testIds.component.auth.submitButton()).click();

  await expect(page.getByTestId(testIds.component.auth.errorMessage())).toContainText("ניסיון אחד");
});
