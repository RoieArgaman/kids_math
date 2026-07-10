import { expect, test, type Page } from "@playwright/test";
import { childTid, testIds } from "@/lib/testIds";
import { mergeBundles, clampFutureTimestamps } from "@/lib/user-data/merge";
import type { UserProgressBundle } from "@/lib/user-data/types";
import type { DayId, WorkbookDay } from "@/lib/types";
import { getWorkbookDaysById } from "@/lib/content/workbook";
import { answerDayCorrectly } from "./answering";
import {
  createCompletedDayProgressState,
  createProgressState,
  dismissDayCompletionCelebration,
  TEST_ADMIN,
  mockAuthApi,
} from "./testUtils";

/**
 * Verifies that a change made in the admin progress screen is reflected in the
 * learner's ACTUAL progress UI — both locally (same device) and, via the
 * cross-device sync round-trip, on another device. The sync test is backed by the
 * real server merge (`mergeBundles` + `clampFutureTimestamps`) and rejects any
 * `undefined` field exactly as the Firestore Admin SDK does, so it also guards the
 * regression where a legacy day without a per-day `updatedAt` 500'd every push.
 */

const PROGRESS_KEY_A = "kids_math.workbook_progress.v2.grade.a";
const ADMIN_PIN = "2109";

/** State chip shown on a learner home day card ("🏆 הוּשְׁלַם" when complete). */
function homeDayStateChip(page: Page, dayId: string) {
  return page.getByTestId(childTid(testIds.screen.home.dayCard(dayId), "stateChip"));
}

/** Reads whether a grade-A day is marked complete in the page's localStorage. */
function dayIsCompleteInStorage(page: Page, dayId: string): Promise<boolean> {
  return page.evaluate(
    ({ key, id }) => {
      const raw = window.localStorage.getItem(key);
      if (!raw) return false;
      try {
        return JSON.parse(raw).days?.[id]?.isComplete === true;
      } catch {
        return false;
      }
    },
    { key: PROGRESS_KEY_A, id: dayId },
  );
}

test.describe("admin progress ↔ actual learner UI", () => {
  test.beforeEach(async ({ page, context }) => {
    await context.clearCookies();
    await page.goto("/");
    await page.evaluate(() => {
      window.localStorage.clear();
      window.sessionStorage.clear();
    });
  });

  test("marking a day complete in admin shows it completed on the learner home", async ({ page }) => {
    await page.goto("/admin/progress?grade=a");
    await page.getByTestId(testIds.screen.adminProgress.pinInput()).fill(ADMIN_PIN);
    await page.getByTestId(testIds.screen.adminProgress.pinSubmit()).click();

    // Admin marks day-1 complete.
    await page.getByTestId(testIds.screen.adminProgress.markComplete("a", "day-1")).click();
    await expect(page.getByTestId(testIds.screen.adminProgress.dayState("a", "day-1"))).toContainText("הושלם");

    // The learner's actual progress UI reflects it: day-1 card reads "completed",
    // day-2 (untouched) does not.
    await page.goto("/grade/a");
    await expect(homeDayStateChip(page, "day-1")).toContainText("הוּשְׁלַם");
    await expect(homeDayStateChip(page, "day-2")).not.toContainText("הוּשְׁלַם");
  });

  test("admin → day view: marking complete shows the day done when opened", async ({ page }) => {
    await page.goto("/admin/progress?grade=a");
    await page.getByTestId(testIds.screen.adminProgress.pinInput()).fill(ADMIN_PIN);
    await page.getByTestId(testIds.screen.adminProgress.pinSubmit()).click();
    await page.getByTestId(testIds.screen.adminProgress.markComplete("a", "day-1")).click();
    await expect(page.getByTestId(testIds.screen.adminProgress.dayState("a", "day-1"))).toHaveText("הושלם");

    // Open the day — it renders as done: the completion panel is shown and every
    // section card is in its "replay" (complete) state.
    await page.goto("/grade/a/day/day-1");
    await expect(page.getByTestId(testIds.screen.dayOverview.root("a", "day-1"))).toBeVisible();
    await expect(page.getByTestId(testIds.screen.dayOverview.completionPanel("a", "day-1"))).toBeVisible();

    const day = (getWorkbookDaysById("a") as Record<string, WorkbookDay>)["day-1"];
    for (const section of day.sections) {
      await expect(
        page.getByTestId(testIds.screen.dayOverview.sectionCardCta("a", "day-1", section.id)),
      ).toHaveText(/תִּרְגּוּל חוֹזֵר/);
    }
  });

  test("day view → admin: completing a day in the learner UI shows it done in admin", async ({ page }) => {
    // Complete day-1 through the real learner flow (answer every exercise, then
    // press the day's complete CTA).
    await page.goto("/grade/a/day/day-1");
    await expect(page.getByTestId(testIds.screen.dayOverview.root("a", "day-1"))).toBeVisible();
    await answerDayCorrectly(page, { grade: "a", dayId: "day-1" });

    await page.goto("/grade/a/day/day-1");
    await page.getByTestId(testIds.screen.dayOverview.completeCta("a", "day-1")).click();
    await page.getByTestId(testIds.component.starReward.confirm()).click();
    await dismissDayCompletionCelebration(page);

    // Admin progress reflects the completion done in the UI.
    await page.goto("/admin/progress?grade=a");
    await page.getByTestId(testIds.screen.adminProgress.pinInput()).fill(ADMIN_PIN);
    await page.getByTestId(testIds.screen.adminProgress.pinSubmit()).click();
    await expect(page.getByTestId(testIds.screen.adminProgress.dayState("a", "day-1"))).toHaveText("הושלם");
  });
});

