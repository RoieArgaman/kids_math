/**
 * Backward-compatibility E2E tests.
 *
 * Verifies that the new TopBar + AuthProvider do not break any existing
 * non-logged-in learning flows. Every test here simulates an unauthenticated
 * user and asserts the learning experience is identical to pre-auth behavior.
 */
import { expect, test } from "@playwright/test";
import { testIds } from "@/lib/testIds";
import { createProgressState, createCompletedDayProgressState, seedProgressState, mockAuthApi } from "./testUtils";

test.beforeEach(async ({ page, context }) => {
  await context.clearCookies();
  await page.goto("/");
  await page.evaluate(() => window.localStorage.clear());
});

test.describe("TopBar presence — non-intrusive", () => {
  test("TopBar renders on every page without hiding content", async ({ page }) => {
    await mockAuthApi(page); // 401 on /api/auth/me → silent
    await page.goto("/grade/a");

    const topBar = page.getByTestId(testIds.component.auth.topBar());
    await expect(topBar).toBeVisible();

    // Day cards below TopBar are still accessible
    const dayCard = page.getByTestId(testIds.screen.home.dayCard("day-1"));
    await expect(dayCard).toBeVisible();
  });

  test("login button is visible and not overlapping day cards", async ({ page }) => {
    await mockAuthApi(page);
    await page.goto("/grade/a");

    const loginBtn = page.getByTestId(testIds.component.auth.loginButton());
    await expect(loginBtn).toBeVisible();

    const topBarBox = await page.getByTestId(testIds.component.auth.topBar()).boundingBox();
    const dayCardBox = await page.getByTestId(testIds.screen.home.dayCard("day-1")).boundingBox();

    // TopBar must end above where day cards begin
    if (topBarBox && dayCardBox) {
      expect(topBarBox.y + topBarBox.height).toBeLessThanOrEqual(dayCardBox.y + 10);
    }
  });
});

test.describe("Non-logged-in: /api/auth/me 401 handled silently", () => {
  test("app renders without errors when /api/auth/me returns 401", async ({ page }) => {
    const consoleErrors: string[] = [];
    page.on("console", (msg) => {
      if (msg.type() === "error") consoleErrors.push(msg.text());
    });

    // No route mock — real server returns 401 for /api/auth/me (no session cookie)
    await page.goto("/grade/a");
    await expect(page.getByTestId(testIds.screen.home.root("a"))).toBeVisible();

    // Filter out known benign messages (e.g. favicon 404 in test env)
    const authErrors = consoleErrors.filter(
      (e) => e.includes("AuthProvider") || e.includes("auth/me") || e.includes("Unhandled"),
    );
    expect(authErrors).toHaveLength(0);
  });

  test("subject picker loads correctly with TopBar present", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByTestId(testIds.screen.subjectPicker.root())).toBeVisible();
    await expect(page.getByTestId(testIds.component.auth.topBar())).toBeVisible();
  });
});

test.describe("Non-logged-in: progress saved to localStorage as before", () => {
  test("completed day-1 persists in localStorage after reload", async ({ page }) => {
    await seedProgressState(
      page,
      "a",
      createProgressState({ days: { "day-1": createCompletedDayProgressState("day-1") } }),
    );

    await page.goto("/grade/a");

    const day1Card = page.getByTestId(testIds.screen.home.dayCard("day-1"));
    await expect(day1Card).toContainText("הוּשְׁלַם");

    // Reload — localStorage progress must survive
    await page.reload();
    await expect(page.getByTestId(testIds.screen.home.dayCard("day-1"))).toContainText("הוּשְׁלַם");
  });

  test("multiple completed days show correct state without auth", async ({ page }) => {
    await seedProgressState(
      page,
      "a",
      createProgressState({
        days: {
          "day-1": createCompletedDayProgressState("day-1"),
          "day-2": createCompletedDayProgressState("day-2"),
        },
      }),
    );

    await page.goto("/grade/a");

    await expect(page.getByTestId(testIds.screen.home.dayCard("day-1"))).toContainText("הוּשְׁלַם");
    await expect(page.getByTestId(testIds.screen.home.dayCard("day-2"))).toContainText("הוּשְׁלַם");
    // day-3 should be open (unlocked by completing day-2)
    await expect(page.getByTestId(testIds.screen.home.dayCard("day-3"))).toContainText("בֹּאוּ נִלְמַד");
  });

  test("localStorage data is unaffected by the presence of AuthProvider", async ({ page }) => {
    const GRADE_A_KEY = "kids_math.workbook_progress.v2.grade.a";

    await seedProgressState(
      page,
      "a",
      createProgressState({ days: { "day-1": createCompletedDayProgressState("day-1") } }),
    );

    await page.goto("/grade/a");

    // Wait for home screen to hydrate
    await page.getByTestId(testIds.screen.home.root("a")).waitFor({ state: "visible" });

    // localStorage value must still match what we seeded
    const stored = await page.evaluate(
      (key) => window.localStorage.getItem(key),
      GRADE_A_KEY,
    );
    expect(stored).toBeTruthy();
    const parsed = JSON.parse(stored!) as { days: Record<string, { isComplete: boolean }> };
    expect(parsed.days["day-1"]?.isComplete).toBe(true);
  });
});

test.describe("Non-logged-in: navigation to sub-screens unchanged", () => {
  test("day overview screen loads correctly without auth", async ({ page }) => {
    await page.goto("/grade/a/day/day-1");
    await expect(page.getByTestId(testIds.screen.dayOverview.root("a", "day-1"))).toBeVisible();
    // TopBar present but not interfering
    await expect(page.getByTestId(testIds.component.auth.topBar())).toBeVisible();
  });
});
