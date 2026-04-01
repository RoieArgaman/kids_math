import { describe, expect, it } from "vitest";
import { classifyGmatSection } from "@/lib/gmat-challenge/classifier";
import type { NumberInputExercise } from "@/lib/types";

function baseMeta(tags: NumberInputExercise["meta"]["skillTags"]) {
  return {
    skillTags: tags,
    difficulty: 1 as const,
    representation: "abstract" as const,
  };
}

describe("classifyGmatSection", () => {
  it("routes word-problems to verbal", () => {
    const ex: NumberInputExercise = {
      id: "day-1-section-1-exercise-1",
      kind: "number_input",
      prompt: "p",
      answer: 1,
      meta: baseMeta(["word-problems"]),
    };
    expect(classifyGmatSection(ex)).toBe("verbal");
  });


  it("defaults to quant", () => {
    const ex: NumberInputExercise = {
      id: "day-1-section-1-exercise-1",
      kind: "number_input",
      prompt: "p",
      answer: 1,
      meta: baseMeta(["addition"]),
    };
    expect(classifyGmatSection(ex)).toBe("quant");
  });
});
