import { expect, test, type Page } from "@playwright/test";
import type { Exercise } from "@/lib/types";
import { buildScienceExamBank } from "@/lib/science/final-exam/picker";
import { childTid, testIds } from "@/lib/testIds";

const examKeyFor = (level: string) => `kids_math.science.final_exam.v1.level.${level}`;

// Answer correctly WITHOUT pressing a per-question check (the exam grades in bulk on finish).
async function answerOnly(page: Page, exercise: Exercise) {
  const exId = exercise.id;
  switch (exercise.kind) {
    case "multiple_choice":
      await page.getByTestId(testIds.component.exerciseBox.choice(exId, exercise.answer)).click();
      break;
    case "true_false":
      await page
        .getByTestId(testIds.component.exerciseBox.choice(exId, exercise.answer ? "true" : "false"))
        .click();
      break;
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

test.describe("science final exam smoke", () => {
  test.setTimeout(2 * 60 * 1000);

  test.beforeEach(async ({ page, context }) => {
    await context.clearCookies();
    await page.goto("/");
    await page.evaluate(() => window.localStorage.clear());
  });

  // Both levels now have real banks (א׳ = 10 days, ב׳ = 7 days) — the picker draws
  // from each level's own exercises, so exercise the pass path for each.
  for (const LEVEL of ["a", "b"] as const) {
    test(`preview-unlocked exam (Level ${LEVEL}): answer all correctly → pass`, async ({ page }) => {
      await page.goto(`/science/${LEVEL}/exam?previewAll=1`);
      await expect(page.getByTestId(testIds.screen.science.exam.root())).toBeVisible();

      const selectedIds: string[] = await page.evaluate((key) => {
        const raw = window.localStorage.getItem(key);
        return raw ? (JSON.parse(raw).selectedExerciseIds as string[]) : [];
      }, examKeyFor(LEVEL));
      expect(selectedIds.length).toBeGreaterThanOrEqual(6);

      const byId = new Map<string, Exercise>(buildScienceExamBank(LEVEL).map((ex) => [ex.id, ex]));
      for (const id of selectedIds) {
        const ex = byId.get(id);
        expect(ex, `exercise ${id} in Level ${LEVEL} bank`).toBeTruthy();
        await answerOnly(page, ex!);
      }

      await page.getByTestId(testIds.screen.science.exam.finishCta()).click();
      await expect(page.getByTestId(testIds.screen.science.exam.finishPanel())).toBeVisible();
      await expect(
        page.getByTestId(childTid(testIds.screen.science.exam.finishPanel(), "score")),
      ).toHaveText("100%");
    });
  }

  test("exam is locked from the Science home until all days are complete", async ({ page }) => {
    await page.goto(`/science/a`);
    await expect(page.getByTestId(testIds.screen.science.home.examCard())).toBeVisible();
    // No CTA when locked (fresh state).
    await expect(page.getByTestId(testIds.screen.science.home.examCardCta())).toHaveCount(0);
  });
});
