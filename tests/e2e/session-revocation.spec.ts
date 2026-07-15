/**
 * Session revocation UI (roadmap Phase 1 / S4).
 *
 * The tokenVersion revocation SEMANTICS are covered by unit tests at the route level
 * (verifySession / admin PATCH bump / progress + /me 401 / logout-all). Here we verify the
 * client-observable contract: the admin-only "log out everywhere" affordance is present, hits
 * the logout-all endpoint, and returns the user to the logged-out UI. A non-admin (child) must
 * NOT see the affordance.
 */
import { expect, test } from "@playwright/test";
import { testIds } from "@/lib/testIds";
import { mockAuthApi } from "./testUtils";

const ADMIN = { userId: "adm", username: "admin", role: "admin" as const };

test.beforeEach(async ({ page, context }) => {
  await context.clearCookies();
  await page.goto("/");
  await page.evaluate(() => window.localStorage.clear());
});

test("admin can 'log out everywhere' — calls logout-all and returns to logged-out UI", async ({ page }) => {
  await mockAuthApi(page, { loggedIn: true, user: ADMIN });
  let logoutAllCalled = false;
  await page.route("/api/auth/logout-all", (route) => {
    logoutAllCalled = true;
    return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ ok: true }) });
  });

  await page.goto("/");
  await page.getByTestId(testIds.component.auth.avatar()).waitFor({ state: "visible" });
  await page.getByTestId(testIds.component.auth.avatar()).click();

  await page.getByTestId(testIds.component.auth.logoutEverywhereButton()).click();

  await expect(page.getByTestId(testIds.component.auth.loginButton())).toBeVisible();
  await expect(page.getByTestId(testIds.component.auth.avatar())).not.toBeVisible();
  expect(logoutAllCalled).toBe(true);
});

test("a non-admin (child) does not see 'log out everywhere'", async ({ page }) => {
  await mockAuthApi(page, { loggedIn: true, user: { userId: "u1", username: "kid", role: "user" } });
  await page.goto("/");
  await page.getByTestId(testIds.component.auth.avatar()).waitFor({ state: "visible" });
  await page.getByTestId(testIds.component.auth.avatar()).click();

  await expect(page.getByTestId(testIds.component.auth.logoutButton())).toBeVisible();
  await expect(page.getByTestId(testIds.component.auth.logoutEverywhereButton())).toHaveCount(0);
});
