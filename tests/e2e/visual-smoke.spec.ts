import { expect, test, type ConsoleMessage } from "@playwright/test";

/**
 * Key public screens to smoke-test for console/page errors and RTL correctness.
 * Grade-B routes other than /locked require an unlock cookie, so we use the
 * locked screen which is always reachable.
 */
const SCREENS: { name: string; path: string }[] = [
  { name: "subject-picker", path: "/" },
  { name: "math-home", path: "/math" },
  { name: "grade-a-home", path: "/grade/a" },
  { name: "grade-a-plan", path: "/grade/a/plan" },
  { name: "grade-a-badges", path: "/grade/a/badges" },
  { name: "grade-a-gmat-challenge", path: "/grade/a/gmat-challenge" },
  { name: "english", path: "/english" },
  { name: "grade-b-locked", path: "/grade/b/locked" },
  { name: "privacy", path: "/privacy" },
  { name: "cookies", path: "/cookies" },
  { name: "admin-progress", path: "/admin/progress" },
  { name: "admin-users", path: "/admin/users" },
];

/**
 * Minimal ignore-list for known-noisy, non-actionable errors only.
 * Keep this as small as possible — anything genuine should fail the test.
 */
const IGNORED_ERROR_PATTERNS: RegExp[] = [
  /favicon\.ico/i, // browser auto-requests favicon; 404 is not an app bug
  // Expected for anonymous visitors: AuthProvider probes GET /api/auth/me on every
  // page load (lib/auth/api.ts apiMe). When not logged in the API returns 401, which
  // apiMe() handles gracefully (returns null). The browser still logs the failed
  // request as a console error. This is normal, handled behavior — not an app bug.
  /Failed to load resource.*401 \(Unauthorized\)/i,
];

function isIgnored(text: string): boolean {
  return IGNORED_ERROR_PATTERNS.some((re) => re.test(text));
}

test.describe("visual smoke (live-browser)", () => {
  for (const screen of SCREENS) {
    test(`screen ${screen.name} loads cleanly (RTL, no console/page errors)`, async ({ page }, testInfo) => {
      const consoleErrors: string[] = [];
      const pageErrors: string[] = [];

      // Attach listeners BEFORE navigating so nothing is missed.
      page.on("console", (msg: ConsoleMessage) => {
        if (msg.type() === "error") {
          const text = msg.text();
          if (!isIgnored(text)) consoleErrors.push(text);
        }
      });
      page.on("pageerror", (err) => {
        const text = err.message ?? String(err);
        if (!isIgnored(text)) pageErrors.push(text);
      });

      await page.goto(screen.path, { waitUntil: "load" });
      await page.waitForLoadState("networkidle").catch(() => {
        // networkidle can be flaky with long-polling; load already settled above.
      });

      // RTL is mandatory across the app.
      const dir = await page.evaluate(() => document.documentElement.dir);
      expect(dir, `expected document dir=rtl on ${screen.path}`).toBe("rtl");

      // Body should be present and visible (not a blank crash page).
      await expect(page.locator("body")).toBeVisible();

      // Capture a screenshot artifact for visual review.
      const buffer = await page.screenshot({ fullPage: true });
      await testInfo.attach(`${screen.name}.png`, { body: buffer, contentType: "image/png" });

      // FAIL if any genuine console error or page error fired.
      expect(
        pageErrors,
        `pageerror(s) on ${screen.path}:\n${pageErrors.join("\n")}`,
      ).toEqual([]);
      expect(
        consoleErrors,
        `console error(s) on ${screen.path}:\n${consoleErrors.join("\n")}`,
      ).toEqual([]);
    });
  }
});
