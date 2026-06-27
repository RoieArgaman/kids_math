import { expect, test, type Page } from "@playwright/test";
import type { Exercise } from "@/lib/types";
import { buildEnglishExamBank } from "@/lib/english/final-exam/picker";
import { childTid, testIds } from "@/lib/testIds";

const LEVEL = "a";
const EXAM_KEY = `kids_math.english.final_exam.v1.level.${LEVEL}`;

// Answer correctly WITHOUT pressing a per-question check (the exam grades in bulk on finish).
async function answerOnly(page: Page, exercise: Exercise) {
  const exId = exercise.id;
  switch (exercise.kind) {
    case "listen_choose":
    case "multiple_choice":
      await page.getByTestId(testIds.component.exerciseBox.choice(exId, exercise.answer)).click();
      break;
    case "true_false":
      await page
        .getByTestId(testIds.component.exerciseBox.choice(exId, exercise.answer ? "true" : "false"))
        .click();
      break;
    case "letter_tiles": {
      const tray = page.getByTestId(childTid(testIds.component.exerciseBox.root(exId), "letterTiles", "tray"));
      for (const ch of exercise.word) {
        // Select the first ENABLED tile — used tiles get disabled, so duplicate letters
        // (e.g. "dad") must not re-target the already-used tile.
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
      throw new Error(`exam smoke does not handle kind: ${(exercise as Exercise).kind}`);
  }
}

test.describe("english final exam smoke", () => {
  test.setTimeout(2 * 60 * 1000);

  test.beforeEach(async ({ page, context }) => {
    await context.clearCookies();
    await page.goto("/");
    await page.evaluate(() => window.localStorage.clear());
  });

  test("preview-unlocked exam: answer all correctly → pass", async ({ page }) => {
    await page.goto(`/english/${LEVEL}/exam?previewAll=1`);
    await expect(page.getByTestId(testIds.screen.english.exam.root())).toBeVisible();

    const selectedIds: string[] = await page.evaluate((key) => {
      const raw = window.localStorage.getItem(key);
      return raw ? (JSON.parse(raw).selectedExerciseIds as string[]) : [];
    }, EXAM_KEY);
    expect(selectedIds.length).toBeGreaterThanOrEqual(6);

    const byId = new Map<string, Exercise>(buildEnglishExamBank(LEVEL).map((ex) => [ex.id, ex]));
    for (const id of selectedIds) {
      const ex = byId.get(id);
      expect(ex, `exercise ${id} in bank`).toBeTruthy();
      await answerOnly(page, ex!);
    }

    await page.getByTestId(testIds.screen.english.exam.finishCta()).click();
    await expect(page.getByTestId(testIds.screen.english.exam.finishPanel())).toBeVisible();
    await expect(
      page.getByTestId(childTid(testIds.screen.english.exam.finishPanel(), "score")),
    ).toHaveText("100%");
  });

  test("exam is locked from the English home until all days are complete", async ({ page }) => {
    await page.goto(`/english/${LEVEL}`);
    await expect(page.getByTestId(testIds.screen.english.home.examCard())).toBeVisible();
    // No CTA when locked (fresh state).
    await expect(page.getByTestId(testIds.screen.english.home.examCardCta())).toHaveCount(0);
  });
});
