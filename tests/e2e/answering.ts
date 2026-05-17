import { expect, type Locator, Page } from "@playwright/test";
import type { GradeId } from "@/lib/grades";
import type { DayId, Exercise, ExerciseId, WorkbookDay } from "@/lib/types";
import { getWorkbookDaysById } from "@/lib/content/workbook";
import { childTid, testIds } from "@/lib/testIds";

const SUBMIT_OUTCOME_TIMEOUT_MS = 1_500;

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

function choiceSelectedTestId(exerciseId: ExerciseId, choiceKey: string): string {
  return childTid(testIds.component.exerciseBox.root(exerciseId), "choice", choiceKey, "selected");
}

function choiceKeyFromChoiceButtonTestId(testId: string | null, exerciseId: ExerciseId): string | null {
  if (!testId) return null;
  const prefix = `${testIds.component.exerciseBox.root(exerciseId)}.choice.`;
  if (!testId.startsWith(prefix)) return null;
  const rest = testId.slice(prefix.length);
  const key = rest.split(".")[0];
  return key || null;
}

async function waitForExerciseReady(root: Locator, exerciseId: ExerciseId): Promise<void> {
  await root.waitFor({ state: "visible", timeout: 10_000 });
  const choicePrefix = `${testIds.component.exerciseBox.root(exerciseId)}.choice.`;
  const choices = root.locator(`[data-testid^="${choicePrefix}"]`);
  if ((await choices.count()) > 0) {
    await choices.first().waitFor({ state: "visible", timeout: 5_000 });
  }
}

async function waitForChoiceSelected(
  root: Locator,
  exerciseId: ExerciseId,
  choiceKey: string,
): Promise<void> {
  const selected = root.getByTestId(choiceSelectedTestId(exerciseId, choiceKey));
  await expect(selected).toBeVisible({ timeout: SUBMIT_OUTCOME_TIMEOUT_MS });
}

/** Returns true when the answer was wrong and retry was clicked. */
async function submitAndWaitForOutcome(root: Locator, exerciseId: ExerciseId): Promise<boolean> {
  const retryButton = root.getByTestId(testIds.component.exerciseBox.retry(exerciseId));
  const retryVisible = await retryButton
    .isVisible({ timeout: SUBMIT_OUTCOME_TIMEOUT_MS })
    .catch(() => false);
  if (!retryVisible) {
    return false;
  }
  await retryButton.click();
  return true;
}

async function clickChoiceAndCheck(
  root: Locator,
  choice: Locator,
  exerciseId: ExerciseId,
  choiceKey: string,
  checkButton: Locator,
): Promise<boolean> {
  await choice.click();
  await waitForChoiceSelected(root, exerciseId, choiceKey);
  await checkButton.click();
  return submitAndWaitForOutcome(root, exerciseId);
}

export async function answerExerciseCorrectly(page: Page, ex: Exercise): Promise<void> {
  const { fillValue, clickKey } = correctUiValue(ex);
  const root = page.getByTestId(testIds.component.exerciseBox.root(ex.id));
  await waitForExerciseReady(root, ex.id);
  const checkButton = root.getByTestId(testIds.component.exerciseBox.check(ex.id));

  if (fillValue != null) {
    const input = root.getByTestId(testIds.component.exerciseBox.input(ex.id));
    const retryButton = root.getByTestId(testIds.component.exerciseBox.retry(ex.id));
    const candidates = [fillValue];

    for (const candidate of candidates) {
      await input.fill(candidate);
      await checkButton.click();
      const shouldRetry = await retryButton
        .isVisible({ timeout: SUBMIT_OUTCOME_TIMEOUT_MS })
        .catch(() => false);
      if (!shouldRetry) return;
      await retryButton.click();
    }

    throw new Error(`Could not find a correct text answer for exercise ${ex.id}`);
  }

  if (clickKey != null) {
    const desiredChoice = root.getByTestId(testIds.component.exerciseBox.choice(ex.id, clickKey));
    if ((await desiredChoice.count()) > 0) {
      const failed = await clickChoiceAndCheck(root, desiredChoice.first(), ex.id, clickKey, checkButton);
      if (!failed) return;
    }

    // Some authored content can have answer values that do not match rendered choice keys.
    // Fall back to trying each rendered option until we find the correct one.
    const choicePrefix = `${testIds.component.exerciseBox.root(ex.id)}.choice.`;
    const allChoices = root.locator(`[data-testid^="${choicePrefix}"]`);
    await clickChoiceUntilCorrect(root, allChoices, checkButton, ex.id);
    return;
  }
}

export async function answerExerciseWrongly(page: Page, ex: Exercise): Promise<void> {
  const { fillValue, clickKey } = wrongUiValue(ex);
  const root = page.getByTestId(testIds.component.exerciseBox.root(ex.id));
  await waitForExerciseReady(root, ex.id);

  if (fillValue != null) {
    await root.getByTestId(testIds.component.exerciseBox.input(ex.id)).fill(fillValue);
  }

  if (clickKey != null) {
    await root.getByTestId(testIds.component.exerciseBox.choice(ex.id, clickKey)).click();
    await waitForChoiceSelected(root, ex.id, clickKey);
  }

  await root.getByTestId(testIds.component.exerciseBox.check(ex.id)).click();
}

async function clickChoiceUntilCorrect(
  root: Locator,
  allChoices: Locator,
  checkButton: Locator,
  exerciseId: ExerciseId,
): Promise<void> {
  const choiceCount = await allChoices.count();

  for (let idx = 0; idx < choiceCount; idx += 1) {
    const choice = allChoices.nth(idx);
    const testId = await choice.getAttribute("data-testid");
    const choiceKey = choiceKeyFromChoiceButtonTestId(testId, exerciseId);
    if (!choiceKey) {
      continue;
    }
    const failed = await clickChoiceAndCheck(root, choice, exerciseId, choiceKey, checkButton);
    if (!failed) return;
  }

  throw new Error(`Could not find a correct choice for exercise ${exerciseId}`);
}

export async function answerDayCorrectly(page: Page, params: { grade: GradeId; dayId: DayId }): Promise<WorkbookDay> {
  const day = (getWorkbookDaysById(params.grade) as Record<string, WorkbookDay>)[params.dayId];
  if (!day) {
    throw new Error(`Unknown workbook day: ${params.grade}:${params.dayId}`);
  }

  // Navigate section-by-section: sections unlock in order (warmup first, last section after all others).
  for (const section of day.sections) {
    await page.goto(`/grade/${params.grade}/day/${params.dayId}/section/${section.id}`);
    const firstExercise = section.exercises[0];
    if (firstExercise) {
      await expect(page.getByTestId(testIds.component.exerciseBox.root(firstExercise.id))).toBeVisible();
    }
    for (const ex of section.exercises) {
      await answerExerciseCorrectly(page, ex);
    }
  }

  return day;
}
