import { describe, expect, it } from "vitest";
import { getWorkbookDaysById } from "@/lib/content/workbook";
import { gradeGmatChallenge } from "@/lib/gmat-challenge/grading";
import { pickGmatChallengeItems } from "@/lib/gmat-challenge/picker";
import type { Exercise, ExerciseId } from "@/lib/types";

function exerciseMapForGrade(grade: "a" | "b"): Map<ExerciseId, Exercise> {
  const map = new Map<ExerciseId, Exercise>();
  for (const day of Object.values(getWorkbookDaysById(grade))) {
    for (const section of day.sections) {
      for (const ex of section.exercises) {
        map.set(ex.id, ex);
      }
    }
  }
  return map;
}

describe("gradeGmatChallenge", () => {
  it("scores at least one correct when one answer matches", () => {
    const grade = "a";
    const items = pickGmatChallengeItems({ grade, seed: "grade-seed", pickerVersion: 1 });
    const byId = exerciseMapForGrade(grade);
    const first = items.quant[0];
    const ex = byId.get(first);
    if (!ex) throw new Error("missing ex");
    let correct = "";
    if (ex.kind === "number_input" || ex.kind === "number_line_jump") correct = String(ex.answer);
    else if (ex.kind === "multiple_choice") correct = ex.answer;
    else if (ex.kind === "true_false") correct = ex.answer ? "true" : "false";
    else if (ex.kind === "verbal_input") correct = ex.answer;
    else if (ex.kind === "shape_choice") correct = ex.answer;

    const answers: Record<string, string> = {};
    for (const id of [...items.quant, ...items.verbal, ...items.data]) {
      answers[id] = "";
    }
    answers[first] = correct;

    const res = gradeGmatChallenge({ itemsBySection: items, exerciseById: byId, answers });
    expect(res.totalQuestions).toBe(22);
    expect(res.correctCount).toBeGreaterThanOrEqual(1);
  });
});
