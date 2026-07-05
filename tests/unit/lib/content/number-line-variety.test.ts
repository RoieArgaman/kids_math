import { describe, expect, it } from "vitest";

import { getWorkbookDays } from "@/lib/content/workbook";
import { knownNumberCeiling } from "@/lib/content/engine/number-range";
import type { GradeId } from "@/lib/grades";
import type { Exercise } from "@/lib/types";

const GRADES: GradeId[] = ["a", "b"];

type JumpExercise = Extract<Exercise, { kind: "number_line_jump" }>;

/** Every generated number-line-jump paired with the day it belongs to. */
function collectJumps(grade: GradeId): { exercise: JumpExercise; dayNumber: number }[] {
  const out: { exercise: JumpExercise; dayNumber: number }[] = [];
  for (const day of getWorkbookDays(grade)) {
    for (const section of day.sections) {
      for (const ex of section.exercises) {
        if (ex.kind === "number_line_jump") {
          out.push({ exercise: ex, dayNumber: day.dayNumber });
        }
      }
    }
  }
  return out;
}

describe("number-line-jump variety & modest range scaling", () => {
  for (const grade of GRADES) {
    describe(`grade ${grade}`, () => {
      const jumps = collectJumps(grade);

      it("generates a meaningful number of number-line-jump exercises", () => {
        expect(jumps.length).toBeGreaterThan(10);
      });

      it("answers are spread, not clustered on 5/6", () => {
        const answers = jumps.map((j) => j.exercise.answer);
        const distinct = new Set(answers);
        // At least 5 distinct jump-counts across the workbook.
        expect(distinct.size).toBeGreaterThanOrEqual(5);

        // No single answer value dominates (the old bug: almost everything was 5–6).
        const counts = new Map<number, number>();
        for (const a of answers) {
          counts.set(a, (counts.get(a) ?? 0) + 1);
        }
        const maxShare = Math.max(...counts.values()) / answers.length;
        expect(maxShare).toBeLessThanOrEqual(0.4);

        // The specific old symptom: 5 and 6 together are no longer the vast majority.
        const fiveSix = (counts.get(5) ?? 0) + (counts.get(6) ?? 0);
        expect(fiveSix / answers.length).toBeLessThan(0.5);
      });

      it("every line stays within the day's known-number ceiling", () => {
        for (const { exercise, dayNumber } of jumps) {
          const ceiling = knownNumberCeiling(grade, dayNumber);
          expect(exercise.end).toBeLessThanOrEqual(ceiling);
          expect(exercise.start).toBeGreaterThanOrEqual(0);
          expect(exercise.start).toBeLessThan(exercise.end);
        }
      });

      it("ranges actually scale up toward the ceiling somewhere (not all tiny)", () => {
        // At least one generated line reaches near its ceiling, proving the
        // range tracks what the learner knows rather than staying trivially small.
        const reachesHigh = jumps.some(
          ({ exercise, dayNumber }) =>
            exercise.end >= knownNumberCeiling(grade, dayNumber) - exercise.step,
        );
        expect(reachesHigh).toBe(true);
      });
    });
  }

  it("grade B ceilings are at least as high as grade A (range grows with level)", () => {
    expect(knownNumberCeiling("b", 1)).toBeGreaterThanOrEqual(knownNumberCeiling("a", 1));
    expect(knownNumberCeiling("b", 29)).toBeGreaterThan(knownNumberCeiling("a", 4));
  });
});
