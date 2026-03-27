import { describe, expect, it } from "vitest";
import type { Exercise } from "@/lib/types";
import { getChoiceOptionsForExercise, shuffleChoiceOptions } from "@/lib/utils/choiceOptions";

function baseExercise(overrides: Partial<Exercise>): Exercise {
  return {
    id: "day-1-section-1-exercise-1",
    kind: "multiple_choice",
    prompt: "בְּדִיקָה",
    meta: { skillTags: ["addition"], difficulty: "easy", representation: "abstract" },
    options: ["7", "8", "9"],
    answer: "8",
    ...overrides,
  } as Exercise;
}

describe("getChoiceOptionsForExercise", () => {
  it("builds options for true_false", () => {
    const exercise = baseExercise({ kind: "true_false", answer: true });
    expect(getChoiceOptionsForExercise(exercise)).toEqual([
      { key: "true", label: "נָכוֹן", value: "true" },
      { key: "false", label: "לֹא נָכוֹן", value: "false" },
    ]);
  });

  it("maps shape labels to Hebrew while preserving values", () => {
    const exercise = baseExercise({
      kind: "shape_choice",
      options: ["circle", "square"],
      answer: "circle",
    });
    expect(getChoiceOptionsForExercise(exercise)).toEqual([
      { key: "circle", label: "עִיגּוּל", value: "circle" },
      { key: "square", label: "רִיבּוּעַ", value: "square" },
    ]);
  });
});

describe("shuffleChoiceOptions", () => {
  it("shuffles deterministically with injected random function", () => {
    const options = [
      { key: "a", label: "A", value: "a" },
      { key: "b", label: "B", value: "b" },
      { key: "c", label: "C", value: "c" },
    ];
    const shuffled = shuffleChoiceOptions(options, () => 0);
    expect(shuffled.map((o) => o.key)).toEqual(["b", "c", "a"]);
    expect(shuffled).toHaveLength(options.length);
  });
});
