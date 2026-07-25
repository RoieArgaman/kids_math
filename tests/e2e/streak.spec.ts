import { expect, test } from "@playwright/test";
import { routes } from "@/lib/routes";
import { childTid, testIds } from "@/lib/testIds";
import { COOKIE_CONSENT_STORAGE_KEY } from "@/lib/cookieConsent/storage";
import { readLocalStorage, seedStreakState, STORAGE_KEYS } from "./testUtils";

/**
 * Daily-streak feature (was unit-only before this spec). The grade home recomputes
 * the streak on mount from the seeded state, so these cover the three observable
 * outcomes: a stable same-day streak, the implicit first-visit streak, and the
 * next-day increment that crosses a milestone and persists.
 */

const GRADE = "a";
const streakBadgeTid = childTid(testIds.screen.home.root(GRADE), "streakBadge");

function localToday(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function localDaysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

async function preAcceptCookies(page: import("@playwright/test").Page) {
  await page.goto(routes.gradeHome(GRADE));
  await page.evaluate((key) => window.localStorage.setItem(key, "1"), COOKIE_CONSENT_STORAGE_KEY);
}

test.describe("daily streak @smoke", () => {
  test("a seeded same-day streak renders its count on the grade home", async ({ page }) => {
    await preAcceptCookies(page);
    await seedStreakState(page, { days: 3, longest: 5, lastActiveDate: localToday(), earnedBadges: ["streak_3"] });
    await page.goto(routes.gradeHome(GRADE));

    const badge = page.getByTestId(streakBadgeTid);
    await expect(badge).toBeVisible();
    await expect(badge).toContainText("3 ימים ברצף");
  });

  test("a fresh learner (no streak stored) shows the day-1 streak", async ({ page }) => {
    await preAcceptCookies(page);
    // No seedStreakState → HomeScreen computes the first-ever visit → streak of 1.
    await page.goto(routes.gradeHome(GRADE));

    const badge = page.getByTestId(streakBadgeTid);
    await expect(badge).toBeVisible();
    await expect(badge).toContainText("יום 1 ברצף");

    // The computed first-visit state must persist to storage.
    const stored = await readLocalStorage<{ currentStreak: number }>(page, STORAGE_KEYS.streak);
    expect(stored?.currentStreak).toBe(1);
  });

  test("visiting the next day increments the streak, crosses the 3-day milestone, and persists", async ({ page }) => {
    await preAcceptCookies(page);
    // Seeded at 2 with yesterday as last-active → today advances to 3 (a milestone).
    await seedStreakState(page, { days: 2, longest: 2, lastActiveDate: localDaysAgo(1), earnedBadges: [] });
    await page.goto(routes.gradeHome(GRADE));

    const badge = page.getByTestId(streakBadgeTid);
    await expect(badge).toBeVisible();
    await expect(badge).toContainText("3 ימים ברצף");

    // Note: the milestone chip in the live region auto-dismisses after ~4s, so it is
    // too transient to assert reliably under load. The durable proof is the persisted
    // earnedBadges below (the milestone was recorded), which is what actually matters.

    // Persisted: streak advanced to 3 and the milestone badge recorded.
    const stored = await readLocalStorage<{ currentStreak: number; earnedBadges: string[]; lastActiveDate: string }>(
      page,
      STORAGE_KEYS.streak,
    );
    expect(stored?.currentStreak).toBe(3);
    expect(stored?.earnedBadges).toContain("streak_3");
    expect(stored?.lastActiveDate).toBe(localToday());
  });

  test("a broken streak (gap of 2+ days) resets to 1", async ({ page }) => {
    await preAcceptCookies(page);
    await seedStreakState(page, { days: 9, longest: 9, lastActiveDate: localDaysAgo(3), earnedBadges: ["streak_3", "streak_7"] });
    await page.goto(routes.gradeHome(GRADE));

    const badge = page.getByTestId(streakBadgeTid);
    await expect(badge).toContainText("יום 1 ברצף");

    // Longest is preserved even though current reset.
    const stored = await readLocalStorage<{ currentStreak: number; longestStreak: number }>(page, STORAGE_KEYS.streak);
    expect(stored?.currentStreak).toBe(1);
    expect(stored?.longestStreak).toBe(9);
  });
});