// ---------------------------------------------------------------------------
// Cross-device sync — the admin change must reach "the other application".
// ---------------------------------------------------------------------------

/** Deep-walks a value; returns the path of the first `undefined` field, or null.
 *  Mirrors the Firestore Admin SDK, which rejects `undefined` field values — the
 *  exact cause of the sync 500 this test guards against. */
function findUndefinedPath(value: unknown, path = ""): string | null {
  if (value === undefined) return path || "(root)";
  if (value === null || typeof value !== "object") return null;
  for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
    const found = findUndefinedPath(v, path ? `${path}.${k}` : k);
    if (found) return found;
  }
  return null;
}

/** In-memory stand-in for one user's Firestore progress doc, shared across devices. */
interface SyncServer {
  bundle: UserProgressBundle | null;
  /** Set when a push produced a Firestore-illegal `undefined` field (the regression). */
  rejectedPath: string | null;
}

/**
 * Installs a `/api/user/progress` handler backed by the REAL server merge. GET
 * returns the stored doc; POST runs the production clamp + merge and rejects (500)
 * any result containing an `undefined` field, just as Firestore would. Register
 * AFTER `mockAuthApi` so this handler takes precedence.
 */
async function installSyncServer(page: Page, server: SyncServer): Promise<void> {
  await page.route("**/api/user/progress", async (route) => {
    if (route.request().method() === "GET") {
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(server.bundle),
      });
    }
    const incoming = route.request().postDataJSON() as UserProgressBundle;
    const merged = mergeBundles(server.bundle, clampFutureTimestamps(incoming, new Date()));
    const written = { ...merged, updatedAt: new Date().toISOString() } as UserProgressBundle;
    const badPath = findUndefinedPath(written);
    if (badPath) {
      server.rejectedPath = badPath;
      return route.fulfill({
        status: 500,
        contentType: "application/json",
        body: JSON.stringify({ error: "Internal server error" }),
      });
    }
    server.bundle = written;
    return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ ok: true }) });
  });
}

/** A stored bundle whose grade-A `day-3` is complete but has NO per-day `updatedAt`
 *  (the legacy shape produced before per-day timestamps existed). */
function seedBundleWithLegacyDay(dayId: string): UserProgressBundle {
  const legacyDay = createCompletedDayProgressState(dayId as DayId); // no per-day updatedAt
  return {
    bundleVersion: 4,
    updatedAt: new Date().toISOString(),
    streak: null,
    grades: {
      a: {
        workbook: createProgressState({ days: { [dayId]: legacyDay } as Record<DayId, typeof legacyDay> }),
        badges: null,
        finalExam: null,
        gmat: null,
        review: null,
      },
      b: { workbook: null, badges: null, finalExam: null, gmat: null, review: null },
    },
    english: { workbook: null, finalExam: null, review: null },
    science: { workbook: null, finalExam: null, review: null },
  };
}

test("admin progress made while logged in syncs to the server and appears on another device", async ({
  browser,
}) => {
  // Pre-existing server doc: day-3 complete but WITHOUT a per-day updatedAt. The
  // first fix regression: this legacy day must not make the push produce an
  // `undefined` field (which Firestore rejects -> 500).
  const server: SyncServer = { bundle: seedBundleWithLegacyDay("day-3"), rejectedPath: null };

  // --- Device 1: a logged-in admin marks day-1 complete ---
  const ctx1 = await browser.newContext();
  const page1 = await ctx1.newPage();
  await mockAuthApi(page1, { loggedIn: true, user: TEST_ADMIN });
  await installSyncServer(page1, server);

  await page1.goto("/admin/progress?grade=a");
  // Wait for the session pull to hydrate the legacy day into this device first.
  await expect.poll(() => dayIsCompleteInStorage(page1, "day-3"), { timeout: 15_000 }).toBe(true);

  await page1.getByTestId(testIds.screen.adminProgress.pinInput()).fill(ADMIN_PIN);
  await page1.getByTestId(testIds.screen.adminProgress.pinSubmit()).click();
  await page1.getByTestId(testIds.screen.adminProgress.markComplete("a", "day-1")).click();
  await expect(page1.getByTestId(testIds.screen.adminProgress.dayState("a", "day-1"))).toContainText("הושלם");

  // The debounced sync must push day-1 up — and the legacy day-3 must not 500 it.
  await expect
    .poll(() => server.bundle?.grades.a.workbook?.days["day-1"]?.isComplete ?? false, { timeout: 15_000 })
    .toBe(true);
  expect(server.rejectedPath).toBeNull();

  await ctx1.close();

  // --- Device 2: a fresh session pulls the merged truth and shows it in the UI ---
  const ctx2 = await browser.newContext();
  const page2 = await ctx2.newPage();
  await mockAuthApi(page2, { loggedIn: true, user: TEST_ADMIN });
  await installSyncServer(page2, server);

  await page2.goto("/");
  await expect.poll(() => dayIsCompleteInStorage(page2, "day-1"), { timeout: 15_000 }).toBe(true);

  // The other device's actual learner UI shows BOTH the admin-marked day-1 and the
  // pre-existing legacy day-3 as completed.
  await page2.goto("/grade/a");
  await expect(homeDayStateChip(page2, "day-1")).toContainText("הוּשְׁלַם");
  await expect(homeDayStateChip(page2, "day-3")).toContainText("הוּשְׁלַם");

  await ctx2.close();
});
