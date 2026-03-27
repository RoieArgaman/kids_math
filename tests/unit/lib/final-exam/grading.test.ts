import { describe, expect, it } from "vitest";
import { FINAL_EXAM_QUESTION_COUNT } from "@/lib/final-exam/config";
import { gradeFinalExam } from "@/lib/final-exam/grading";
import type { Exercise, ExerciseId } from "@/lib/types";

function makeExercises(count: number): Exercise[] {
  const out: Exercise[] = [];
  for (let i = 0; i < count; i += 1) {
    const id = `day-1-section-1-exercise-${i + 1}` as ExerciseId;
    out.push({
      id,
      kind: "number_input",
      prompt: `שאלה ${i + 1}`,
      answer: i + 1,
      meta: { skillTags: [], difficulty: 1, representation: "abstract" },
    });
  }
  return out;
}

describe("gradeFinalExam", () => {
  it("requires all questions answered to finish", () => {
    const selectedExercises = makeExercises(FINAL_EXAM_QUESTION_COUNT);
    const answers: Record<ExerciseId, string> = {} as Record<ExerciseId, string>;
    // Only answer one.
    answers[selectedExercises[0]!.id] = "1";

    const graded = gradeFinalExam({ selectedExercises, answers });
    expect(graded.answeredCount).toBe(1);
    expect(graded.canFinish).toBe(false);
  });

  it("passes at >=85% with Math.round scoring (26/30 => 87%)", () => {
    const selectedExercises = makeExercises(FINAL_EXAM_QUESTION_COUNT);
    const answers: Record<ExerciseId, string> = {} as Record<ExerciseId, string>;

    // First 26 correct, remaining 4 wrong (but non-empty).
    for (let i = 0; i < FINAL_EXAM_QUESTION_COUNT; i += 1) {
      const ex = selectedExercises[i]!;
      answers[ex.id] = i < 26 ? String(i + 1) : "999";
    }

    const graded = gradeFinalExam({ selectedExercises, answers });
    expect(graded.canFinish).toBe(true);
    expect(graded.correctCount).toBe(26);
    expect(graded.scorePercent).toBe(87);
    expect(graded.passed).toBe(true);
  });

  it("fails below 85% (25/30 => 83%)", () => {
    const selectedExercises = makeExercises(FINAL_EXAM_QUESTION_COUNT);
    const answers: Record<ExerciseId, string> = {} as Record<ExerciseId, string>;

    for (let i = 0; i < FINAL_EXAM_QUESTION_COUNT; i += 1) {
      const ex = selectedExercises[i]!;
      answers[ex.id] = i < 25 ? String(i + 1) : "999";
    }

    const graded = gradeFinalExam({ selectedExercises, answers });
    expect(graded.canFinish).toBe(true);
    expect(graded.correctCount).toBe(25);
    expect(graded.scorePercent).toBe(83);
    expect(graded.passed).toBe(false);
  });
});

