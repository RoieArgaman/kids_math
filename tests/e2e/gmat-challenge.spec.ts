import { expect, test } from "@playwright/test";
import { createFinalExamState, seedFinalExamState } from "./testUtils";
import { childTid, testIds } from "@/lib/testIds";

test.beforeEach(async ({ page, context }) => {
  await context.clearCookies();
  await page.addInitScript(() => {
    window.__KIDS_MATH_E2E_SHORT_GMAT__ = true;
  });
  await page.goto("/");
  await page.evaluate(() => window.localStorage.clear());
});

test("gmat challenge is locked until final exam passed", async ({ page }) => {
  await page.goto("/grade/a/gmat-challenge");
  await expect(page.getByTestId(testIds.screen.gmatChallenge.locked("a"))).toBeVisible();
});

test("gmat challenge completes optional timed flow", async ({ page }) => {
  const fe = createFinalExamState({ grade: "a", seed: "e2e-gmat-pass", answerMode: "pass" });
  await seedFinalExamState(page, "a", {
    ...fe,
    submittedAt: new Date().toISOString(),
    scorePercent: 90,
    passed: true,
  });
  await page.goto("/grade/a/gmat-challenge");

  const rules = testIds.screen.gmatChallenge.rulesPanel("a");
  await expect(page.getByTestId(rules)).toBeVisible();
  await page.getByTestId(childTid(rules, "cta", "continue")).click();

  const order = testIds.screen.gmatChallenge.orderPanel("a");
  await expect(page.getByTestId(order)).toBeVisible();
  await page.getByTestId(childTid(order, "cta", "confirm")).click();

  for (let i = 0; i < 3; i += 1) {
    await expect(page.getByTestId(testIds.screen.gmatChallenge.finishSectionCta("a"))).toBeVisible({
      timeout: 20_000,
    });
    await page.getByTestId(testIds.screen.gmatChallenge.finishSectionCta("a")).click();
    await page.getByTestId(testIds.screen.gmatChallenge.confirmReviewCta("a")).click();
    if (i < 2) {
      const br = testIds.screen.gmatChallenge.breakPanel("a");
      await expect(page.getByTestId(br)).toBeVisible();
      await page.getByTestId(childTid(br, "cta", "skip")).click();
    }
  }

  await expect(page.getByTestId(testIds.screen.gmatChallenge.results("a"))).toBeVisible();
  await expect(page.getByTestId(childTid(testIds.screen.gmatChallenge.results("a"), "score"))).toBeVisible();
});
