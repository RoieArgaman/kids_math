import { describe, expect, it } from "vitest";
import type { Exercise, ExerciseId } from "@/lib/types";
import { getRetryFeedbackText, isAnswerCorrect } from "@/lib/utils/exercise";

const makeId = (n: number): ExerciseId => `day-1-section-1-exercise-${n}` as ExerciseId;

describe("getRetryFeedbackText hinting", () => {
  it("uses skillTag-based hint for number bonds", () => {
    const ex: Exercise = {
      id: makeId(1),
      kind: "number_input",
      prompt: "6 + ? = 10",
      answer: 4,
      meta: { skillTags: ["number-bonds", "addition"], difficulty: 1, representation: "abstract" },
    };

    const msg = getRetryFeedbackText(ex, "3", 3);
    expect(msg).toContain("רמז:");
    expect(msg).toContain("להשלים ל-10");
  });

  it("adds representation hint for pictorial exercises", () => {
    const ex: Exercise = {
      id: makeId(2),
      kind: "number_input",
      prompt: "כמה קפיצות?",
      answer: 6,
      meta: { skillTags: ["number-line"], difficulty: 1, representation: "pictorial" },
    };

    const msg = getRetryFeedbackText(ex, "5", 3);
    expect(msg).toContain("קו מספרים");
    expect(msg).toContain("ציירו");
  });
});

describe("isAnswerCorrect", () => {
  it("accepts numeric string answers for verbal_input when answer is numeric text", () => {
    const ex: Exercise = {
      id: makeId(3),
      kind: "verbal_input",
      prompt: "כתבו במילה אחת: קפיצה ב-___",
      answer: "2",
      meta: { skillTags: ["patterns"], difficulty: 1, representation: "abstract" },
    };

    expect(isAnswerCorrect(ex, "2")).toBe(true);
  });
});

