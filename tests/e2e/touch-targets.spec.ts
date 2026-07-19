import { expect, test, type Page } from "@playwright/test";
import { COOKIE_CONSENT_STORAGE_KEY } from "@/lib/cookieConsent/storage";
import { routes } from "@/lib/routes";

/**
 * Systemic 44px sweep (roadmap D3).
 *
 * Per-screen assertions were tried and rejected: they only cover the controls
 * someone remembered to list, which is exactly how the rule eroded in the first
 * place (TopBar login, Plan day-chips and Admin row actions all drifted under
 * 44px while individual screens had passing tests). This walks EVERY visible
 * interactive element on a route instead, so a new undersized control fails
 * without anyone adding a test for it.
 */

const MIN_TOUCH_PX = 44;

/** Inline/flowing text links are exempt — padding them to 44px would wreck prose. */
const PROSE_LINK_SELECTOR = "p a, li a, footer a";

async function acceptCookies(page: Page) {
  await page.goto(routes.gradePicker());
  await page.evaluate((key) => {
    window.localStorage.setItem(key, "1");
  }, COOKIE_CONSENT_STORAGE_KEY);
}

type Offender = { tag: string; testId: string; text: string; w: number; h: number };

async function findUndersizedControls(page: Page): Promise<Offender[]> {
  return page.evaluate(
    ({ min, proseSelector }) => {
      const prose = new Set(document.querySelectorAll(proseSelector));
      const controls = document.querySelectorAll<HTMLElement>(
        'button, a[href], input:not([type="hidden"]), select, textarea, [role="button"]',
      );
      const bad: Offender[] = [];
      controls.forEach((el) => {
        if (prose.has(el)) return;
        const style = getComputedStyle(el);
        if (style.display === "none" || style.visibility === "hidden") return;
        const r = el.getBoundingClientRect();
        if (r.width === 0 && r.height === 0) return; // not rendered
        // Checkboxes/radios are visually small by convention; the accessible hit
        // area is their <label>. Measured via the label instead.
        const isTick =
          el instanceof HTMLInputElement && (el.type === "checkbox" || el.type === "radio");
        const box = isTick ? (el.closest("label")?.getBoundingClientRect() ?? r) : r;
        if (box.height < min || box.width < min) {
          bad.push({
            tag: el.tagName.toLowerCase(),
            testId: el.getAttribute("data-testid") ?? "(none)",
            text: (el.textContent ?? "").trim().slice(0, 30),
            w: Math.round(box.width),
            h: Math.round(box.height),
          });
        }
      });
      return bad;
    },
    { min: MIN_TOUCH_PX, proseSelector: PROSE_LINK_SELECTOR },
  );
}

const ROUTES: ReadonlyArray<{ name: string; path: string }> = [
  { name: "grade picker", path: routes.gradePicker() },
  { name: "subject picker", path: routes.subjectsForGrade("a") },
  { name: "math home", path: routes.gradeHome("a") },
  { name: "plan", path: routes.gradePlan("a") },
  { name: "badges", path: routes.gradeBadges("a") },
  { name: "privacy", path: routes.privacy() },
];

test.describe("touch targets ≥44px", () => {
  for (const { name, path } of ROUTES) {
    test(`${name} has no undersized interactive controls`, async ({ page }) => {
      await acceptCookies(page);
      await page.goto(path);
      // The TopBar login button is the historical offender and renders on every
      // route, so wait for it rather than racing the auth-loading placeholder.
      await page.waitForLoadState("networkidle");

      const offenders = await findUndersizedControls(page);
      expect(
        offenders,
        `Controls under ${MIN_TOUCH_PX}px on ${name}:\n` +
          offenders.map((o) => `  <${o.tag}> ${o.testId} "${o.text}" — ${o.w}×${o.h}`).join("\n"),
      ).toEqual([]);
    });
  }

  test("mobile viewport keeps every control tappable", async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 720 });
    await acceptCookies(page);
    await page.goto(routes.gradePicker());
    await page.waitForLoadState("networkidle");

    const offenders = await findUndersizedControls(page);
    expect(
      offenders,
      `Controls under ${MIN_TOUCH_PX}px at 320px:\n` +
        offenders.map((o) => `  <${o.tag}> ${o.testId} "${o.text}" — ${o.w}×${o.h}`).join("\n"),
    ).toEqual([]);
  });
});
