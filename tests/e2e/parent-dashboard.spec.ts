import { expect, test } from "@playwright/test";
import { childTid, testIds } from "@/lib/testIds";
import { getWorkbookDaysById } from "@/lib/content/workbook";
import type { DayProgressState, WorkbookProgressState } from "@/lib/types";

const GRADE_A_PROGRESS_KEY = "kids_math.workbook_progress.v2.grade.a";
const ADMIN_SESSION_KEY = "kids_math.admin.v1";
const COOKIE_CONSENT_KEY = "kids_math.cookie_consent.v1";

/** A grade-A day-1 progress fixture with real attempts (so `hasAnyData` is true). */
function seededGradeAProgress(): WorkbookProgressState {
  const day1 = getWorkbookDaysById("a")["day-1"];
  const exercises = day1.sections.flatMap((s) => s.exercises);
  const first = exercises[0];
  const second = exercises[1] ?? exercises[0];
  const now = new Date().toISOString();

  // first exercise: first-attempt WRONG then corrected (exercises the inflation guard
  // + weak-skill path); second exercise: first-attempt correct.
  const day: DayProgressState = {
    dayId: "day-1",
    answers: { [first.id]: 0, [second.id]: 0 },
    correctAnswers: { [first.id]: true, [second.id]: true },
    wrongCount: 1,
    wrongBySection: {},
    attempts: [
      { exerciseId: first.id, answer: -999, isCorrect: false, attemptedAt: now },
      { exerciseId: first.id, answer: 0, isCorrect: true, attemptedAt: now },
      { exerciseId: second.id, answer: 0, isCorrect: true, attemptedAt: now },
    ],
    percentDone: 100,
    isComplete: true,
    completedAt: now,
  };

  return { version: 1, days: { "day-1": day }, updatedAt: now };
}

/** Seed admin unlock + dismissed cookie banner so no incidental writes occur on load. */
async function seedSession(page: import("@playwright/test").Page): Promise<void> {
  await page.evaluate(
    ({ adminKey, consentKey }) => {
      window.sessionStorage.setItem(adminKey, JSON.stringify({ unlockedAt: Date.now() }));
      window.localStorage.setItem(consentKey, "1");
    },
    { adminKey: ADMIN_SESSION_KEY, consentKey: COOKIE_CONSENT_KEY },
  );
}

test.beforeEach(async ({ page, context }) => {
  await context.clearCookies();
  await page.goto("/");
  await page.evaluate(() => {
    window.localStorage.clear();
    window.sessionStorage.clear();
  });
});

test("admin hub PIN gate blocks, then unlocks to two cards", async ({ page }) => {
  await page.goto("/admin");

  // Locked: PIN form is shown, cards are not.
  await expect(page.getByTestId(testIds.screen.adminHub.pinInput())).toBeVisible();
  await expect(page.getByTestId(testIds.screen.adminHub.parentDashboardCard())).toHaveCount(0);

  // Wrong PIN → error.
  await page.getByTestId(testIds.screen.adminHub.pinInput()).fill("0000");
  await page.getByTestId(testIds.screen.adminHub.pinSubmit()).click();
  await expect(page.getByTestId(testIds.screen.adminHub.pinError())).toBeVisible();

  // Correct PIN → two cards.
  await page.getByTestId(testIds.screen.adminHub.pinInput()).fill("2109");
  await page.getByTestId(testIds.screen.adminHub.pinSubmit()).click();
  await expect(page.getByTestId(testIds.screen.adminHub.progressCard())).toBeVisible();
  await expect(page.getByTestId(testIds.screen.adminHub.parentDashboardCard())).toBeVisible();
});

