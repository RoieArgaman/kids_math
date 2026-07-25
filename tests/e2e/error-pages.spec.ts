import { expect, test } from "@playwright/test";

/**
 * 404 / not-found coverage for the SUBJECT routes (English & Science) and their
 * nested day/section params. The math grade routes are covered in edge-and-a11y;
 * this closes the equivalent gaps for the other two subjects plus section params.
 */

test.describe("subject error routes", () => {
  test("invalid English level returns 404", async ({ page }) => {
    const res = await page.goto("/english/zzz");
    expect(res?.status()).toBe(404);
  });

  test("invalid Science level returns 404", async ({ page }) => {
    const res = await page.goto("/science/zzz");
    expect(res?.status()).toBe(404);
  });

  test("invalid English day format returns 404", async ({ page }) => {
    const res = await page.goto("/english/a/day/not-a-day");
    expect(res?.status()).toBe(404);
  });

  test("invalid Science day format returns 404", async ({ page }) => {
    const res = await page.goto("/science/a/day/not-a-day");
    expect(res?.status()).toBe(404);
  });

  test("invalid grade in /subjects/[grade] returns 404", async ({ page }) => {
    const res = await page.goto("/subjects/x");
    expect(res?.status()).toBe(404);
  });

  test("positive contrast: a valid English level home loads (not 404)", async ({ page }) => {
    const res = await page.goto("/english/a");
    expect(res?.status()).toBe(200);
  });

  test("positive contrast: a valid Science level home loads (not 404)", async ({ page }) => {
    const res = await page.goto("/science/a");
    expect(res?.status()).toBe(200);
  });
});
