import { describe, expect, it } from "vitest";
import { getWorkbookDays } from "@/lib/content/workbook";
import { validateExerciseArithmetic } from "@/lib/content/engine/validate";
import type { Exercise, WorkbookDay } from "@/lib/types";

const UNRESOLVED_PLACEHOLDER_REGEX = /=\s*\?|(\?\s*[+\-×÷])|([+\-×÷]\s+\?(?:\s|$))/;

function assertExercise(ex: Exercise): void {
  expect(UNRESOLVED_PLACEHOLDER_REGEX.test(ex.prompt)).toBe(false);

  // Deterministic arithmetic backstop: no evaluable prompt may contradict its answer.
  expect(validateExerciseArithmetic(ex), `arithmetic check failed for ${ex.id}`).toBeNull();

  if (ex.kind === "multiple_choice") {
    expect(ex.options.length).toBeGreaterThanOrEqual(2);
    expect(ex.options.includes(ex.answer)).toBe(true);
    expect(new Set(ex.options).size).toBe(ex.options.length);
  }

  if (ex.kind === "shape_choice") {
    expect(ex.options.includes(ex.answer)).toBe(true);
  }

  if (ex.kind === "number_line_jump") {
    const computed = (ex.end - ex.start) / ex.step;
    expect(ex.start).toBeLessThan(ex.end);
    expect((ex.end - ex.start) % ex.step).toBe(0);
    expect(
      ex.answer,
      `number_line_jump mismatch at ${ex.id}: start=${ex.start}, end=${ex.end}, step=${ex.step}, expected=${computed}`,
    ).toBe(computed);
    expect(ex.answer).toBeGreaterThan(0);
  }
}

const MAX_TEACHING_SUMMARY_CHARS = 2000;
const MAX_TEACHING_STEP_CHARS = 800;
const MAX_TEACHING_STEPS = 12;

function assertDayTeaching(day: WorkbookDay): void {
  if (day.teachingSummary != null) {
    expect(UNRESOLVED_PLACEHOLDER_REGEX.test(day.teachingSummary)).toBe(false);
    expect(day.teachingSummary.length).toBeLessThanOrEqual(MAX_TEACHING_SUMMARY_CHARS);
  }
  if (day.teachingSteps != null) {
    expect(day.teachingSteps.length).toBeLessThanOrEqual(MAX_TEACHING_STEPS);
    for (const step of day.teachingSteps) {
      expect(UNRESOLVED_PLACEHOLDER_REGEX.test(step)).toBe(false);
      expect(step.length).toBeLessThanOrEqual(MAX_TEACHING_STEP_CHARS);
    }
  }
}

describe("content validity across grades", () => {
  it("grade A and B are non-empty and have valid exercises", () => {
    const grades = ["a", "b"] as const;

    for (const grade of grades) {
      const days = getWorkbookDays(grade);
      expect(days.length).toBeGreaterThan(0);
      const seenIds = new Set<string>();

      for (const day of days) {
        expect(day.sections.length).toBeGreaterThan(0);
        assertDayTeaching(day);

        for (const section of day.sections) {
          expect(section.exercises.length).toBeGreaterThan(0);
          if (section.example) {
            expect(UNRESOLVED_PLACEHOLDER_REGEX.test(section.example.prompt)).toBe(false);
          }

          for (const ex of section.exercises) {
            expect(seenIds.has(ex.id)).toBe(false);
            seenIds.add(ex.id);
            assertExercise(ex);
          }
        }
      }
    }
  });
});

describe("validateExerciseArithmetic (deterministic accuracy backstop)", () => {
  const baseMeta = {
    skillTags: [],
    difficulty: 1,
    representation: "abstract",
  } as unknown as Exercise["meta"];

  it("catches a seeded wrong answer (number_input)", () => {
    const bad = {
      id: "day-1-section-0-exercise-1",
      kind: "number_input",
      prompt: "כַּמָּה זֶה 7 + 5 = ?",
      answer: 13, // wrong on purpose (7 + 5 = 12)
      meta: baseMeta,
    } as Exercise;
    expect(validateExerciseArithmetic(bad)).toMatch(/answer mismatch/);
  });

  it("catches a true_false whose boolean contradicts the equation", () => {
    const bad = {
      id: "day-1-section-0-exercise-2",
      kind: "true_false",
      prompt: "בִּדְקוּ: 4 + 4 = 9",
      answer: true, // wrong: 4 + 4 ≠ 9, so the statement is false
      meta: baseMeta,
    } as Exercise;
    expect(validateExerciseArithmetic(bad)).toMatch(/true_false mismatch/);
  });

  it("does NOT flag a deliberately-wrong equation in a 'fix the mistake' number_input", () => {
    const fixIt = {
      id: "day-1-section-0-exercise-5",
      kind: "number_input",
      prompt: "תַּקְּנוּ אֶת הַטָּעוּת: 33 + 2 = 34. מַה הַתְּשׁוּבָה הַנְּכוֹנָה?",
      answer: 35,
      meta: baseMeta,
    } as Exercise;
    expect(validateExerciseArithmetic(fixIt)).toBeNull();
  });

  it("passes a correct exercise and skips non-evaluable prompts", () => {
    const good = {
      id: "day-1-section-0-exercise-3",
      kind: "number_input",
      prompt: "כַּמָּה זֶה 7 + 5 = ?",
      answer: 12,
      meta: baseMeta,
    } as Exercise;
    expect(validateExerciseArithmetic(good)).toBeNull();

    const wordProblem = {
      id: "day-1-section-0-exercise-4",
      kind: "number_input",
      prompt: "כַּמָּה מִסְפָּרִים יֵשׁ בֵּין 3 לְ-7?",
      answer: 3,
      meta: baseMeta,
    } as Exercise;
    expect(validateExerciseArithmetic(wordProblem)).toBeNull();
  });
});
