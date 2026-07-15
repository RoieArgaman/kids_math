import { expect, test } from "@playwright/test";
import { testIds } from "@/lib/testIds";
import { mockAuthApi, TEST_USER, TEST_PASSWORD } from "./testUtils";

test.beforeEach(async ({ page, context }) => {
  await context.clearCookies();
  await page.goto("/");
  await page.evaluate(() => window.localStorage.clear());
});

test.describe("auth UI — TopBar", () => {
  test("login button is visible when not logged in", async ({ page }) => {
    await mockAuthApi(page);
    await page.goto("/");
    await expect(page.getByTestId(testIds.component.auth.loginButton())).toBeVisible();
  });

  test("avatar is NOT visible when not logged in", async ({ page }) => {
    await mockAuthApi(page);
    await page.goto("/");
    await expect(page.getByTestId(testIds.component.auth.avatar())).not.toBeVisible();
  });
});

test.describe("auth UI — Login modal", () => {
  test.beforeEach(async ({ page }) => {
    await mockAuthApi(page);
    await page.goto("/");
    await page.getByTestId(testIds.component.auth.loginButton()).click();
  });

  test("modal opens after clicking login button", async ({ page }) => {
    await expect(page.getByTestId(testIds.component.auth.loginModal())).toBeVisible();
  });

  test("modal closes on Escape key", async ({ page }) => {
    await page.keyboard.press("Escape");
    await expect(page.getByTestId(testIds.component.auth.loginModal())).not.toBeVisible();
  });

  test("modal closes when clicking the backdrop", async ({ page }) => {
    const overlay = page.getByTestId(testIds.component.auth.loginModalOverlay());
    // Click the overlay itself (not the dialog card inside it)
    await overlay.click({ position: { x: 5, y: 5 } });
    await expect(page.getByTestId(testIds.component.auth.loginModal())).not.toBeVisible();
  });

  test("submit button is disabled with empty fields", async ({ page }) => {
    await expect(page.getByTestId(testIds.component.auth.submitButton())).toBeDisabled();
  });

  test("submit button stays disabled with only username filled", async ({ page }) => {
    await page.getByTestId(testIds.component.auth.usernameInput()).fill("testuser");
    await expect(page.getByTestId(testIds.component.auth.submitButton())).toBeDisabled();
  });

  test("submit button enables when both fields filled", async ({ page }) => {
    await page.getByTestId(testIds.component.auth.usernameInput()).fill("testuser");
    await page.getByTestId(testIds.component.auth.passwordInput()).fill("anypassword");
    await expect(page.getByTestId(testIds.component.auth.submitButton())).toBeEnabled();
  });

  test("wrong credentials shows warm, blame-free Hebrew copy", async ({ page }) => {
    await page.getByTestId(testIds.component.auth.usernameInput()).fill("testuser");
    await page.getByTestId(testIds.component.auth.passwordInput()).fill("wrongpassword");
    await page.getByTestId(testIds.component.auth.submitButton()).click();
    const errorEl = page.getByTestId(testIds.component.auth.errorMessage());
    await expect(errorEl).toBeVisible();
    // Phase 1 kids-gaming copy: encouraging, not "wrong username/password".
    await expect(errorEl).toContainText("ננסה שוב");
  });
});

test.describe("auth UI — successful login", () => {
  test("login with correct credentials shows avatar and hides login button", async ({ page }) => {
    await mockAuthApi(page);
    await page.goto("/");
    await page.getByTestId(testIds.component.auth.loginButton()).click();
    await page.getByTestId(testIds.component.auth.usernameInput()).fill(TEST_USER.username);
    await page.getByTestId(testIds.component.auth.passwordInput()).fill(TEST_PASSWORD);
    await page.getByTestId(testIds.component.auth.submitButton()).click();

    await expect(page.getByTestId(testIds.component.auth.avatar())).toBeVisible();
    await expect(page.getByTestId(testIds.component.auth.loginButton())).not.toBeVisible();
  });

  test("modal closes after successful login", async ({ page }) => {
    await mockAuthApi(page);
    await page.goto("/");
    await page.getByTestId(testIds.component.auth.loginButton()).click();
    await page.getByTestId(testIds.component.auth.usernameInput()).fill(TEST_USER.username);
    await page.getByTestId(testIds.component.auth.passwordInput()).fill(TEST_PASSWORD);
    await page.getByTestId(testIds.component.auth.submitButton()).click();

    await expect(page.getByTestId(testIds.component.auth.loginModal())).not.toBeVisible();
  });
});

test.describe("auth UI — avatar dropdown", () => {
  test.beforeEach(async ({ page }) => {
    await mockAuthApi(page, { loggedIn: true });
    await page.goto("/");
    // Wait for avatar to be visible (session restored)
    await page.getByTestId(testIds.component.auth.avatar()).waitFor({ state: "visible" });
  });

  test("clicking avatar opens dropdown with logout option", async ({ page }) => {
    await page.getByTestId(testIds.component.auth.avatar()).click();
    await expect(page.getByTestId(testIds.component.auth.avatarDropdown())).toBeVisible();
    await expect(page.getByTestId(testIds.component.auth.logoutButton())).toBeVisible();
  });

  test("logout shows login button and hides avatar", async ({ page }) => {
    await page.getByTestId(testIds.component.auth.avatar()).click();
    await page.getByTestId(testIds.component.auth.logoutButton()).click();

    await expect(page.getByTestId(testIds.component.auth.loginButton())).toBeVisible();
    await expect(page.getByTestId(testIds.component.auth.avatar())).not.toBeVisible();
  });

  test("admin user sees ניהול משתמשים link in dropdown", async ({ page, context }) => {
    await context.clearCookies();
    await page.goto("/");
    await page.evaluate(() => window.localStorage.clear());
    await mockAuthApi(page, { loggedIn: true, user: { userId: "adm", username: "admin", role: "admin" } });
    await page.goto("/");
    await page.getByTestId(testIds.component.auth.avatar()).waitFor({ state: "visible" });
    await page.getByTestId(testIds.component.auth.avatar()).click();
    await expect(page.getByTestId(testIds.component.auth.adminUsersLink())).toBeVisible();
  });

  // Regression: in RTL the avatar must stay on the visual LEFT (inline-end) — even when the
  // StudentTtsToggle is hidden — and its dropdown must open fully within the viewport.
  test("avatar sits on the left (RTL) and dropdown stays within the viewport", async ({ page }) => {
    const viewport = page.viewportSize();
    expect(viewport).not.toBeNull();

    const sectionBox = await page.getByTestId(testIds.component.topBar.authSection()).boundingBox();
    expect(sectionBox).not.toBeNull();
    // RTL end → auth section center is in the left half of the screen.
    expect(sectionBox!.x + sectionBox!.width / 2).toBeLessThan(viewport!.width / 2);

    await page.getByTestId(testIds.component.auth.avatar()).click();
    const dropdown = page.getByTestId(testIds.component.auth.avatarDropdown());
    await expect(dropdown).toBeVisible();

    const box = await dropdown.boundingBox();
    expect(box).not.toBeNull();
    expect(box!.x).toBeGreaterThanOrEqual(0);
    expect(box!.x + box!.width).toBeLessThanOrEqual(viewport!.width + 1);
  });
});
