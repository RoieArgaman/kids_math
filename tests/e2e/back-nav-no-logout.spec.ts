/**
 * Regression: a transient 401 at boot must NOT log the user out.
 *
 * Reported on Android tablets — pressing Back evicts the bfcache and forces a full document
 * reload, during which the session cookie is occasionally omitted, so `/api/auth/me` returns a
 * one-off 401. The app must confirm that 401 with a single retry before tearing anything down,
 * so a signed-in child stays signed in instead of being bounced to the login screen mid-lesson.
 *
 * The transient window is time-boxed (not counted) so it is robust to React StrictMode
 * double-invoking the boot effect in dev: EVERY /me call in the ~300ms after the reload gets a
 * 401, and the confirm-retry (~500ms later) lands after the window and succeeds. The revocation
 * SEMANTICS (a genuine, repeated 401 does tear down) live in session-lifecycle.spec.ts and the
 * context unit tests.
 */
import { expect, test } from "@playwright/test";
import { testIds } from "@/lib/testIds";
import { mockAuthApi, TEST_USER } from "./testUtils";

// Comfortably shorter than the client's ~500ms confirm delay, so the retry lands after it.
const TRANSIENT_WINDOW_MS = 300;

test.beforeEach(async ({ page, context }) => {
  await context.clearCookies();
  await page.goto("/");
  await page.evaluate(() => window.localStorage.clear());
});

test("a transient boot 401 followed by a healthy 200 keeps the user signed in", async ({ page }) => {
  // Baseline signed-in wiring (login/logout/progress), then override /me so it returns 401 only
  // while a test-controlled window is open; otherwise it authenticates as TEST_USER.
  await mockAuthApi(page, { loggedIn: true, user: TEST_USER });

  // The window is anchored to the FIRST /me call after arming, so it deterministically covers
  // StrictMode's back-to-back boot calls (which fire within a few ms) while ending well before
  // the client's ~500ms confirm-retry — regardless of absolute reload/network timing.
  let armed = false;
  let windowEnd = 0;
  await page.route("/api/auth/me", (route) => {
    if (armed) {
      if (windowEnd === 0) windowEnd = Date.now() + TRANSIENT_WINDOW_MS;
      if (Date.now() < windowEnd) {
        return route.fulfill({
          status: 401,
          contentType: "application/json",
          body: JSON.stringify({ error: "Unauthorized" }),
        });
      }
    }
    return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(TEST_USER) });
  });

  // Initial load: not armed → signed in, owner marker persisted by the reconcile.
  await page.goto("/");
  await expect(page.getByTestId(testIds.component.auth.avatar())).toBeVisible();

  // Arm the transient window, then do a Back-button-style full reload. Every boot call in the
  // window is 401; the confirm-retry ~500ms later lands after it and re-authenticates.
  armed = true;
  await page.reload();

  // The session survives the transient 401 — the avatar stays and the login button never appears.
  await expect(page.getByTestId(testIds.component.auth.avatar())).toBeVisible();
  await expect(page.getByTestId(testIds.component.auth.loginButton())).toHaveCount(0);
});
