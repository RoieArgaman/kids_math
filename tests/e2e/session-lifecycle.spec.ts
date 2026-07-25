import { expect, test } from "@playwright/test";
import { testIds } from "@/lib/testIds";

/**
 * Session revocation teardown: a device that WAS signed in (owner marker present) but
 * whose session now comes back 401 — because the account was deactivated, deleted, or
 * its tokenVersion bumped — must wipe local progress and drop to the logged-out UI, so
 * a revoked child's workbook is not readable by whoever opens the shared browser next.
 * (Complements session-revocation.spec.ts, which covers explicit "log out everywhere".)
 */

const WORKBOOK_A_KEY = "kids_math.workbook_progress.v2.grade.a";
const OWNER_KEY = "kids_math.auth.owner.v1";
const COOKIE_CONSENT_KEY = "kids_math.cookie_consent.v1";

function completedDay1Workbook() {
  const now = new Date().toISOString();
  return {
    version: 1,
    updatedAt: now,
    days: {
      "day-1": {
        dayId: "day-1",
        answers: {},
        correctAnswers: {},
        wrongCount: 0,
        wrongBySection: {},
        attempts: [],
        percentDone: 100,
        isComplete: true,
        completedAt: now,
      },
    },
  };
}

test("a signed-in device whose session returns 401 is wiped to logged-out", async ({ page, context }) => {
  await context.clearCookies();

  // The session is revoked server-side → /api/auth/me is 401, progress GET is empty.
  await page.route("/api/auth/me", (route) =>
    route.fulfill({ status: 401, contentType: "application/json", body: JSON.stringify({ error: "Unauthorized" }) }),
  );
  await page.route("/api/user/progress", (route) =>
    route.fulfill({ status: 200, contentType: "application/json", body: "null" }),
  );

  // Prime the device as previously signed in, with real local progress.
  await page.goto("/");
  await page.evaluate(
    ({ ownerKey, workbookKey, consentKey, workbook }) => {
      window.localStorage.clear();
      window.localStorage.setItem(ownerKey, "revoked-user-id");
      window.localStorage.setItem(workbookKey, JSON.stringify(workbook));
      window.localStorage.setItem(consentKey, "1");
    },
    { ownerKey: OWNER_KEY, workbookKey: WORKBOOK_A_KEY, consentKey: COOKIE_CONSENT_KEY, workbook: completedDay1Workbook() },
  );

  // Re-load so AuthProvider mounts against the 401 session with the owner marker set.
  await page.goto("/");

  // UI drops to logged-out.
  await expect(page.getByTestId(testIds.component.auth.loginButton())).toBeVisible();

  // Local progress is wiped (revoked child's workbook not left behind), owner marker cleared.
  const workbookRaw = await page.evaluate((k) => window.localStorage.getItem(k), WORKBOOK_A_KEY);
  if (workbookRaw) {
    const parsed = JSON.parse(workbookRaw) as { days?: Record<string, unknown> };
    expect(Object.keys(parsed.days ?? {})).toHaveLength(0);
  } else {
    expect(workbookRaw).toBeNull();
  }
  const owner = await page.evaluate((k) => window.localStorage.getItem(k), OWNER_KEY);
  expect(owner).toBeNull();
});

test("an anonymous device (no owner marker) is NOT wiped on a 401", async ({ page, context }) => {
  await context.clearCookies();
  await page.route("/api/auth/me", (route) =>
    route.fulfill({ status: 401, contentType: "application/json", body: JSON.stringify({ error: "Unauthorized" }) }),
  );

  await page.goto("/");
  await page.evaluate(
    ({ workbookKey, consentKey, workbook }) => {
      window.localStorage.clear();
      window.localStorage.setItem(workbookKey, JSON.stringify(workbook)); // anonymous local work
      window.localStorage.setItem(consentKey, "1");
    },
    { workbookKey: WORKBOOK_A_KEY, consentKey: COOKIE_CONSENT_KEY, workbook: completedDay1Workbook() },
  );
  await page.goto("/");
  await expect(page.getByTestId(testIds.component.auth.loginButton())).toBeVisible();

  // Anonymous local progress is preserved — only a revoked *session* triggers a wipe.
  const workbookRaw = await page.evaluate((k) => window.localStorage.getItem(k), WORKBOOK_A_KEY);
  const parsed = JSON.parse(workbookRaw!) as { days: Record<string, { isComplete?: boolean }> };
  expect(parsed.days["day-1"]?.isComplete).toBe(true);
});
