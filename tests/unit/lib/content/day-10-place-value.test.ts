import { describe, expect, it } from "vitest";
import { getWorkbookDays } from "@/lib/content/workbook";
import type { Exercise } from "@/lib/types";
import { isAnswerCorrect } from "@/lib/utils/exercise";

const TENS_DIGIT_PROMPT =
  /מַהִי סִפְרַת הָעֲשָׂרוֹת|מַה עֶרֶךְ סִפְרַת הָעֲשָׂרוֹת|מָה עֶרֶךְ הָעֲשָׂרוֹת/;

const COUNT_TENS_PROMPT = /כַּמָּה עֲשָׂרוֹת יֵשׁ/;

function tensDigitFromTwoDigitPrompt(prompt: string): number | null {
  const match = prompt.match(/בַּמִּסְפָּר (\d{2})\b/);
  if (!match) {
    return null;
  }
  const value = Number(match[1]);
  if (value < 10 || value > 99) {
    return null;
  }
  return Math.floor(value / 10);
}

function expectedTensDigitAnswer(ex: Exercise): number | null {
  if (TENS_DIGIT_PROMPT.test(ex.prompt) || COUNT_TENS_PROMPT.test(ex.prompt)) {
    return tensDigitFromTwoDigitPrompt(ex.prompt);
  }
  return null;
}

function answerAsNumber(ex: Exercise): number | null {
  if (ex.kind === "number_input") {
    return ex.answer;
  }
  if (ex.kind === "multiple_choice") {
    const parsed = Number(ex.answer);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

describe("grade A day 10 place-value tens digit", () => {
  it("tens-digit prompts use the digit (not tens place value like 30 or 70)", () => {
    const day = getWorkbookDays("a").find((d) => d.id === "day-10");
    expect(day).toBeDefined();

    const exercises = day!.sections.flatMap((section) => section.exercises);

    for (const ex of exercises) {
      const expectedDigit = expectedTensDigitAnswer(ex);
      if (expectedDigit == null) {
        continue;
      }

      const actual = answerAsNumber(ex);
      expect(
        actual,
        `${ex.id}: expected tens digit ${expectedDigit} for prompt: ${ex.prompt}`,
      ).toBe(expectedDigit);

      const placeValue = expectedDigit * 10;
      if (ex.kind === "number_input") {
        expect(isAnswerCorrect(ex, placeValue)).toBe(false);
        expect(isAnswerCorrect(ex, expectedDigit)).toBe(true);
      }
    }
  });

  it("challenge exercise 76 accepts 7 only (not 70)", () => {
    const day = getWorkbookDays("a").find((d) => d.id === "day-10");
    const ex = day?.sections
      .flatMap((s) => s.exercises)
      .find((e) => e.id === "day-10-section-5-exercise-7");
    expect(ex?.kind).toBe("number_input");
    if (ex?.kind !== "number_input") {
      return;
    }
    expect(ex.answer).toBe(7);
    expect(isAnswerCorrect(ex, 7)).toBe(true);
    expect(isAnswerCorrect(ex, 70)).toBe(false);
  });
});
