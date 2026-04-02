import { expect, test } from "@playwright/test";
import type { Exercise, WorkbookDay } from "@/lib/types";
import { getWorkbookDaysById } from "@/lib/content/workbook";
import { answerExerciseCorrectly } from "./answering";
import { answerExerciseWrongly } from "./answering";
import { createFullyAnsweredDayProgressState, createProgressState, seedProgressState } from "./testUtils";
import { childTid, testIds } from "@/lib/testIds";
import { splitMathExpression, tokenizeMathExpression } from "@/lib/utils/mathText";

function findFirstInputExercise(day: WorkbookDay): Exercise | null {
  for (const section of day.sections) {
    for (const ex of section.exercises) {
      if (ex.kind === "number_input" || ex.kind === "number_line_jump") {
        return ex;
      }
    }
  }
  return null;
}

function findMathExercise(): { dayId: string; sectionId: string; exercise: Exercise } | null {
  const byDay = getWorkbookDaysById("a");
  for (const [dayId, day] of Object.entries(byDay)) {
    // Only search warmup (index 0) — always accessible without seeding progress
    const warmupSection = day.sections[0];
    if (!warmupSection) continue;
    for (const ex of warmupSection.exercises) {
      if (
        ex.kind !== "number_input" &&
        ex.kind !== "number_line_jump" &&
        ex.kind !== "multiple_choice"
      ) {
        continue;
      }
      const parts = splitMathExpression(ex.prompt);
      const tokens = parts.math ? tokenizeMathExpression(parts.math) : null;
      if (tokens && tokens.length > 0) {
        return { dayId, sectionId: warmupSection.id, exercise: ex };
      }
    }
  }
  return null;
}

function findTrueFalseMathExercise(): { dayId: string; sectionId: string; exercise: Exercise } | null {
  const byDay = getWorkbookDaysById("a");
  for (const [dayId, day] of Object.entries(byDay)) {
    // Only search warmup (index 0) — always accessible without seeding progress
    const warmupSection = day.sections[0];
    if (!warmupSection) continue;
    for (const ex of warmupSection.exercises) {
      if (ex.kind !== "true_false") continue;
      const parts = splitMathExpression(ex.prompt);
      const tokens = parts.math ? tokenizeMathExpression(parts.math) : null;
      if (tokens && tokens.length > 0) {
        return { dayId, sectionId: warmupSection.id, exercise: ex };
      }
    }
  }
  return null;
}

interface GradeAProgressSnapshot {
  days?: Record<string, { answers?: Record<string, string> }>;
}

test.beforeEach(async ({ page, context }) => {
  await context.clearCookies();
  await page.goto("/");
  await page.evaluate(() => window.localStorage.clear());
});

test.describe("edge routes", () => {
  test("invalid grade param returns 404", async ({ page }) => {
    const res = await page.goto("/grade/x");
    expect(res?.status()).toBe(404);
  });

  test("invalid day format returns 404", async ({ page }) => {
    const res = await page.goto("/grade/a/day/nope");
    expect(res?.status()).toBe(404);
  });

  test("valid-but-nonexistent day shows day-not-found panel", async ({ page }) => {
    await page.goto("/grade/a/day/day-9999");
    await expect(page.getByTestId(testIds.screen.dayOverview.root("a", "day-9999.not-found"))).toBeVisible();
  });
});

