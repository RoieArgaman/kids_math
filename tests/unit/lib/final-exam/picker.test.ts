import { describe, expect, it } from "vitest";
import { FINAL_EXAM_QUESTION_COUNT } from "@/lib/final-exam/config";
import { type PickerVersion, pickFinalExamExerciseIds } from "@/lib/final-exam/picker";

describe("pickFinalExamExerciseIds", () => {
  it("returns FINAL_EXAM_QUESTION_COUNT ids", () => {
    const ids = pickFinalExamExerciseIds({
      grade: "a",
      seed: "size",
      pickerVersion: 1,
    });
    expect(ids).toHaveLength(FINAL_EXAM_QUESTION_COUNT);
  });

  it("returns FINAL_EXAM_QUESTION_COUNT ids for grade b", () => {
    const ids = pickFinalExamExerciseIds({
      grade: "b",
      seed: "grade-b-bank",
      pickerVersion: 1,
    });
    expect(ids).toHaveLength(FINAL_EXAM_QUESTION_COUNT);
  });

  it("is deterministic for the same seed and pickerVersion", () => {
    const a = pickFinalExamExerciseIds({
      grade: "a",
      seed: "deterministic",
      pickerVersion: 1,
    });
    const b = pickFinalExamExerciseIds({
      grade: "a",
      seed: "deterministic",
      pickerVersion: 1,
    });
    expect(a).toEqual(b);
  });

  it("changes selection when pickerVersion differs (same seed)", () => {
    const v1 = pickFinalExamExerciseIds({
      grade: "a",
      seed: "seed-1",
      pickerVersion: 1,
    });
    const v2 = pickFinalExamExerciseIds({
      grade: "a",
      seed: "seed-2",
      pickerVersion: 1,
    });
    expect(v1).not.toEqual(v2);
  });
});