test("unlock once, then reach both screens via the cards without re-entering the PIN", async ({
  page,
}) => {
  // Regression: client-side navigation between admin screens must NOT clear the
  // unlock. Earlier each screen cleared the session on unmount, so clicking a card
  // (a client-side navigation) wiped the unlock — the parent dashboard then bounced
  // back to the hub PIN and was effectively unreachable.
  await page.goto("/admin");
  await page.getByTestId(testIds.screen.adminHub.pinInput()).fill("2109");
  await page.getByTestId(testIds.screen.adminHub.pinSubmit()).click();
  await expect(page.getByTestId(testIds.screen.adminHub.parentDashboardCard())).toBeVisible();

  // Hub → parent dashboard (no data seeded → empty state), no PIN re-prompt.
  await page.getByTestId(testIds.screen.adminHub.parentDashboardCardCta()).click();
  await expect(page).toHaveURL(/\/admin\/parent-dashboard$/);
  await expect(page.getByTestId(testIds.screen.parentDashboard.emptyState())).toBeVisible();

  // Parent dashboard → back to the hub (still unlocked: cards, no PIN).
  await page.getByTestId(testIds.screen.parentDashboard.navBack()).click();
  await expect(page).toHaveURL(/\/admin$/);
  await expect(page.getByTestId(testIds.screen.adminHub.progressCard())).toBeVisible();
  await expect(page.getByTestId(testIds.screen.adminHub.pinInput())).toHaveCount(0);

  // Hub → progress, still no PIN re-prompt.
  await page.getByTestId(testIds.screen.adminHub.progressCardCta()).click();
  await expect(page).toHaveURL(/\/admin\/progress$/);
  await expect(page.getByTestId(testIds.screen.adminProgress.pinInput())).toHaveCount(0);

  // Progress → back returns to the hub, still unlocked (no PIN re-prompt).
  await page.getByTestId(testIds.screen.adminProgress.navBack()).click();
  await expect(page).toHaveURL(/\/admin$/);
  await expect(page.getByTestId(testIds.screen.adminHub.pinInput())).toHaveCount(0);

  // Leaving the admin area from the hub clears the unlock → re-entering re-prompts.
  await page.getByTestId(childTid(testIds.screen.adminHub.root(), "navBack")).click();
  await expect(page).toHaveURL("/math");
  await page.goto("/admin");
  await expect(page.getByTestId(testIds.screen.adminHub.pinInput())).toBeVisible();
});

test("parent dashboard redirects to the hub when locked", async ({ page }) => {
  await page.goto("/admin/parent-dashboard");
  await expect(page).toHaveURL(/\/admin$/);
  await expect(page.getByTestId(testIds.screen.adminHub.pinInput())).toBeVisible();
});

test("parent dashboard renders seeded progress in RTL", async ({ page }) => {
  await seedSession(page);
  await page.evaluate(
    ({ key, value }) => window.localStorage.setItem(key, JSON.stringify(value)),
    { key: GRADE_A_PROGRESS_KEY, value: seededGradeAProgress() },
  );

  await page.goto("/admin/parent-dashboard");

  const root = page.getByTestId(testIds.screen.parentDashboard.root());
  await expect(root).toBeVisible();
  await expect(root).toHaveAttribute("dir", "rtl");
  await expect(page.getByTestId(testIds.screen.parentDashboard.snapshot())).toBeVisible();
  await expect(page.getByTestId(testIds.screen.parentDashboard.metricAccuracy())).toBeVisible();
  await expect(page.getByTestId(testIds.screen.parentDashboard.reviewSection())).toBeVisible();

  // The whole-page document is RTL too.
  await expect(page.evaluate(() => document.documentElement.dir)).resolves.toBe("rtl");
});

test("parent dashboard is read-only — localStorage is identical before and after a visit", async ({ page }) => {
  await seedSession(page);
  await page.evaluate(
    ({ key, value }) => window.localStorage.setItem(key, JSON.stringify(value)),
    { key: GRADE_A_PROGRESS_KEY, value: seededGradeAProgress() },
  );

  const before = await page.evaluate(() => JSON.stringify(window.localStorage));

  await page.goto("/admin/parent-dashboard");
  // Wait until the screen has fully mounted and run every loader.
  await expect(page.getByTestId(testIds.screen.parentDashboard.root())).toBeVisible();
  await expect(page.getByTestId(testIds.screen.parentDashboard.snapshot())).toBeVisible();

  const after = await page.evaluate(() => JSON.stringify(window.localStorage));
  expect(after).toBe(before);
});
