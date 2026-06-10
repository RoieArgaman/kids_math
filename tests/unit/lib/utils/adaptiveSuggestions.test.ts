import { describe, expect, it } from "vitest";
import type { Exercise, ExerciseId, Section } from "@/lib/types";
import { findSectionForExercise, getWeakExercises } from "@/lib/utils/adaptiveSuggestions";

const makeExercise = (n: number): Exercise => ({
  id: `ex-${n}` as ExerciseId,
  kind: "number_input",
  prompt: `תרגיל ${n}`,
  answer: n,
  meta: { skillTags: ["addition"], difficulty: 1, representation: "abstract" },
});

const makeSection = (id: string, exercises: Exercise[]): Section => ({
  id: id as Section["id"],
  title: `מקטע ${id}`,
  learningGoal: "מטרה",
  type: "arithmetic",
  exercises,
});

describe("getWeakExercises", () => {
  it("returns empty array when all exercises are correct", () => {
    const ex1 = makeExercise(1);
    const ex2 = makeExercise(2);
    const sections = [makeSection("s1", [ex1, ex2])];
    const correct = { [ex1.id]: true, [ex2.id]: true } as Record<ExerciseId, boolean>;
    expect(getWeakExercises(sections, correct, 3)).toEqual([]);
  });

  it("returns wrong exercises first, then unanswered", () => {
    const ex1 = makeExercise(1);
    const ex2 = makeExercise(2);
    const ex3 = makeExercise(3);
    const sections = [makeSection("s1", [ex1, ex2, ex3])];
    const correct = {
      [ex1.id]: false,  // wrong
      [ex2.id]: true,   // correct — excluded
      // ex3 is unanswered
    } as Record<ExerciseId, boolean>;

    const result = getWeakExercises(sections, correct, 3);
    expect(result).toHaveLength(2);
    expect(result[0]!.id).toBe(ex1.id);  // wrong first
    expect(result[1]!.id).toBe(ex3.id);  // unanswered second
  });

  it("respects the limit", () => {
    const exercises = [1, 2, 3, 4, 5].map(makeExercise);
    const sections = [makeSection("s1", exercises)];
    const correct = {} as Record<ExerciseId, boolean>;
    expect(getWeakExercises(sections, correct, 2)).toHaveLength(2);
  });

  it("spans multiple sections", () => {
    const ex1 = makeExercise(1);
    const ex2 = makeExercise(2);
    const sections = [makeSection("s1", [ex1]), makeSection("s2", [ex2])];
    const correct = { [ex1.id]: true } as Record<ExerciseId, boolean>;
    const result = getWeakExercises(sections, correct, 3);
    expect(result).toHaveLength(1);
    expect(result[0]!.id).toBe(ex2.id);
  });

  it("returns empty array when limit is 0", () => {
    const ex1 = makeExercise(1);
    const sections = [makeSection("s1", [ex1])];
    const correct = {} as Record<ExerciseId, boolean>;
    expect(getWeakExercises(sections, correct, 0)).toEqual([]);
  });
});

describe("findSectionForExercise", () => {
  it("finds the section containing the exercise", () => {
    const ex1 = makeExercise(1);
    const ex2 = makeExercise(2);
    const s1 = makeSection("s1", [ex1]);
    const s2 = makeSection("s2", [ex2]);
    expect(findSectionForExercise([s1, s2], ex2.id as ExerciseId)?.id).toBe("s2");
  });

  it("returns undefined when exercise not found", () => {
    const s1 = makeSection("s1", [makeExercise(1)]);
    expect(findSectionForExercise([s1], "ex-99" as ExerciseId)).toBeUndefined();
  });
});