test.describe("keyboard + persistence basics (RTL)", () => {
  test("true/false prompts render full expression tokens without question token", async ({ page }) => {
    const match = findTrueFalseMathExercise();
    if (!match) {
      test.skip(true, "No true/false math-tokenizable exercise found in warmup sections");
    }

    await page.goto(`/grade/a/day/${match!.dayId}/section/${match!.sectionId}`);
    const rootTid = testIds.component.exerciseBox.root(match!.exercise.id);
    const containerTid = childTid(rootTid, "mathTokens");
    await expect(page.getByTestId(containerTid)).toBeVisible();
    await expect(page.getByTestId(childTid(containerTid, "token", 0, "number"))).toBeVisible();
    await expect(
      page.getByTestId(containerTid).locator(`[data-testid$=".question"]`),
    ).toHaveCount(0);
  });

  test("numeric prompts render boxed math tokens", async ({ page }) => {
    test.skip(process.platform !== "darwin", "Visual snapshot baseline is currently maintained on darwin.");
    const match = findMathExercise();
    if (!match) {
      test.skip(true, "No math-tokenizable numeric exercise found in warmup sections");
    }

    await page.goto(`/grade/a/day/${match!.dayId}/section/${match!.sectionId}`);
    const rootTid = testIds.component.exerciseBox.root(match!.exercise.id);
    const containerTid = childTid(rootTid, "mathTokens");
    const firstToken = page
      .getByTestId(containerTid)
      .locator(`[data-testid^="${containerTid}.el.token.0."]`)
      .first();
    await expect(page.getByTestId(containerTid)).toBeVisible();
    await expect(firstToken).toBeVisible();
    await expect(
      page.getByTestId(containerTid).locator(`[data-testid$=".question"]`),
    ).toHaveCount(1);
    await expect(page.getByTestId(containerTid)).toHaveScreenshot("math-token-row.png");
  });

  test("retry button shows on wrong answer and hides on correct answer", async ({ page }) => {
    const day = getWorkbookDaysById("a")["day-1"];
    const ex = day ? findFirstInputExercise(day) : null;
    if (!day || !ex) {
      test.skip(true, "day-1 has no input exercise to validate retry behavior");
    }

    const sectionId = ex!.id.replace(/-exercise-\d+$/, "");
    await page.goto(`/grade/a/day/day-1/section/${sectionId}`);
    await answerExerciseWrongly(page, ex!);
    await expect(page.getByTestId(testIds.component.exerciseBox.retry(ex!.id))).toBeVisible();

    await answerExerciseCorrectly(page, ex!);
    await expect(page.getByTestId(testIds.component.exerciseBox.retry(ex!.id))).toHaveCount(0);
  });

  test("Enter submits and moves focus to next input (day-1)", async ({ page }) => {
    const day = getWorkbookDaysById("a")["day-1"];
    if (!day) {
      test.skip(true, "day-1 not found");
    }

    // Find a section with at least 2 input exercises so focus can progress within it.
    let sectionWithInputs: (typeof day.sections)[0] | null = null;
    let ex1: Exercise | null = null;
    let ex2: Exercise | null = null;
    for (const section of day!.sections) {
      const inputs = section.exercises.filter(
        (e) => e.kind === "number_input" || e.kind === "number_line_jump",
      );
      if (inputs.length >= 2) {
        sectionWithInputs = section;
        ex1 = inputs[0]!;
        ex2 = inputs[1]!;
        break;
      }
    }
    if (!ex1 || !ex2 || !sectionWithInputs) {
      test.skip(true, "day-1 has no section with 2 input exercises");
    }

    await page.goto(`/grade/a/day/day-1/section/${sectionWithInputs!.id}`);
    const input1 = page.getByTestId(testIds.component.exerciseBox.input(ex1!.id));
    const input2 = page.getByTestId(testIds.component.exerciseBox.input(ex2!.id));

    const value1 = String(ex1!.answer);
    await input1.fill(value1);
    await input1.press("Enter");

    await expect(input2).toBeFocused();
  });

  test("mid-day refresh restores previously entered answer (day-1)", async ({ page }) => {
    const day = getWorkbookDaysById("a")["day-1"];
    const ex = day ? findFirstInputExercise(day) : null;
    if (!day || !ex) {
      test.skip(true, "day-1 has no input exercise to validate persistence");
    }

    const sectionId = ex!.id.replace(/-exercise-\d+$/, "");
    await page.goto(`/grade/a/day/day-1/section/${sectionId}`);
    const input = page.getByTestId(testIds.component.exerciseBox.input(ex!.id));

    const value = String(ex!.answer);
    await input.fill(value);
    await page.getByTestId(testIds.component.exerciseBox.check(ex!.id)).click();

    // Wait for the app to persist the answer to localStorage via useProgress.
    const exerciseId = ex!.id;
    await expect
      .poll(async () => {
        return page.evaluate((id) => {
          const raw = window.localStorage.getItem("kids_math.workbook_progress.v2.grade.a");
          if (!raw) return null;
          try {
            const parsed: GradeAProgressSnapshot = JSON.parse(raw);
            return parsed.days?.["day-1"]?.answers?.[id] ?? null;
          } catch {
            return null;
          }
        }, exerciseId);
      })
      .toBe(value);

    await page.reload();
    await expect(page.getByTestId(testIds.component.exerciseBox.input(ex!.id))).toHaveValue(value);
  });

  test("locked later day shows locked UI on fresh progress", async ({ page }) => {
    await page.goto("/grade/a/day/day-2");
    await expect(page.getByTestId(testIds.screen.dayOverview.root("a", "day-2.locked"))).toBeVisible();
  });

  test("after completing previous day, next day is accessible", async ({ page }) => {
    const progress = createProgressState({
      days: {
        "day-1": createFullyAnsweredDayProgressState("day-1", "a", { isComplete: true }),
      },
    });
    await seedProgressState(page, "a", progress);

    await page.goto("/grade/a/day/day-2");
    await expect(page.getByTestId(testIds.screen.dayOverview.root("a", "day-2.locked"))).toHaveCount(0);
    await expect(page.getByTestId(testIds.screen.dayOverview.root("a", "day-2"))).toBeVisible();
  });

  test("Plan screen shows non-zero completion after a completed day", async ({ page }) => {
    const progress = createProgressState({
      days: {
        "day-1": createFullyAnsweredDayProgressState("day-1", "a", { isComplete: true }),
      },
    });
    await seedProgressState(page, "a", progress);

    await page.goto("/grade/a/plan");
    const overallSection = page.getByTestId(testIds.screen.plan.overall());
    const pct = overallSection.locator("span").filter({ hasText: /%/ }).first();
    await expect(pct).not.toHaveText("0%");
  });

  test("after 10 wrong answers, the day auto-resets and stays reset after reload", async ({ page }) => {
    const day = getWorkbookDaysById("a")["day-1"];
    const ex = day ? findFirstInputExercise(day) : null;
    if (!day || !ex) {
      test.skip(true, "day-1 has no input exercise to validate auto-reset");
    }

    const sectionId = ex!.id.replace(/-exercise-\d+$/, "");
    await page.goto(`/grade/a/day/day-1/section/${sectionId}`);

    for (let i = 0; i < 10; i += 1) {
      await answerExerciseWrongly(page, ex!);
    }

    await expect(page.getByText("הִגַּעַתְּ לְ-10 טָעוּיוֹת. הַיּוֹם אוּפַס וּמַתְחִילִים מֵחָדָשׁ.")).toBeVisible();

    await page.reload();
    await expect(page.getByText("💥 0/10")).toBeVisible();
  });

  test("after sticky completion, 10 wrong answers do not auto-reset the day", async ({ page }) => {
    const day = getWorkbookDaysById("a")["day-1"];
    const ex = day ? findFirstInputExercise(day) : null;
    if (!day || !ex) {
      test.skip(true, "day-1 has no input exercise to validate sticky completion");
    }

    // Seed with all exercises correct + isComplete:true so sections are accessible
    // and sticky completion is active (wrongCount won't increment after isComplete).
    const progress = createProgressState({
      days: {
        "day-1": createFullyAnsweredDayProgressState("day-1", "a", { isComplete: true }),
      },
    });
    await seedProgressState(page, "a", progress);

    const sectionId = ex!.id.replace(/-exercise-\d+$/, "");
    const sectionUrl = `/grade/a/day/day-1/section/${sectionId}`;
    await page.goto(sectionUrl);

    // The seeded correctAnswers cause sectionComplete to transition false→true after async
    // localStorage hydration, triggering the StarReward overlay mid-test. Navigate back to
    // section when it appears — component remounts with hasMounted=false so the effect won't
    // fire again on the already-complete state.
    await page.addLocatorHandler(
      page.getByTestId(testIds.component.starReward.overlay()),
      async () => { await page.goto(sectionUrl); },
      { noWaitAfter: true },
    );

    for (let i = 0; i < 10; i += 1) {
      await answerExerciseWrongly(page, ex!);
    }

    await expect(
      page.getByText("הִגַּעַתְּ לְ-10 טָעוּיוֹת. הַיּוֹם אוּפַס וּמַתְחִילִים מֵחָדָשׁ."),
    ).toHaveCount(0);

    const wrongBadge = page.getByTestId(childTid(testIds.screen.section.stickyHeader("a", "day-1", sectionId), "wrongBadge"));
    await expect(wrongBadge).toContainText("💥 0/10");
  });
});

