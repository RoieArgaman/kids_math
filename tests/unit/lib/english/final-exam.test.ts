import { describe, expect, it } from "vitest";
import { buildEnglishExamBank, pickEnglishExamExerciseIds } from "@/lib/english/final-exam/picker";
import { gradeEnglishFinalExam } from "@/lib/english/final-exam/grading";
import { ENGLISH_FINAL_EXAM_PASS_PERCENT } from "@/lib/english/final-exam/config";
import type { Exercise, ExerciseId } from "@/lib/types";

describe("english final exam picker", () => {
  it("builds a non-empty bank from English content", () => {
    expect(buildEnglishExamBank().length).toBeGreaterThan(0);
  });

  it("is deterministic for a given seed and caps at bank size", () => {
    const bankSize = buildEnglishExamBank().length;
    const a = pickEnglishExamExerciseIds({ seed: "seed-1", pickerVersion: 1, count: 1000 });
    const b = pickEnglishExamExerciseIds({ seed: "seed-1", pickerVersion: 1, count: 1000 });
    expect(a).toEqual(b);
    expect(a.length).toBe(bankSize);
    expect(new Set(a).size).toBe(a.length); // no duplicates
  });

  it("produces different selections for different seeds", () => {
    const a = pickEnglishExamExerciseIds({ seed: "seed-1", pickerVersion: 1, count: 5 });
    const b = pickEnglishExamExerciseIds({ seed: "seed-2", pickerVersion: 1, count: 5 });
    expect(a).not.toEqual(b);
  });
});

describe("english final exam grading", () => {
  const makeMc = (n: number, answer: string): Exercise => ({
    id: `day-1-section-1-exercise-${n}` as ExerciseId,
    kind: "multiple_choice",
    prompt: "?",
    options: [answer, "x", "y"],
    answer,
    meta: { skillTags: [], difficulty: 1, representation: "abstract" },
  });

  it("passes only at or above the threshold", () => {
    const selected = [makeMc(1, "a"), makeMc(2, "b"), makeMc(3, "c"), makeMc(4, "d"), makeMc(5, "e")];
    // 5/5 correct = 100%
    const allRight = gradeEnglishFinalExam({
      selectedExercises: selected,
      answers: { [selected[0].id]: "a", [selected[1].id]: "b", [selected[2].id]: "c", [selected[3].id]: "d", [selected[4].id]: "e" },
    });
    expect(allRight.scorePercent).toBe(100);
    expect(allRight.passed).toBe(true);
    expect(allRight.canFinish).toBe(true);

    // 1/5 correct = 20% < threshold
    const mostlyWrong = gradeEnglishFinalExam({
      selectedExercises: selected,
      answers: { [selected[0].id]: "a", [selected[1].id]: "x", [selected[2].id]: "x", [selected[3].id]: "x", [selected[4].id]: "x" },
    });
    expect(mostlyWrong.scorePercent).toBe(20);
    expect(mostlyWrong.passed).toBe(false);
  });

  it("cannot finish until every question is answered", () => {
    const selected = [makeMc(1, "a"), makeMc(2, "b")];
    const partial = gradeEnglishFinalExam({ selectedExercises: selected, answers: { [selected[0].id]: "a" } });
    expect(partial.canFinish).toBe(false);
  });

  it("threshold constant is sane", () => {
    expect(ENGLISH_FINAL_EXAM_PASS_PERCENT).toBeGreaterThan(0);
    expect(ENGLISH_FINAL_EXAM_PASS_PERCENT).toBeLessThanOrEqual(100);
  });
});
