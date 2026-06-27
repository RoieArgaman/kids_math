import { expect, test, type ConsoleMessage } from "@playwright/test";
import { testIds } from "@/lib/testIds";

/**
 * Seeded fuzz ("monkey") test.
 *
 * A fixed seed makes every run reproducible: the same sequence of random
 * decisions is replayed each time. The seed is logged at test start so any
 * failure can be reproduced exactly.
 */
const SEED = 0x5eed1234;
const MAX_STEPS = 40;
const TIME_BUDGET_MS = 45_000;

// mulberry32 — tiny, fast, deterministic PRNG.
function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return function next(): number {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const ROUTES = [
  "/",
  "/math",
  "/grade/a",
  "/grade/a/plan",
  "/grade/a/badges",
  "/grade/a/gmat-challenge",
  "/grade/a/day/day-1",
  "/grade/a/day/day-1/section/day-1-section-1",
  "/english",
  "/grade/b/locked",
  "/privacy",
  "/cookies",
  "/admin/progress",
  "/admin/users",
];

const ADVERSARIAL_NUMBERS = [
  "",
  "0",
  "-5",
  "999999999",
  "3.5",
  "00012",
  "+",
  "   ",
  "1".repeat(64), // very long digit string
];

const KIDS_MATH_KEYS = [
  "kids_math.workbook_progress.v2.grade.a",
  "kids_math.final_exam.v1.grade.a",
  "kids_math.badges.v1.grade.a",
  "kids_math.admin_prefs.v1",
];

function pick<T>(rnd: () => number, arr: T[]): T {
  return arr[Math.floor(rnd() * arr.length)]!;
}

test.describe("@monkey seeded fuzz", () => {
  test.setTimeout(TIME_BUDGET_MS + 30_000);

  test("@monkey random-walk keeps invariants (no crash, RTL, body visible)", async ({ page }) => {
    const rnd = mulberry32(SEED);
    // eslint-disable-next-line no-console
    console.log(`[monkey] seed=${SEED} steps=${MAX_STEPS} budget=${TIME_BUDGET_MS}ms`);

    const consoleErrors: string[] = [];
    const pageErrors: string[] = [];
    const seen = () => `console=[${consoleErrors.join(" | ")}] page=[${pageErrors.join(" | ")}]`;

    const ignored = (text: string): boolean =>
      // favicon auto-request 404, and the expected anonymous-visitor 401 from the
      // AuthProvider's GET /api/auth/me probe (lib/auth/api.ts apiMe, handled gracefully).
      /favicon\.ico/i.test(text) || /Failed to load resource.*401 \(Unauthorized\)/i.test(text);

    page.on("console", (msg: ConsoleMessage) => {
      if (msg.type() === "error" && !ignored(msg.text())) consoleErrors.push(msg.text());
    });
    page.on("pageerror", (err) => {
      const text = err.message ?? String(err);
      if (!ignored(text)) pageErrors.push(text);
    });

    const storageBoundary = page.getByTestId(testIds.component.ui.storageErrorBoundary.root());

    async function assertInvariants(step: number, action: string): Promise<void> {
      // The StorageErrorBoundary is an ACCEPTABLE graceful degradation state.
      const boundaryVisible = await storageBoundary.isVisible().catch(() => false);

      // Body must always be present and visible — a blank/crashed page is a failure.
      await expect(page.locator("body"), `step ${step} (${action}): body not visible. ${seen()}`).toBeVisible({
        timeout: 5_000,
      });

      // RTL must hold unless we are in the graceful error boundary (which may render minimally).
      if (!boundaryVisible) {
        const dir = await page.evaluate(() => document.documentElement.dir).catch(() => "");
        expect(dir, `step ${step} (${action}): expected dir=rtl. ${seen()}`).toBe("rtl");
      }

      // No uncaught page errors or console errors at any point.
      expect(pageErrors, `step ${step} (${action}): pageerror fired. ${seen()}`).toEqual([]);
      expect(consoleErrors, `step ${step} (${action}): console error fired. ${seen()}`).toEqual([]);
    }

    // Start somewhere deterministic.
    await page.goto(pick(rnd, ROUTES), { waitUntil: "load" }).catch(() => undefined);
    await assertInvariants(0, "initial goto");

    const start = Date.now();
    for (let step = 1; step <= MAX_STEPS; step += 1) {
      if (Date.now() - start > TIME_BUDGET_MS) {
        // eslint-disable-next-line no-console
        console.log(`[monkey] time budget reached at step ${step}`);
        break;
      }

      const roll = rnd();
      let action = "noop";

      try {
        if (roll < 0.25) {
          // Fill a random visible number input with an adversarial value.
          action = "fill-number-input";
          const inputs = page.locator('input[type="number"], input[inputmode="numeric"]');
          const count = await inputs.count();
          if (count > 0) {
            const target = inputs.nth(Math.floor(rnd() * count));
            if (await target.isVisible().catch(() => false)) {
              const value = pick(rnd, ADVERSARIAL_NUMBERS);
              await target.fill(value, { timeout: 2_000 }).catch(() => undefined);
              if (rnd() < 0.5) await target.press("Enter", { timeout: 1_000 }).catch(() => undefined);
            }
          }
        } else if (roll < 0.55) {
          // Click a random visible, enabled button or link.
          action = "click-cta";
          const clickables = page.locator("button:visible, a:visible, [role=button]:visible");
          const count = await clickables.count();
          if (count > 0) {
            const target = clickables.nth(Math.floor(rnd() * count));
            const enabled = await target.isEnabled().catch(() => false);
            if (enabled) {
              if (rnd() < 0.25) {
                await target.dblclick({ timeout: 2_000, trial: false }).catch(() => undefined);
              } else {
                await target.click({ timeout: 2_000, trial: false }).catch(() => undefined);
              }
            }
          }
        } else if (roll < 0.7) {
          // Keyboard fuzz.
          action = "keyboard";
          await page.keyboard.press(rnd() < 0.5 ? "Enter" : "Escape").catch(() => undefined);
        } else if (roll < 0.82) {
          // History navigation.
          action = "history";
          if (rnd() < 0.5) await page.goBack({ timeout: 3_000 }).catch(() => undefined);
          else await page.goForward({ timeout: 3_000 }).catch(() => undefined);
        } else if (roll < 0.92) {
          // Navigate to a random route.
          action = "goto-route";
          await page.goto(pick(rnd, ROUTES), { waitUntil: "load", timeout: 10_000 }).catch(() => undefined);
        } else {
          // Inject corrupt localStorage under a kids_math.* key, then reload.
          action = "corrupt-storage";
          const key = pick(rnd, KIDS_MATH_KEYS);
          await page
            .evaluate((k) => {
              try {
                window.localStorage.setItem(k, "{bad json");
              } catch {
                /* storage may be unavailable; ignore */
              }
            }, key)
            .catch(() => undefined);
          await page.reload({ waitUntil: "load", timeout: 10_000 }).catch(() => undefined);
        }
      } catch {
        // Individual action failures (timeouts, detached nodes) are fine —
        // the invariant check below is what actually gates the test.
      }

      // Let any async render settle a touch before asserting.
      await page.waitForTimeout(50).catch(() => undefined);
      await assertInvariants(step, action);
    }

    // eslint-disable-next-line no-console
    console.log(`[monkey] completed. seed=${SEED}`);
  });
});
