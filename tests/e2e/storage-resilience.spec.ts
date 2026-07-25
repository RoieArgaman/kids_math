import { expect, test } from "@playwright/test";
import { routes } from "@/lib/routes";
import { childTid, testIds } from "@/lib/testIds";
import { STORAGE_KEYS } from "./testUtils";

/**
 * Storage resilience: corrupt / wrong-shape localStorage must never crash a screen.
 * The storage modules are tolerant readers (parse errors → initial state) and the
 * grade page is wrapped in StorageErrorBoundary. This encodes the F2-style "malformed
 * persisted data must degrade gracefully, not throw" contract at the UI level.
 */

const GRADE = "a";
const COOKIE_CONSENT_KEY = "kids_math.cookie_consent.v1";

/** Write a RAW string (possibly invalid JSON) directly to a key, bypassing JSON.stringify. */
async function setRaw(page: import("@playwright/test").Page, key: string, raw: string) {
  await page.evaluate(({ k, v }) => window.localStorage.setItem(k, v), { k: key, v: raw });
}

async function gotoHomeFresh(page: import("@playwright/test").Page) {
  await page.goto(routes.gradeHome(GRADE));
  await page.evaluate((key) => window.localStorage.setItem(key, "1"), COOKIE_CONSENT_KEY);
}

test.describe("storage resilience", () => {
  test("corrupt workbook progress → grade home still renders with day cards", async ({ page }) => {
    await gotoHomeFresh(page);
    await setRaw(page, STORAGE_KEYS.workbookProgress(GRADE), "{ this is not json ]]");
    await page.goto(routes.gradeHome(GRADE));

    await expect(page.getByTestId(testIds.screen.home.root(GRADE))).toBeVisible();
    await expect(page.getByTestId(testIds.screen.home.dayCard("day-1"))).toBeVisible();
  });

  test("wrong-shape workbook progress (valid JSON, bad structure) is sanitized, not fatal", async ({ page }) => {
    await gotoHomeFresh(page);
    await setRaw(page, STORAGE_KEYS.workbookProgress(GRADE), JSON.stringify({ version: "nope", days: 42 }));
    await page.goto(routes.gradeHome(GRADE));

    await expect(page.getByTestId(testIds.screen.home.root(GRADE))).toBeVisible();
    await expect(page.getByTestId(testIds.screen.home.dayCard("day-1"))).toBeVisible();
  });

  test("corrupt streak + final-exam keys → home renders and streak badge still shows", async ({ page }) => {
    await gotoHomeFresh(page);
    await setRaw(page, STORAGE_KEYS.streak, "]]garbage[[");
    await setRaw(page, STORAGE_KEYS.finalExam(GRADE), "not-json");
    await page.goto(routes.gradeHome(GRADE));

    await expect(page.getByTestId(testIds.screen.home.root(GRADE))).toBeVisible();
    await expect(page.getByTestId(testIds.screen.home.dayCard("day-1"))).toBeVisible();
    // Streak recomputes from scratch (tolerant read → first visit), so the badge renders
    // with the day-1 streak rather than the corrupt value.
    const streakBadge = page.getByTestId(childTid(testIds.screen.home.root(GRADE), "streakBadge"));
    await expect(streakBadge).toBeVisible();
    await expect(streakBadge).toContainText("יום 1 ברצף");
  });

  test("corrupt badge state → badge gallery renders its empty state, no crash", async ({ page }) => {
    await gotoHomeFresh(page);
    await setRaw(page, STORAGE_KEYS.badges(GRADE), "{bad json");
    await page.goto(routes.gradeBadges(GRADE));

    await expect(page.getByTestId(testIds.screen.badges.root(GRADE))).toBeVisible();
  });
});
