import { describe, expect, it } from "vitest";
import { getWorkbookDays } from "@/lib/content/workbook";
import type { Exercise, WorkbookDay } from "@/lib/types";

const UNRESOLVED_PLACEHOLDER_REGEX = /=\s*\?|(\?\s*[+\-×÷])|([+\-×÷]\s+\?(?:\s|$))/;

function assertExercise(ex: Exercise): void {
  expect(UNRESOLVED_PLACEHOLDER_REGEX.test(ex.prompt)).toBe(false);

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
