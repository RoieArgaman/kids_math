import { expect, test } from "@playwright/test";
import type { Exercise } from "@/lib/types";
import { getEnglishDaysById } from "@/lib/content/english-workbook";
import { childTid, testIds } from "@/lib/testIds";

const DAY_ID = "day-1";

async function answerExercise(page: import("@playwright/test").Page, exercise: Exercise) {
  const exId = exercise.id;
  switch (exercise.kind) {
    case "listen_choose":
    case "multiple_choice": {
      await page.getByTestId(testIds.component.exerciseBox.choice(exId, exercise.answer)).click();
      break;
    }
    case "true_false": {
      await page
        .getByTestId(testIds.component.exerciseBox.choice(exId, exercise.answer ? "true" : "false"))
        .click();
      break;
    }
    case "letter_tiles": {
      const trayId = childTid(testIds.component.exerciseBox.root(exId), "letterTiles", "tray");
      const tray = page.getByTestId(trayId);
      for (const ch of exercise.word) {
        // Select the first ENABLED tile for this letter — used tiles get disabled, so
        // duplicate letters (e.g. "dad") must not re-target the already-used tile.
        await tray.locator("button:not([disabled])", { hasText: new RegExp(`^${ch}$`, "i") }).first().click();
      }
      break;
    }
    case "match_pairs": {
      const root = childTid(testIds.component.exerciseBox.root(exId), "matchPairs");
      const leftCol = page.getByTestId(childTid(root, "leftCol"));
      const rightCol = page.getByTestId(childTid(root, "rightCol"));
      for (const pair of exercise.pairs) {
        await leftCol.getByText(pair.left, { exact: true }).click();
        await rightCol.getByText(pair.right, { exact: true }).click();
      }
      break;
    }
    default:
      throw new Error(`English smoke does not handle kind: ${(exercise as Exercise).kind}`);
  }
  await page.getByTestId(testIds.component.exerciseBox.check(exId)).click();
}

test.describe("english day smoke", () => {
  test.setTimeout(2 * 60 * 1000);

  test.beforeEach(async ({ page, context }) => {
    await context.clearCookies();
    await page.goto("/");
    await page.evaluate(() => window.localStorage.clear());
  });

  test("learner reaches English from home and completes Day 1 end-to-end", async ({ page }) => {
    // Home → English entry
    await page.goto("/");
    await page.getByTestId(testIds.screen.subjectPicker.englishCardCta()).click();
    await expect(page.getByTestId(testIds.screen.english.home.root())).toBeVisible();

    // English home → Day 1 hub
    await page.getByTestId(testIds.screen.english.home.dayCardCta(DAY_ID)).click();
    await expect(page.getByTestId(testIds.screen.english.day.root(DAY_ID))).toBeVisible();

    const day = getEnglishDaysById()[DAY_ID]!;

    // Complete every section in order (warmup → teaching → review).
    for (const section of day.sections) {
      await page.getByTestId(testIds.screen.english.day.sectionCardCta(DAY_ID, section.id)).click();
      await expect(page.getByTestId(testIds.screen.english.section.root(DAY_ID, section.id))).toBeVisible();

      for (const exercise of section.exercises) {
        await answerExercise(page, exercise);
      }

      // Completing a section shows the StarReward overlay (proves all answers were correct);
      // dismiss it before navigating — mirrors the math day-smoke pattern.
      await expect(page.getByTestId(testIds.component.starReward.overlay())).toBeVisible({ timeout: 10_000 });
      await page.getByTestId(testIds.component.starReward.confirm()).click();
      await expect(page.getByTestId(testIds.component.starReward.overlay())).toHaveCount(0);

      await page.goto(`/english/day/${DAY_ID}`);
      await expect(page.getByTestId(testIds.screen.english.day.root(DAY_ID))).toBeVisible();
    }

    // Day completion panel appears once all sections are done.
    await expect(page.getByTestId(testIds.screen.english.day.completionPanel(DAY_ID))).toBeVisible();
    await page.getByTestId(testIds.screen.english.day.completeCta(DAY_ID)).click();
  });
});
