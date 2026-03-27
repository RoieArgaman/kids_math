import type { Locator, Page } from "@playwright/test";
import type { GradeId } from "../../lib/grades";
import type { DayId, Exercise, WorkbookDay } from "../../lib/types";
import { getWorkbookDaysById } from "../../lib/content/workbook";
import { testIds } from "../../lib/testIds";

function toShapeLabel(option: string): string {
  if (option === "circle") return "עִיגּוּל";
  if (option === "square") return "רִיבּוּעַ";
  if (option === "triangle") return "מְשֻׁלָּשׁ";
  if (option === "rectangle") return "מַלְבֵּן";
  return option;
}

function normalizeChoiceValue(input: string): string {
  return input
    .normalize("NFKD")
    .replace(/[\u0591-\u05C7]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

function resolveChoiceKey(options: string[], targetValue: string): string {
  const target = normalizeChoiceValue(targetValue);
  const exact = options.find((option) => normalizeChoiceValue(option) === target);
  return exact ?? targetValue;
}

function correctUiValue(ex: Exercise): { fillValue?: string; clickKey?: string } {
  switch (ex.kind) {
    case "number_input":
    case "number_line_jump":
      return { fillValue: String(ex.answer) };
    case "multiple_choice":
      return { clickKey: resolveChoiceKey(ex.options, ex.answer) };
    case "true_false":
      return { clickKey: ex.answer ? "true" : "false" };
    case "verbal_input":
      return { fillValue: ex.answer };
    case "shape_choice":
      return { clickKey: ex.answer };
    default: {
      const _never: never = ex;
      return _never;
    }
  }
}

function wrongUiValue(ex: Exercise): { fillValue?: string; clickKey?: string } {
  switch (ex.kind) {
    case "number_input":
    case "number_line_jump":
      return { fillValue: String(ex.answer + 1) };
    case "multiple_choice": {
      const correctKey = resolveChoiceKey(ex.options, ex.answer);
      const wrong = ex.options.find((o) => o !== correctKey) ?? ex.options[0] ?? `${ex.answer}x`;
      return { clickKey: wrong };
    }
    case "true_false":
      return { clickKey: ex.answer ? "false" : "true" };
    case "verbal_input":
      return { fillValue: `${ex.answer}x` };
    case "shape_choice": {
      const wrong = ex.options.find((o) => o !== ex.answer) ?? "circle";
      return { clickKey: wrong };
    }
    default: {
      const _never: never = ex;
      return _never;
    }
  }
}

export async function answerExerciseCorrectly(page: Page, ex: Exercise): Promise<void> {
  const { fillValue, clickKey } = correctUiValue(ex);
  const root = page.getByTestId(testIds.component.exerciseBox.root(ex.id));
  const checkButton = root.getByTestId(testIds.component.exerciseBox.check(ex.id));

  if (fillValue != null) {
    const input = root.getByTestId(testIds.component.exerciseBox.input(ex.id));
    const retryButton = root.getByTestId(testIds.component.exerciseBox.retry(ex.id));
    const candidates = ex.kind === "verbal_input" ? buildVerbalCandidates(fillValue) : [fillValue];

    for (const candidate of candidates) {
      await input.fill(candidate);
      await checkButton.click();
      const shouldRetry = await retryButton.isVisible({ timeout: 250 }).catch(() => false);
      if (!shouldRetry) return;
      await retryButton.click();
    }

    throw new Error(`Could not find a correct text answer for exercise ${ex.id}`);
  }

  if (clickKey != null) {
    const desiredChoice = root.getByTestId(testIds.component.exerciseBox.choice(ex.id, clickKey));
    if ((await desiredChoice.count()) > 0) {
      await desiredChoice.first().click();
      await checkButton.click();
      const retryVisible = await root.getByTestId(testIds.component.exerciseBox.retry(ex.id)).isVisible({ timeout: 250 }).catch(() => false);
      if (!retryVisible) return;
      await root.getByTestId(testIds.component.exerciseBox.retry(ex.id)).click();
    }

    // Some authored content can have answer values that do not match rendered choice keys.
    // Fall back to trying each rendered option until we find the correct one.
    const choicePrefix = `${testIds.component.exerciseBox.root(ex.id)}.choice.`;
    const allChoices = root.locator(`[data-testid^="${choicePrefix}"]`);
    await clickChoiceUntilCorrect(root, allChoices, checkButton, ex.id);
    return;
  }
}

function buildVerbalCandidates(value: string): string[] {
  const normalized = value
    .normalize("NFKD")
    .replace(/[\u0591-\u05C7]/g, "")
    .trim();
  const compact = normalized.replace(/\s+/g, "");
  const noPunctuation = normalized.replace(/[\"'׳״.,!?]/g, "");
  const candidates = [value, normalized, noPunctuation, compact];
  return Array.from(new Set(candidates.filter(Boolean)));
}

export async function answerExerciseWrongly(page: Page, ex: Exercise): Promise<void> {
  const { fillValue, clickKey } = wrongUiValue(ex);
  const root = page.getByTestId(testIds.component.exerciseBox.root(ex.id));

  if (fillValue != null) {
    await root.getByTestId(testIds.component.exerciseBox.input(ex.id)).fill(fillValue);
  }

  if (clickKey != null) {
    await root.getByTestId(testIds.component.exerciseBox.choice(ex.id, clickKey)).click();
  }

  await root.getByTestId(testIds.component.exerciseBox.check(ex.id)).click();
}

async function clickChoiceUntilCorrect(root: Locator, allChoices: Locator, checkButton: Locator, exerciseId: string): Promise<void> {
  const retryButton = root.getByTestId(testIds.component.exerciseBox.retry(exerciseId));
  const choiceCount = await allChoices.count();

  for (let idx = 0; idx < choiceCount; idx += 1) {
    await allChoices.nth(idx).click();
    await checkButton.click();
    const shouldRetry = await retryButton.isVisible({ timeout: 250 }).catch(() => false);
    if (!shouldRetry) return;
    await retryButton.click();
  }

  throw new Error(`Could not find a correct choice for exercise ${exerciseId}`);
}

export async function answerDayCorrectly(page: Page, params: { grade: GradeId; dayId: DayId }): Promise<WorkbookDay> {
  const day = (getWorkbookDaysById(params.grade) as Record<string, WorkbookDay>)[params.dayId];
  if (!day) {
    throw new Error(`Unknown workbook day: ${params.grade}:${params.dayId}`);
  }

  for (const section of day.sections) {
    for (const ex of section.exercises) {
      await answerExerciseCorrectly(page, ex);
    }
  }

  return day;
}

