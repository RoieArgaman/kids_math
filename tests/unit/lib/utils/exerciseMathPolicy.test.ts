import { describe, expect, it } from "vitest";
import type { Exercise } from "@/lib/types";
import { getRenderableMathTokens } from "@/lib/utils/exerciseMathPolicy";
import { tokenizeMathExpression } from "@/lib/utils/mathText";

function baseExercise(overrides: Partial<Exercise>): Exercise {
  return {
    id: "day-1-section-1-exercise-1",
    kind: "multiple_choice",
    prompt: "חַשְּׁבוּ 5 + 7",
    meta: { skillTags: ["addition"], difficulty: "easy", representation: "abstract" },
    options: ["10", "12", "14"],
    answer: "12",
    ...overrides,
  } as Exercise;
}

describe("getRenderableMathTokens", () => {
  it("adds = ? for numeric exercises that miss suffix", () => {
    const exercise = baseExercise({ kind: "multiple_choice" });
    const tokens = tokenizeMathExpression("5 + 7");
    expect(getRenderableMathTokens(exercise, tokens)).toEqual([
      { type: "number", value: "5" },
      { type: "operator", value: "+" },
      { type: "number", value: "7" },
      { type: "equals", value: "=" },
      { type: "question", value: "?" },
    ]);
  });

  it("inserts = before ? when prompt has a + b? (Hebrew style) so display is a + b = ?", () => {
    const exercise = baseExercise({ kind: "multiple_choice" });
    const tokens = tokenizeMathExpression("6 + 4?");
    expect(getRenderableMathTokens(exercise, tokens)).toEqual([
      { type: "number", value: "6" },
      { type: "operator", value: "+" },
      { type: "number", value: "4" },
      { type: "equals", value: "=" },
      { type: "question", value: "?" },
    ]);
  });

  it("removes trailing question token for true_false", () => {
    const exercise = baseExercise({ kind: "true_false", answer: true });
    const tokens = tokenizeMathExpression("10 - 2 = ?");
    expect(getRenderableMathTokens(exercise, tokens)).toEqual([
      { type: "number", value: "10" },
      { type: "operator", value: "-" },
      { type: "number", value: "2" },
      { type: "equals", value: "=" },
    ]);
  });

  it("returns undefined for non-numeric exercise kinds", () => {
    const exercise = baseExercise({ kind: "verbal_input", answer: "בדיקה" });
    const tokens = tokenizeMathExpression("1 + 1");
    expect(getRenderableMathTokens(exercise, tokens)).toBeUndefined();
  });
});
