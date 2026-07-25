import { expect, test } from "@playwright/test";
import { routes } from "@/lib/routes";
import { childTid, testIds } from "@/lib/testIds";
import { COOKIE_CONSENT_STORAGE_KEY } from "@/lib/cookieConsent/storage";
import { seedBadgeState } from "./testUtils";
import type { BadgeState } from "@/lib/badges/types";

/**
 * Badge gallery (`/grade/[grade]/badges`) — previously only unit-tested. Covers the
 * empty state, the earned-vs-locked rendering, and the progress counter, driven by a
 * seeded BadgeState so no full-day completion is needed.
 */

const GRADE = "a";
const badgesRoot = testIds.screen.badges.root(GRADE);

async function preAcceptCookies(page: import("@playwright/test").Page) {
  await page.goto(routes.gradeHome(GRADE));
  await page.evaluate((key) => window.localStorage.setItem(key, "1"), COOKIE_CONSENT_STORAGE_KEY);
}

function badgeState(unlockedIds: string[]): BadgeState {
  return {
    version: 1,
    grade: GRADE,
    unlocked: unlockedIds.map((id) => ({ id: id as BadgeState["unlocked"][number]["id"], unlockedAt: new Date().toISOString() })),
    seenIds: [],
    updatedAt: new Date().toISOString(),
  };
}

test.describe("badge gallery", () => {
  test("fresh learner sees the empty state and a 0-of-N counter @smoke", async ({ page }) => {
    await preAcceptCookies(page);
    await seedBadgeState(page, GRADE, badgeState([]));
    await page.goto(routes.gradeBadges(GRADE));

    await expect(page.getByTestId(badgesRoot)).toBeVisible();
    await expect(page.getByTestId(childTid(badgesRoot, "emptyState"))).toBeVisible();
    await expect(page.getByTestId(childTid(badgesRoot, "progressCounter", "count"))).toContainText("0 /");
  });

  test("earned badges render unlocked while others stay locked", async ({ page }) => {
    await preAcceptCookies(page);
    await seedBadgeState(page, GRADE, badgeState(["first-day-done", "halfway-there"]));
    await page.goto(routes.gradeBadges(GRADE));

    await expect(page.getByTestId(badgesRoot)).toBeVisible();
    // No empty state once something is unlocked.
    await expect(page.getByTestId(childTid(badgesRoot, "emptyState"))).toHaveCount(0);
    await expect(page.getByTestId(childTid(badgesRoot, "progressCounter", "count"))).toContainText("2 /");

    // Earned cards are not locked…
    const earned = page.getByTestId(testIds.screen.badges.badgeCard("first-day-done"));
    await expect(earned).toBeVisible();
    await expect(earned).not.toHaveClass(/is-locked/);

    // …a never-earned card is locked.
    const locked = page.getByTestId(testIds.screen.badges.badgeCard("grand-master"));
    await expect(locked).toBeVisible();
    await expect(locked).toHaveClass(/is-locked/);
  });

  test("gallery renders its category sections and back navigation", async ({ page }) => {
    await preAcceptCookies(page);
    await seedBadgeState(page, GRADE, badgeState(["first-day-done"]));
    await page.goto(routes.gradeBadges(GRADE));

    // Categories are the gallery's structural backbone — assert a couple render.
    await expect(page.getByTestId(childTid(badgesRoot, "category", "progress"))).toBeVisible();
    await expect(page.getByTestId(childTid(badgesRoot, "category", "champion"))).toBeVisible();
    // Nav back to the grade home is present.
    await expect(page.getByTestId(childTid(badgesRoot, "nav"))).toBeVisible();
  });
});
