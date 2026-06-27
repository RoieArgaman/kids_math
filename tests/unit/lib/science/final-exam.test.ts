import { describe, expect, it } from "vitest";
import { buildScienceExamBank, pickScienceExamExerciseIds } from "@/lib/science/final-exam/picker";
import { gradeScienceFinalExam } from "@/lib/science/final-exam/grading";
import { SCIENCE_FINAL_EXAM_PASS_PERCENT } from "@/lib/science/final-exam/config";
import type { Exercise, ExerciseId } from "@/lib/types";

describe("science final exam picker", () => {
  it("builds a non-empty bank for Level א׳ (and ב׳ scaffold)", () => {
    expect(buildScienceExamBank("a").length).toBeGreaterThan(0);
    expect(buildScienceExamBank("b").length).toBeGreaterThan(0);
  });

  it("draws each level's exam only from that level's exercises (disjoint)", () => {
    const aIds = new Set(buildScienceExamBank("a").map((e) => e.id));
    const bIds = new Set(buildScienceExamBank("b").map((e) => e.id));
    for (const id of aIds) expect(bIds.has(id)).toBe(false);
  });

  it("is deterministic for a given seed and caps at bank size", () => {
    const bankSize = buildScienceExamBank("a").length;
    const a = pickScienceExamExerciseIds({ level: "a", seed: "seed-1", pickerVersion: 1, count: 1000 });
    const b = pickScienceExamExerciseIds({ level: "a", seed: "seed-1", pickerVersion: 1, count: 1000 });
    expect(a).toEqual(b);
    expect(a.length).toBe(bankSize);
    expect(new Set(a).size).toBe(a.length); // no duplicates
  });

  it("produces different selections for different seeds", () => {
    const a = pickScienceExamExerciseIds({ level: "a", seed: "seed-1", pickerVersion: 1, count: 5 });
    const b = pickScienceExamExerciseIds({ level: "a", seed: "seed-2", pickerVersion: 1, count: 5 });
    expect(a).not.toEqual(b);
  });
});

describe("science final exam grading", () => {
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
    const allRight = gradeScienceFinalExam({
      selectedExercises: selected,
      answers: { [selected[0].id]: "a", [selected[1].id]: "b", [selected[2].id]: "c", [selected[3].id]: "d", [selected[4].id]: "e" },
    });
    expect(allRight.scorePercent).toBe(100);
    expect(allRight.passed).toBe(true);
    expect(allRight.canFinish).toBe(true);

    const mostlyWrong = gradeScienceFinalExam({
      selectedExercises: selected,
      answers: { [selected[0].id]: "a", [selected[1].id]: "x", [selected[2].id]: "x", [selected[3].id]: "x", [selected[4].id]: "x" },
    });
    expect(mostlyWrong.scorePercent).toBe(20);
    expect(mostlyWrong.passed).toBe(false);
  });

  it("cannot finish until every question is answered", () => {
    const selected = [makeMc(1, "a"), makeMc(2, "b")];
    const partial = gradeScienceFinalExam({ selectedExercises: selected, answers: { [selected[0].id]: "a" } });
    expect(partial.canFinish).toBe(false);
  });

  it("threshold constant is sane", () => {
    expect(SCIENCE_FINAL_EXAM_PASS_PERCENT).toBeGreaterThan(0);
    expect(SCIENCE_FINAL_EXAM_PASS_PERCENT).toBeLessThanOrEqual(100);
  });
});
