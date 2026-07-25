import { expect, test } from "@playwright/test";
import { routes } from "@/lib/routes";
import { COOKIE_CONSENT_STORAGE_KEY } from "@/lib/cookieConsent/storage";

/**
 * RTL / layout invariants that should hold on every top-level screen. The app is
 * Hebrew-first (`<html dir="rtl">`), and no page body may scroll horizontally on a
 * phone-width viewport — a common regression when a wide element (table, math row,
 * long token) escapes its container.
 */

const PAGES: Array<{ name: string; path: string }> = [
  { name: "grade picker (landing)", path: routes.gradePicker() },
  { name: "grade A home", path: routes.gradeHome("a") },
  { name: "grade A plan", path: routes.gradePlan("a") },
  { name: "subjects for grade A", path: routes.subjectsForGrade("a") },
  { name: "english level picker", path: routes.englishLevelPicker() },
  { name: "science level picker", path: routes.scienceLevelPicker() },
  { name: "privacy", path: routes.privacy() },
];

async function preAcceptCookies(page: import("@playwright/test").Page) {
  await page.goto(routes.gradePicker());
  await page.evaluate((key) => window.localStorage.setItem(key, "1"), COOKIE_CONSENT_STORAGE_KEY);
}

test.describe("RTL + layout invariants", () => {
  for (const { name, path } of PAGES) {
    test(`${name} renders RTL with no horizontal overflow`, async ({ page }) => {
      await preAcceptCookies(page);
      await page.setViewportSize({ width: 375, height: 800 }); // iPhone-ish
      await page.goto(path);

      // Document direction is RTL.
      await expect(page.locator("html")).toHaveAttribute("dir", "rtl");

      // Body must not scroll horizontally (allow 1px for sub-pixel rounding).
      const overflow = await page.evaluate(() => {
        const el = document.documentElement;
        return el.scrollWidth - el.clientWidth;
      });
      expect(overflow).toBeLessThanOrEqual(1);
    });
  }

  test("Hebrew lang attribute is set on the document", async ({ page }) => {
    await preAcceptCookies(page);
    await page.goto(routes.gradePicker());
    await expect(page.locator("html")).toHaveAttribute("lang", "he");
  });
});
