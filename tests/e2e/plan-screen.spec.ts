import { expect, test } from "@playwright/test";
import { routes } from "@/lib/routes";
import { testIds } from "@/lib/testIds";
import { COOKIE_CONSENT_STORAGE_KEY } from "@/lib/cookieConsent/storage";
import {
  createCompletedDayProgressState,
  createProgressState,
  seedProgressState,
} from "./testUtils";

/**
 * Study-plan screen (`/grade/[grade]/plan`) — previously only unit-tested. Covers the
 * empty (0%) state, a non-zero overall percent after seeded completions, the strands
 * section, and the RTL direction invariant.
 */

const GRADE = "a";
const planRoot = testIds.screen.plan.root(GRADE);

async function preAcceptCookies(page: import("@playwright/test").Page) {
  await page.goto(routes.gradeHome(GRADE));
  await page.evaluate((key) => window.localStorage.setItem(key, "1"), COOKIE_CONSENT_STORAGE_KEY);
}

test.describe("study plan screen", () => {
  test("fresh learner sees a 0% overall completion @smoke", async ({ page }) => {
    await preAcceptCookies(page);
    await page.goto(routes.gradePlan(GRADE));

    await expect(page.getByTestId(planRoot)).toBeVisible();
    await expect(page.getByTestId(testIds.screen.plan.overallPercent())).toHaveText("0%");
  });

  test("completed days lift the overall percent above zero", async ({ page }) => {
    await preAcceptCookies(page);
    await seedProgressState(
      page,
      GRADE,
      createProgressState({
        days: {
          "day-1": createCompletedDayProgressState("day-1"),
          "day-2": createCompletedDayProgressState("day-2"),
          "day-3": createCompletedDayProgressState("day-3"),
        },
      }),
    );
    await page.goto(routes.gradePlan(GRADE));

    const percent = page.getByTestId(testIds.screen.plan.overallPercent());
    await expect(percent).toBeVisible();
    // Non-zero: at least one digit 1-9 present, and not the empty "0%".
    await expect(percent).not.toHaveText("0%");
    await expect(percent).toHaveText(/[1-9]/);
  });

  test("renders the strands section and holds RTL direction", async ({ page }) => {
    await preAcceptCookies(page);
    await page.goto(routes.gradePlan(GRADE));

    await expect(page.getByTestId(testIds.screen.plan.strandsSection())).toBeVisible();
    await expect(page.getByTestId(testIds.screen.plan.strandsHeading())).toBeVisible();
    // The app is Hebrew-first; the document renders RTL.
    await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
  });
});
